import { redis, getActiveSeasonId } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { telegramId, username, firstName, lastName, photoUrl, score } = await request.json();

    // Validate required parameters
    if (!telegramId || score === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Get current active season
    const seasonId = await getActiveSeasonId();

    // Save user info (only update if first registration)
    const userKey = `users:${telegramId}`;
    const existingUser = await redis.get(userKey);
    
    if (!existingUser) {
      await redis.set(userKey, {
        username,
        firstName,
        lastName,
        photoUrl,
        registeredAt: Date.now()
      });
    }

    // Get user's current season high score
    const scoreKey = `scores:season:${seasonId}:${telegramId}`;
    const currentScore = await redis.get(scoreKey) as { score: number } | null;

    // Only update if new score is higher than existing score
    if (!currentScore || score > currentScore.score) {
      // Update score
      await redis.set(scoreKey, {
        score,
        updatedAt: Date.now()
      });

      // Leaderboard key
      const leaderboardKey = `leaderboard:season:${seasonId}`;
      
      // First remove any existing entries for this user
      await redis.zrem(leaderboardKey, telegramId);
      
      // Then add with new score
      await redis.zadd(leaderboardKey, { score, member: telegramId });

      return NextResponse.json({ 
        success: true, 
        message: 'New high score registered',
        newHighScore: true
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Score submitted but did not beat high score',
      newHighScore: false
    });
  } catch (error) {
    console.error('Error saving score:', error);
    return NextResponse.json({ error: 'Server error occurred' }, { status: 500 });
  }
}