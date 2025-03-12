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
  if (process.env.NODE_ENV === 'development') {
    console.log('Using mock Telegram user for development');
    return {
      telegramId: 'dev-user-' + Math.floor(Math.random() * 1000),
      username: 'dev_user',
      firstName: 'Dev',
      lastName: 'User',
      photoUrl: ''
    };
  }
  
  return null;
}

// Check if Telegram WebApp is available
export function isTelegramWebAppAvailable() {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
}

// Submit game score
export async function submitGameScore(score: number) {
  let user = getTelegramUser();
  
  if (!user) {
    console.error('Telegram user information not found. WebApp available:', isTelegramWebAppAvailable());
    
    // For development or testing, create a mock user
    if (process.env.NODE_ENV === 'development') {
      user = {
        telegramId: 'dev-user-' + Math.floor(Math.random() * 1000),
        username: 'dev_user',
        firstName: 'Dev',
        lastName: 'User',
        photoUrl: ''
      };
      console.log('Created mock user for development:', user);
    } else {
      throw new Error('Telegram user information not found');
    }
  }
  
  console.log('Submitting score:', score, 'for user:', user);
  
  try {
    // Add a timestamp to help with debugging
    const timestamp = new Date().toISOString();
    
    const response = await fetch('/api/scores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...user,
        score,
        timestamp
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
  } catch (error) {
    console.error('Error submitting score:', error);
    throw error;
  }
}

// Initialize Telegram WebApp
export function initTelegramWebApp() {
  if (isTelegramWebAppAvailable()) {
    // Notify WebApp is ready
    window.Telegram.WebApp.ready();
    
    // Expand WebApp (full screen)
    window.Telegram.WebApp.expand();
    
    console.log('Telegram WebApp initialized successfully');
  } else {
    console.log('Telegram WebApp not available');
  }
} 