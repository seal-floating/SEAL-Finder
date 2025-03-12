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

// Mock data for development environment
const MOCK_USER = {
  telegramId: 'dev-user-123',
  username: 'dev_user',
  firstName: 'Dev',
  lastName: 'User',
  photoUrl: ''
};

const MOCK_LEADERBOARD = [
  {
    rank: 1,
    telegramId: 'dev-user-123',
    username: 'dev_user',
    firstName: 'Dev',
    lastName: 'User',
    score: 5000
  },
  {
    rank: 2,
    telegramId: 'dev-user-456',
    username: 'test_user',
    firstName: 'Test',
    lastName: 'User',
    score: 4500
  },
  {
    rank: 3,
    telegramId: 'dev-user-789',
    username: 'another_user',
    firstName: 'Another',
    lastName: 'User',
    score: 4000
  }
];

// Create a mock user for development
const createMockUser = () => {
  console.log('Creating mock Telegram user for development:', MOCK_USER.telegramId);
  return MOCK_USER;
};

// Get Telegram user information
export function getTelegramUser() {
  // In development mode, always return a mock user
  if (isDevelopment()) {
    return createMockUser();
  }
  
  try {
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
    
    // If we're in development mode but the check above didn't catch it, return mock user
    if (typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      console.log('Development environment detected, using mock user as fallback');
      return createMockUser();
    }
    
    console.warn('Telegram user information not found. WebApp available:', 
      typeof window !== 'undefined' ? !!window.Telegram?.WebApp : false);
    return null;
  } catch (error) {
    console.error('Error getting Telegram user:', error);
    // In development, return mock user even if there's an error
    if (isDevelopment()) {
      return createMockUser();
    }
    return null;
  }
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
  if (isDevelopment()) {
    return GAME_SHORT_NAME;
  }
  
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
  
  // Handle missing user information
  if (!user) {
    console.error('Telegram user information not found. WebApp available:', isTelegramWebAppAvailable());
    
    // For development or testing, create a mock user
    if (isDevelopment()) {
      console.log('Running in development mode, creating mock user for score submission');
      user = createMockUser();
    } else {
      // In production, check if we can retry to get the user
      try {
        // Try initializing Telegram WebApp first
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          console.log('Attempting to initialize Telegram WebApp before retrying');
          window.Telegram.WebApp.ready();
          
          // Wait a moment for initialization
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Try getting user again
          user = getTelegramUser();
        }
      } catch (err) {
        console.error('Error during Telegram WebApp initialization:', err);
      }
      
      // If still no user, throw error
      if (!user) {
        throw new Error('Error submitting score: Telegram user information not found');
      }
    }
  }
  
  console.log('Submitting score:', score, 'for user:', user);
  
  try {
    // Add a timestamp to help with debugging
    const timestamp = new Date().toISOString();
    
    // In development mode, use our custom API
    if (isDevelopment()) {
      console.log('Development mode: Using mock score submission');
      
      // Simulate API response delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return mock successful response
      return {
        success: true,
        message: 'Score submitted successfully (Development Mode)',
        newHighScore: score > 4000, // Mock high score check
        score: score,
        user: user
      };
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
        throw new Error('Invalid response format from Telegram API');
      }
      
      if (!response.ok) {
        console.error('Error submitting score to Telegram. Status:', response.status, 'Response:', responseData);
        throw new Error(responseData?.error || 'Error submitting score to Telegram API');
      }
      
      return {
        success: true,
        message: 'Score submitted to Telegram successfully',
        newHighScore: responseData.ok, // Telegram returns 'ok: true' if successful
        score: score,
        user: user
      };
    }
  } catch (error) {
    console.error('Error submitting score:', error);
    throw error;
  }
}

// Get high scores from Telegram GameScore API
export async function getGameHighScores() {
  // In development mode, return mock leaderboard data
  if (isDevelopment()) {
    console.log('Development mode: Using mock leaderboard data');
    
    // Simulate API response delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return MOCK_LEADERBOARD;
  }
  
  // Get user information
  let user = getTelegramUser();
  
  // Handle missing user information
  if (!user) {
    console.error('Telegram user information not found when fetching leaderboard. WebApp available:', isTelegramWebAppAvailable());
    
    // Try initializing Telegram WebApp first
    try {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        console.log('Attempting to initialize Telegram WebApp before retrying leaderboard fetch');
        window.Telegram.WebApp.ready();
        
        // Wait a moment for initialization
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Try getting user again
        user = getTelegramUser();
      }
    } catch (err) {
      console.error('Error during Telegram WebApp initialization for leaderboard:', err);
    }
    
    // If still no user and in development mode, use mock user
    if (!user) {
      if (isDevelopment()) {
        console.log('Using mock user for leaderboard in development mode');
        user = createMockUser();
        
        // Return mock leaderboard
        return MOCK_LEADERBOARD;
      } else {
        throw new Error('Unable to load leaderboard: Telegram user information not found');
      }
    }
  }
  
  try {
    // In production, use Telegram GameScore API
    console.log('Fetching leaderboard for user:', user.telegramId);
    const response = await fetch(`/api/telegram/getGameHighScores?userId=${user.telegramId}&gameShortName=${getGameShortName()}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error getting high scores from Telegram:', errorText);
      throw new Error('Unable to load leaderboard: Failed to get high scores from Telegram');
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
    
    // If no results, return empty array
    console.log('No leaderboard entries returned from Telegram API');
    return [];
  } catch (error) {
    console.error('Error getting high scores:', error);
    
    // In development, return mock data even if there's an error
    if (isDevelopment()) {
      console.log('Returning mock leaderboard data due to error in development mode');
      return MOCK_LEADERBOARD;
    }
    
    throw error;
  }
}

// Initialize Telegram WebApp
export function initTelegramWebApp() {
  if (isDevelopment()) {
    console.log('Development mode: Setting up mock Telegram WebApp environment');
    return true;
  }
  
  if (isTelegramWebAppAvailable()) {
    // Only call Telegram WebApp methods if it's actually available
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      try {
        // Notify WebApp is ready
        window.Telegram.WebApp.ready();
        
        // Expand WebApp (full screen)
        window.Telegram.WebApp.expand();
        
        console.log('Telegram WebApp initialized successfully');
        console.log('Game short name:', getGameShortName());
        
        // Log user data for debugging
        const userData = window.Telegram.WebApp.initDataUnsafe?.user;
        if (userData) {
          console.log('Telegram user data available:', {
            id: userData.id,
            username: userData.username,
            firstName: userData.first_name,
            hasPhoto: !!userData.photo_url
          });
        } else {
          console.warn('Telegram WebApp initialized but user data not available');
        }
        
        return true;
      } catch (error) {
        console.error('Error initializing Telegram WebApp:', error);
        return false;
      }
    }
  } else {
    console.log('Telegram WebApp not available');
    return false;
  }
  
  return false;
}

// Wait for Telegram WebApp to be available with timeout
export async function waitForTelegramWebApp(timeoutMs = 3000) {
  // In development mode, no need to wait
  if (isDevelopment()) {
    return true;
  }
  
  return new Promise<boolean>((resolve) => {
    // If already available, initialize immediately
    if (isTelegramWebAppAvailable()) {
      resolve(initTelegramWebApp());
      return;
    }
    
    // Set a timeout
    const timeout = setTimeout(() => {
      console.warn('Timed out waiting for Telegram WebApp');
      window.removeEventListener('TelegramWebAppReady', handleReady);
      resolve(false);
    }, timeoutMs);
    
    // Handler for when WebApp is ready
    const handleReady = () => {
      clearTimeout(timeout);
      window.removeEventListener('TelegramWebAppReady', handleReady);
      resolve(initTelegramWebApp());
    };
    
    // Listen for the WebApp ready event
    window.addEventListener('TelegramWebAppReady', handleReady);
    
    console.log('Waiting for Telegram WebApp to become available...');
  });
} 