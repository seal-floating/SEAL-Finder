// Telegram WebApp type definitions
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
          };
          auth_date: number;
          hash: string;
          start_param?: string; // Game short name can be passed here
          game_short_name?: string; // Game short name
        };
        ready(): void;
        close(): void;
        expand(): void;
        showAlert(message: string): void;
        showConfirm(message: string): Promise<boolean>;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          show(): void;
          hide(): void;
          enable(): void;
          disable(): void;
          showProgress(leaveActive: boolean): void;
          hideProgress(): void;
          onClick(callback: () => void): void;
          offClick(callback: () => void): void;
          setText(text: string): void;
        };
      };
    };
  }
}

// Game configuration
const GAME_SHORT_NAME = process.env.NEXT_PUBLIC_TELEGRAM_GAME_SHORT_NAME || 'FindSealGame';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; // This should be kept server-side only

// Check if we're in development mode
const isDevelopment = () => {
  // Check if we're in a development environment
  // This works in both client and server contexts
  return typeof window !== 'undefined' 
    ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    : process.env.NODE_ENV === 'development';
};

// Create a mock user for development
const createMockUser = () => {
  // Use a fixed ID for development to maintain consistency
  const mockId = 'dev-user-123';
  console.log('Creating mock Telegram user for development:', mockId);
  return {
    telegramId: mockId,
    username: 'dev_user',
    firstName: 'Dev',
    lastName: 'User',
    photoUrl: ''
  };
};

// Get Telegram user information
export function getTelegramUser() {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
    const { user } = window.Telegram.WebApp.initDataUnsafe;
    return {
      telegramId: user.id.toString(),
      username: user.username || '',
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      photoUrl: user.photo_url || ''
    };
  }
  
  // For testing outside of Telegram, create a mock user
  if (isDevelopment()) {
    return createMockUser();
  }
  
  return null;
}

// Check if Telegram WebApp is available
export function isTelegramWebAppAvailable() {
  // In development, always return true for testing purposes
  if (isDevelopment()) {
    return true;
  }
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
}

// Get game short name from Telegram WebApp
export function getGameShortName() {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe) {
    return window.Telegram.WebApp.initDataUnsafe.game_short_name || 
           window.Telegram.WebApp.initDataUnsafe.start_param || 
           GAME_SHORT_NAME;
  }
  return GAME_SHORT_NAME;
}

// Submit game score using Telegram GameScore API
export async function submitGameScore(score: number) {
  let user = getTelegramUser();
  
  if (!user) {
    console.error('Telegram user information not found. WebApp available:', isTelegramWebAppAvailable());
    
    // For development or testing, create a mock user
    if (isDevelopment()) {
      user = createMockUser();
    } else {
      throw new Error('Telegram user information not found');
    }
  }
  
  console.log('Submitting score:', score, 'for user:', user);
  
  try {
    // Add a timestamp to help with debugging
    const timestamp = new Date().toISOString();
    
    // In development mode, use our custom API
    if (isDevelopment()) {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...user,
          score,
          timestamp,
          isDevelopment: true
        }),
      });
      
      // Log the response status
      console.log('Score submission response status:', response.status);
      
      // Get the response text for debugging
      const responseText = await response.text();
      console.log('Score submission response text:', responseText);
      
      // Parse the response if it's JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('Invalid response format');
      }
      
      if (!response.ok) {
        console.error('Error submitting score. Status:', response.status, 'Response:', responseData);
        throw new Error(responseData?.error || 'Error submitting score');
      }
      
      return responseData;
    } 
    // In production, use Telegram GameScore API
    else {
      // This should be a server-side API call to protect the bot token
      const response = await fetch('/api/telegram/setGameScore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.telegramId,
          score,
          gameShortName: getGameShortName()
        }),
      });
      
      // Log the response status
      console.log('Telegram GameScore API response status:', response.status);
      
      // Get the response text for debugging
      const responseText = await response.text();
      console.log('Telegram GameScore API response text:', responseText);
      
      // Parse the response if it's JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error('Invalid response format');
      }
      
      if (!response.ok) {
        console.error('Error submitting score to Telegram. Status:', response.status, 'Response:', responseData);
        throw new Error(responseData?.error || 'Error submitting score to Telegram');
      }
      
      return {
        success: true,
        message: 'Score submitted to Telegram successfully',
        newHighScore: responseData.ok // Telegram returns 'ok: true' if successful
      };
    }
  } catch (error) {
    console.error('Error submitting score:', error);
    throw error;
  }
}

// Get high scores from Telegram GameScore API
export async function getGameHighScores() {
  let user = getTelegramUser();
  
  if (!user && !isDevelopment()) {
    throw new Error('Telegram user information not found');
  }
  
  try {
    // In development mode, use our custom API
    if (isDevelopment()) {
      const response = await fetch('/api/leaderboard?limit=20');
      const data = await response.json();
      return data.leaderboard || [];
    } 
    // In production, use Telegram GameScore API
    else {
      const response = await fetch(`/api/telegram/getGameHighScores?userId=${user?.telegramId}&gameShortName=${getGameShortName()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error getting high scores from Telegram:', errorText);
        throw new Error('Failed to get high scores from Telegram');
      }
      
      const data = await response.json();
      
      // Transform Telegram's format to our format
      if (data.result) {
        return data.result.map((entry: any, index: number) => ({
          rank: index + 1,
          telegramId: entry.user.id.toString(),
          username: entry.user.username || '',
          firstName: entry.user.first_name || '',
          lastName: entry.user.last_name || '',
          score: entry.score
        }));
      }
      
      return [];
    }
  } catch (error) {
    console.error('Error getting high scores:', error);
    throw error;
  }
}

// Initialize Telegram WebApp
export function initTelegramWebApp() {
  if (isTelegramWebAppAvailable() && !isDevelopment()) {
    // Only call Telegram WebApp methods if it's actually available
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      // Notify WebApp is ready
      window.Telegram.WebApp.ready();
      
      // Expand WebApp (full screen)
      window.Telegram.WebApp.expand();
      
      console.log('Telegram WebApp initialized successfully');
      console.log('Game short name:', getGameShortName());
    }
  } else {
    console.log('Telegram WebApp not available or in development mode');
  }
} 