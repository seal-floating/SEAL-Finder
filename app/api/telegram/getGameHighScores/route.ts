import { NextRequest, NextResponse } from 'next/server';

// Telegram Bot API base URL
const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

// Get bot token from environment variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function GET(request: NextRequest) {
  try {
    // Check if bot token is configured
    if (!BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN is not configured');
      return NextResponse.json({ 
        error: 'Bot token not configured' 
      }, { status: 500 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const gameShortName = searchParams.get('gameShortName');

    // Validate required parameters
    if (!userId || !gameShortName) {
      console.error('Missing required parameters:', { userId, gameShortName });
      return NextResponse.json({ 
        error: 'Missing required parameters', 
        details: { 
          userId: !!userId, 
          gameShortName: !!gameShortName 
        } 
      }, { status: 400 });
    }

    console.log(`Getting high scores for game ${gameShortName}`);

    // Call Telegram Bot API to get high scores
    const telegramApiUrl = `${TELEGRAM_API_BASE}${BOT_TOKEN}/getGameHighScores`;
    
    const telegramResponse = await fetch(`${telegramApiUrl}?user_id=${userId}&game_short_name=${gameShortName}`);

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
    console.error('Error getting high scores:', error);
    return NextResponse.json({ 
      error: 'Server error occurred', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 