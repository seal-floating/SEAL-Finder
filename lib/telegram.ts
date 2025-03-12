// 텔레그램 웹앱 타입 정의
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

// 텔레그램 사용자 정보 가져오기
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

// 텔레그램 웹앱이 사용 가능한지 확인
export function isTelegramWebAppAvailable() {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
}

// 게임 점수 제출
export async function submitGameScore(score: number) {
  const user = getTelegramUser();
  
  if (!user) {
    throw new Error('텔레그램 사용자 정보를 찾을 수 없습니다.');
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
      throw new Error('점수 제출 중 오류가 발생했습니다.');
    }
    
    return await response.json();
  } catch (error) {
    console.error('점수 제출 중 오류:', error);
    throw error;
  }
}

// 텔레그램 웹앱 초기화
export function initTelegramWebApp() {
  if (isTelegramWebAppAvailable()) {
    // 웹앱 준비 완료 알림
    window.Telegram.WebApp.ready();
    
    // 웹앱 확장 (전체 화면)
    window.Telegram.WebApp.expand();
  }
} 