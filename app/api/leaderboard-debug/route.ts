import { NextRequest, NextResponse } from 'next/server';
import { redis, getActiveSeasonId } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    // Get active season ID
    const seasonId = await getActiveSeasonId();
    
    // Get all keys in the database to diagnose what's there
    const allKeys = await redis.keys('*');
    
    // Get leaderboard keys
    const leaderboardKeys = allKeys.filter(key => key.includes('leaderboard'));
    
    // Get user keys
    const userKeys = allKeys.filter(key => key.includes('user:'));
    
    // Get the main leaderboard data
    const leaderboardKey = `leaderboard:${seasonId}`;
    const rawScores = await redis.zrange(leaderboardKey, 0, -1, { 
      rev: true,
      withScores: true 
    });
    
    // Format the scores
    const formattedScores = [];
    for (let i = 0; i < rawScores.length; i += 2) {
      const telegramId = rawScores[i];
      const score = parseInt(rawScores[i+1]);
      
      // Get user details
      let userDetails;
      try {
        userDetails = await redis.hgetall(`user:${telegramId}`);
      } catch (e) {
        userDetails = { error: 'Failed to get user details' };
      }
      
      formattedScores.push({
        telegramId,
        score,
        userDetails
      });
    }
    
    // Return detailed debug info
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      activeSeasonId: seasonId,
      allKeys,
      leaderboardKeys,
      userKeys,
      leaderboardKey,
      rawScores,
      formattedScores,
      // Also include environment info (redacted)
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        redis: {
          KV_REST_API_URL: process.env.KV_REST_API_URL ? 'set' : 'not set',
          KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'set' : 'not set',
          KV_URL: process.env.KV_URL ? 'set' : 'not set'
        }
      }
    });
  } catch (error) {
    console.error('Error debugging leaderboard:', error);
    
    // Return an error response
    return NextResponse.json({ 
      error: 'Failed to debug leaderboard',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}