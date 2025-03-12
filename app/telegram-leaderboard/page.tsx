import TelegramLeaderboard from '@/app/components/TelegramLeaderboard';

export const metadata = {
  title: '텔레그램 리더보드 | Find the SEAL',
  description: '텔레그램 사용자들의 Find the SEAL 게임 리더보드입니다.',
};

export default function TelegramLeaderboardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-emerald-50 dark:bg-emerald-950">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-emerald-800 dark:text-emerald-200">
          텔레그램 리더보드
        </h1>
        <TelegramLeaderboard />
      </div>
    </main>
  );
} 