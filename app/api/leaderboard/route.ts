import { redis, getActiveSeasonId } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters from URL
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId') || await getActiveSeasonId();
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    // Get leaderboard data (sorted by score in descending order)
    const leaderboardKey = `leaderboard:season:${seasonId}`;
    const leaderboardData = await redis.zrange(leaderboardKey, offset, offset + limit - 1, { 
      rev: true,
      withScores: true 
    });
    
    // Set for deduplication
    const uniqueIds = new Set<string>();
    
    // Enrich with user data (with deduplication)
    const enrichedLeaderboard = await Promise.all(
      leaderboardData
        .filter((entry: any) => {
          // Check if we've already processed this user ID
          if (uniqueIds.has(entry.member)) {
            return false;
          }
          // Record processed ID
          uniqueIds.add(entry.member);
          return true;
        })
        .map(async (entry: any, index: number) => {
          const telegramId = entry.member;
          const score = entry.score;
          
          // Get user data
          const userKey = `users:${telegramId}`;
          const userData = await redis.get(userKey) as any;
          
          return {
            rank: offset + index + 1,
            telegramId,
            score,
            username: userData?.username || 'Unknown',
            firstName: userData?.firstName,
            lastName: userData?.lastName,
            photoUrl: userData?.photoUrl
          };
        })
    );
    
    // Get season info
    const seasonKey = `seasons:${seasonId}`;
    const seasonInfo = await redis.get(seasonKey);
    
    return NextResponse.json({
      season: seasonInfo || { id: seasonId },
      leaderboard: enrichedLeaderboard,
      total: await redis.zcard(leaderboardKey)
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Server error occurred' }, { status: 500 });
  }
} 