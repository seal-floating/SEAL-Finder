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

    // Log request information for debugging
    console.log('Received high scores request:', { 
      userId, 
      gameShortName,
    });

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

    console.log(`Getting high scores for user ${userId} in game ${gameShortName}`);

    // Call Telegram Bot API to get high scores
    const telegramApiUrl = `${TELEGRAM_API_BASE}${BOT_TOKEN}/getGameHighScores`;
    const apiUrl = `${telegramApiUrl}?user_id=${encodeURIComponent(userId)}&game_short_name=${encodeURIComponent(gameShortName)}`;
    
    console.log('Calling Telegram API at:', apiUrl.replace(BOT_TOKEN, 'BOT_TOKEN_REDACTED'));

    const telegramResponse = await fetch(apiUrl);

    // Get response text from Telegram
    const telegramResponseText = await telegramResponse.text();
    
    // Try to parse as JSON
    let telegramData;
    try {
      telegramData = JSON.parse(telegramResponseText);
      console.log('Telegram API response:', telegramData);
    } catch (e) {
      console.error('Error parsing Telegram API response as JSON:', e);
      console.log('Raw Telegram API response:', telegramResponseText);
      
      return NextResponse.json({ 
        error: 'Error parsing Telegram API response', 
        details: telegramResponseText 
      }, { status: 500 });
    }

    if (!telegramResponse.ok) {
      console.error('Error from Telegram API. Status:', telegramResponse.status, 'Response:', telegramData);
      
      // Provide more specific error message based on Telegram API error
      let errorMessage = 'Error from Telegram API';
      if (telegramData?.description) {
        if (telegramData.description.includes('USER_NOT_FOUND')) {
          errorMessage = 'Telegram user not found';
        } else if (telegramData.description.includes('GAME_SHORT_NAME_INVALID')) {
          errorMessage = 'Invalid game short name';
        } else {
          errorMessage = telegramData.description;
        }
      }
      
      return NextResponse.json({ 
        error: errorMessage, 
        details: telegramData 
      }, { status: telegramResponse.status });
    }

    // If we have an empty result, log it but return as normal
    if (!telegramData.result || telegramData.result.length === 0) {
      console.log('No high scores found for this user and game');
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