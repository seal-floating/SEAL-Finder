import { NextRequest, NextResponse } from 'next/server';

// Telegram Bot API base URL
const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

// Get bot token from environment variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(request: NextRequest) {
  try {
    // Check if bot token is configured
    if (!BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN is not configured');
      return NextResponse.json({ 
        error: 'Bot token not configured' 
      }, { status: 500 });
    }

    // Parse request body
    const body = await request.json();
    const { userId, score, gameShortName } = body;

    // Validate required parameters
    if (!userId || score === undefined || !gameShortName) {
      console.error('Missing required parameters:', { userId, score, gameShortName });
      return NextResponse.json({ 
        error: 'Missing required parameters', 
        details: { 
          userId: !!userId, 
          score: score !== undefined, 
          gameShortName: !!gameShortName 
        } 
      }, { status: 400 });
    }

    console.log(`Setting game score for user ${userId}: ${score} in game ${gameShortName}`);

    // Call Telegram Bot API to set game score
    const telegramApiUrl = `${TELEGRAM_API_BASE}${BOT_TOKEN}/setGameScore`;
    
    const telegramResponse = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        score: Math.floor(score), // Telegram requires integer scores
        force: false, // Only update if the new score is higher than previous scores
        disable_edit_message: true,
        game_short_name: gameShortName
      }),
    });

    // Get response from Telegram
    const telegramData = await telegramResponse.json();
    
    console.log('Telegram API response:', telegramData);

    if (!telegramResponse.ok) {
      return NextResponse.json({ 
        error: 'Error from Telegram API', 
        details: telegramData 
      }, { status: telegramResponse.status });
    }

    return NextResponse.json(telegramData);
  } catch (error) {
    console.error('Error setting game score:', error);
    return NextResponse.json({ 
      error: 'Server error occurred', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 