import { redis, getActiveSeasonId } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Received score submission request');
    
    // Parse request body
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body));
    
    const { telegramId, username, firstName, lastName, photoUrl, score, timestamp } = body;

    // Validate required parameters
    if (!telegramId || score === undefined) {
      console.error('Missing required parameters:', { telegramId, score });
      return NextResponse.json({ 
        error: 'Missing required parameters', 
        details: { telegramId: !!telegramId, score: score !== undefined } 
      }, { status: 400 });
    }

    // Get current active season
    console.log('Getting active season ID');
    const seasonId = await getActiveSeasonId();
    console.log('Active season ID:', seasonId);

    // Save user info (only update if first registration)
    const userKey = `users:${telegramId}`;
    console.log('Checking if user exists:', userKey);
    
    try {
      const existingUser = await redis.get(userKey);
      console.log('Existing user:', existingUser);
      
      if (!existingUser) {
        console.log('Registering new user');
        await redis.set(userKey, {
          username,
          firstName,
          lastName,
          photoUrl,
          registeredAt: Date.now()
        });
        console.log('User registered successfully');
      }
    } catch (userError) {
      console.error('Error checking/saving user:', userError);
      // Continue with score submission even if user registration fails
    }

    // Get user's current season high score
    const scoreKey = `scores:season:${seasonId}:${telegramId}`;
    console.log('Getting current score:', scoreKey);
    
    try {
      const currentScore = await redis.get(scoreKey) as { score: number } | null;
      console.log('Current score:', currentScore);

      // Only update if new score is higher than existing score
      if (!currentScore || score > currentScore.score) {
        console.log('New high score detected, updating score');
        
        // Update score
        await redis.set(scoreKey, {
          score,
          updatedAt: Date.now()
        });
        console.log('Score updated successfully');

        // Leaderboard key
        const leaderboardKey = `leaderboard:season:${seasonId}`;
        console.log('Updating leaderboard:', leaderboardKey);
        
        try {
          // First remove any existing entries for this user
          await redis.zrem(leaderboardKey, telegramId);
          
          // Then add with new score
          await redis.zadd(leaderboardKey, { score, member: telegramId });
          console.log('Leaderboard updated successfully');
        } catch (leaderboardError) {
          console.error('Error updating leaderboard:', leaderboardError);
          // Return success even if leaderboard update fails
          return NextResponse.json({ 
            success: true, 
            message: 'Score saved but leaderboard update failed',
            newHighScore: true,
            error: 'Leaderboard update failed'
          });
        }

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
    } catch (scoreError) {
      console.error('Error checking/saving score:', scoreError);
      return NextResponse.json({ 
        error: 'Error processing score', 
        details: scoreError instanceof Error ? scoreError.message : 'Unknown error' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error saving score:', error);
    return NextResponse.json({ 
      error: 'Server error occurred', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}