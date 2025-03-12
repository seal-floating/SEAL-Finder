import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    console.log('Direct leaderboard API called, fetching from Redis...');
    
    // Use our Redis leaderboard function directly
    const leaderboard = await getLeaderboard();
    
    console.log(`Retrieved ${leaderboard.length} entries from Redis leaderboard`);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      entries: leaderboard,
      count: leaderboard.length
    });
  } catch (error) {
    console.error('Error getting leaderboard directly from Redis:', error);
    return NextResponse.json({ 
      error: 'Failed to get leaderboard',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}