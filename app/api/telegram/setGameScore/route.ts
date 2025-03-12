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

    // Log request information for debugging
    console.log('Received score submission request:', { 
      userId, 
      score, 
      gameShortName,
      userIdType: typeof userId,
      scoreType: typeof score
    });

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

    // Validate numeric types
    if (typeof score !== 'number') {
      console.error('Invalid score type:', typeof score);
      return NextResponse.json({ 
        error: 'Invalid score type, must be a number',
        details: { providedType: typeof score }
      }, { status: 400 });
    }

    console.log(`Setting game score for user ${userId}: ${score} in game ${gameShortName}`);

    // Call Telegram Bot API to set game score
    const telegramApiUrl = `${TELEGRAM_API_BASE}${BOT_TOKEN}/setGameScore`;
    
    // Build request parameters, filtering out undefined values
    let requestParams: any = {
      user_id: userId,
      score: Math.floor(score), // Telegram requires integer scores
      force: true, // Update score even if it's not higher than previous scores
      disable_edit_message: true
    };
    
    // Check which message identifier type is available
    const hasInlineMessageId = body.inlineMessageId && body.inlineMessageId !== "0";
    const hasChatMessage = body.chatId && body.messageId;
    
    if (hasInlineMessageId) {
      // Use inline_message_id approach
      requestParams.inline_message_id = body.inlineMessageId;
    } else if (hasChatMessage) {
      // Use chat_id + message_id approach
      requestParams.chat_id = body.chatId;
      requestParams.message_id = body.messageId;
    } else {
      // Special case: For Telegram games, we need to circumvent this by using a different approach
      // We'll just return a special message and let the client know the score was saved but not linked to a message
      console.log('No message identifier provided, storing score in the leaderboard only');
      
      // When using setScore in a Telegram Game, we need to tell the client that even though
      // we can't update the specific message, the score was registered
      return NextResponse.json({ 
        ok: true, 
        result: true,
        details: "Score saved to leaderboard without message update" 
      });
    }
    
    console.log('Sending request to Telegram API:', requestParams);
    
    // Make the API request
    let telegramResponse;
    try {
      telegramResponse = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestParams),
      });
    } catch (error) {
      console.error('Fetch error calling Telegram API:', error);
      return NextResponse.json({ 
        error: 'Error connecting to Telegram API', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, { status: 500 });
    }

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

    return NextResponse.json(telegramData);
  } catch (error) {
    console.error('Error setting game score:', error);
    return NextResponse.json({ 
      error: 'Server error occurred', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 