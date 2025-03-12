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
  return null;
}

// Check if Telegram WebApp is available
export function isTelegramWebAppAvailable() {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
}

// Submit game score
export async function submitGameScore(score: number) {
  const user = getTelegramUser();
  
  if (!user) {
    throw new Error('Telegram user information not found');
  }
  
  try {
    const response = await fetch('/api/scores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...user,
        score
      }),
    });
    
    if (!response.ok) {
      throw new Error('Error submitting score');
    }
    
    return await response.json();
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
  }
} 