// Telegram WebApp type definitions
declare global {
  interface Window {
    // Track if Telegram WebApp initialization has been completed
    _telegramWebAppInitialized?: boolean;
    
    // Main Telegram WebApp interface
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

// Use this to check if we're running inside the actual Telegram app
const isRealTelegramApp = () => {
  if (typeof window === 'undefined') return false;
  
  // Check if Telegram WebApp exists
  if (!window.Telegram?.WebApp) return false;
  
  // Check if we have valid initData (this is only provided in real Telegram WebApp)
  return !!window.Telegram.WebApp.initData && window.Telegram.WebApp.initData.length > 10;
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
    // Detailed logging for troubleshooting
    if (typeof window !== 'undefined') {
      console.log('Telegram WebApp check:', {
        telegramExists: !!window.Telegram,
        webAppExists: !!window.Telegram?.WebApp,
        initDataUnsafeExists: !!window.Telegram?.WebApp?.initDataUnsafe,
        userExists: !!window.Telegram?.WebApp?.initDataUnsafe?.user,
        isRealTelegramApp: isRealTelegramApp()
      });
      
      // Log init data in a safe way (truncated)
      if (window.Telegram?.WebApp?.initData) {
        const initDataLength = window.Telegram.WebApp.initData.length;
        console.log(`Telegram initData available (length: ${initDataLength}), first 20 chars: ${
          window.Telegram.WebApp.initData.substring(0, 20)}...`);
      }
    }
    
    // Case 1: User data available in initDataUnsafe
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
      const { user } = window.Telegram.WebApp.initDataUnsafe;
      console.log('Found user in initDataUnsafe:', user);
      return {
        telegramId: user.id.toString(),
        username: user.username || '',
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        photoUrl: user.photo_url || ''
      };
    }
    
    // Case 2: We're in the real Telegram app but user info is missing - try to extract from query params
    if (isRealTelegramApp() && typeof window !== 'undefined') {
      // Try to get user ID from the URL query parameters (Telegram sometimes puts it there)
      const urlParams = new URLSearchParams(window.location.search);
      const userId = urlParams.get('tgWebAppStartParam') || urlParams.get('user') || urlParams.get('id');
      
      if (userId) {
        console.log('Found user id in URL parameters:', userId);
        return {
          telegramId: userId,
          username: 'user_' + userId.substring(0, 6),
          firstName: 'Telegram',
          lastName: 'User',
          photoUrl: ''
        };
      }
    }
    
    // Case 3: If we're in development mode but the check above didn't catch it, return mock user
    if (typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      console.log('Development environment detected, using mock user as fallback');
      return createMockUser();
    }
    
    // Case 4: If we're in a production environment but not in Telegram, or missing user info
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
      // Get additional details that might be available in the Telegram WebApp
      let inlineMessageId = "";
      let chatId = null;
      let messageId = null;
      
      // Try to get information from Telegram WebApp if available
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const webApp = window.Telegram.WebApp;
        
        // Check if startParam could be used as inline_message_id
        if (webApp.initDataUnsafe?.start_param) {
          inlineMessageId = webApp.initDataUnsafe.start_param;
          console.log('Using start_param as inline_message_id:', inlineMessageId);
        }
        
        // Check URL parameters as a fallback
        if (!inlineMessageId && typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const startParam = urlParams.get('tgWebAppStartParam') || urlParams.get('startapp');
          if (startParam) {
            inlineMessageId = startParam;
            console.log('Using URL param as inline_message_id:', inlineMessageId);
          }
        }
      }
      
      console.log('Submitting score with context:', { 
        userId: user.telegramId, 
        score, 
        inlineMessageId,
        chatId,
        messageId
      });

      const response = await fetch('/api/telegram/setGameScore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.telegramId,
          score,
          gameShortName: getGameShortName(),
          inlineMessageId, // Add inline_message_id if we have it
          chatId,          // Add chat_id if we have it
          messageId        // Add message_id if we have it
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
        
        // Handle the case when Telegram API fails - fall back to Redis
        try {
          console.log('Falling back to Redis for score storage');
          const { storeScore } = await import('@/lib/redis');
          
          // Store score in Redis
          const result = await storeScore(
            user.telegramId,
            user.username || '',
            user.firstName || '',
            user.lastName || '',
            score
          );
          
          if (result) {
            console.log('Successfully stored score in Redis as fallback');
            return {
              success: true,
              message: 'Score saved to leaderboard (Redis fallback)',
              newHighScore: false, // We don't know if it's a high score when using Redis
              score: score,
              user: user
            };
          }
        } catch (redisError) {
          console.error('Redis fallback also failed:', redisError);
        }
        
        // If Redis also fails, throw the original error
        throw new Error(responseData?.error || 'Error submitting score to Telegram API');
      }
      
      // Try to also save the score in Redis for redundancy
      try {
        const { storeScore } = await import('@/lib/redis');
        await storeScore(
          user.telegramId,
          user.username || '',
          user.firstName || '',
          user.lastName || '',
          score
        );
      } catch (redisError) {
        console.warn('Failed to store score in Redis (redundant storage):', redisError);
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
    
    try {
      const response = await fetch(`/api/telegram/getGameHighScores?userId=${user.telegramId}&gameShortName=${getGameShortName()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error getting high scores from Telegram:', errorText);
        console.log('Falling back to Redis leaderboard due to Telegram API error');
        
        // Import and use Redis-based fallback leaderboard
        const { getLeaderboard } = await import('@/lib/redis');
        const redisLeaderboard = await getLeaderboard();
        
        if (redisLeaderboard && redisLeaderboard.length > 0) {
          console.log(`Loaded ${redisLeaderboard.length} entries from Redis fallback leaderboard`);
          return redisLeaderboard;
        }
        
        throw new Error('Unable to load leaderboard: Failed to get high scores from both Telegram and Redis');
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
      
      // If no results, try Redis fallback
      console.log('No leaderboard entries returned from Telegram API, trying Redis fallback');
      const { getLeaderboard } = await import('@/lib/redis');
      const redisLeaderboard = await getLeaderboard();
      
      if (redisLeaderboard && redisLeaderboard.length > 0) {
        console.log(`Loaded ${redisLeaderboard.length} entries from Redis fallback leaderboard`);
        return redisLeaderboard;
      }
      
      // If still no results, return empty array
      return [];
    } catch (error) {
      console.error('Error in getGameHighScores:', error);
      
      // Final fallback to Redis
      try {
        console.log('Attempting final Redis fallback for leaderboard');
        const { getLeaderboard } = await import('@/lib/redis');
        return await getLeaderboard();
      } catch (redisError) {
        console.error('Redis fallback also failed:', redisError);
        return [];
      }
    }
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
  
  if (typeof window === 'undefined') {
    console.log('Running on server side - skipping Telegram WebApp initialization');
    return false;
  }
  
  // Log if we're in a real Telegram app environment
  console.log('Is real Telegram app:', isRealTelegramApp());
  
  if (isTelegramWebAppAvailable()) {
    // Only call Telegram WebApp methods if it's actually available
    if (window.Telegram?.WebApp) {
      try {
        // Extract any query parameters before initializing
        // This needs to happen before WebApp initialization might clear them
        const urlParams = new URLSearchParams(window.location.search);
        const startParam = urlParams.get('tgWebAppStartParam');
        const userId = urlParams.get('user') || urlParams.get('id');
        
        if (startParam || userId) {
          console.log('Found URL parameters before initialization:', { startParam, userId });
        }
        
        // Notify WebApp is ready
        window.Telegram.WebApp.ready();
        
        // Expand WebApp (full screen)
        window.Telegram.WebApp.expand();
        
        console.log('Telegram WebApp initialized successfully');
        console.log('Game short name:', getGameShortName());
        
        // Create a global reference to ensure consistent access
        if (!window._telegramWebAppInitialized) {
          window._telegramWebAppInitialized = true;
          console.log('WebApp initialization marked as complete');
        }
        
        // Check if there's any initData
        if (window.Telegram.WebApp.initData) {
          console.log('initData present after initialization, length:', window.Telegram.WebApp.initData.length);
        } else {
          console.warn('No initData after initialization');
        }
        
        // Log user data for debugging
        const userData = window.Telegram.WebApp.initDataUnsafe?.user;
        if (userData) {
          console.log('Telegram user data available after initialization:', {
            id: userData.id,
            username: userData.username,
            firstName: userData.first_name,
            hasPhoto: !!userData.photo_url
          });
        } else {
          console.warn('Telegram WebApp initialized but user data not available');
          
          // Try alternative methods to get user data
          if (window.Telegram.WebApp.initDataUnsafe) {
            console.log('initDataUnsafe contents:', 
              JSON.stringify(window.Telegram.WebApp.initDataUnsafe).substring(0, 100) + '...');
          }
        }
        
        return true;
      } catch (error) {
        console.error('Error initializing Telegram WebApp:', error);
        return false;
      }
    }
  } else {
    console.log('Telegram WebApp not available');
    
    // Add polyfill for development and testing outside Telegram
    if (!isDevelopment() && !window.Telegram && isRunningStandalone()) {
      console.log('Running in standalone mode outside Telegram - using basic polyfill');
      
      // Create a minimal Telegram WebApp object to prevent errors
      window.Telegram = {
        WebApp: {
          initData: '',
          initDataUnsafe: {},
          ready: () => console.log('Mock ready called'),
          expand: () => console.log('Mock expand called'),
          showAlert: (msg: string) => window.alert(msg)
        }
      };
      
      return true;
    }
    
    return false;
  }
  
  return false;
}

// Check if the app is running as standalone (not in Telegram, not in development)
function isRunningStandalone() {
  return typeof window !== 'undefined' && 
    !isDevelopment() && 
    !isRealTelegramApp() && 
    !window.Telegram?.WebApp;
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