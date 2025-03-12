"use client"

import { useEffect, useState } from "react"
import type { GameState, GameLevel } from "@/types/game"
import { Button } from "@/components/ui/button"
import { formatTime } from "@/lib/utils"
import { Home, RotateCcw, Trophy, MessageCircle, AlertCircle, RefreshCw } from "lucide-react"
import { isTelegramWebAppAvailable, submitGameScore } from "@/lib/telegram"
import { toast } from "sonner"

interface GameOverProps {
  gameState: GameState
  remainingTime: number
  totalTime: number
  sealsFound: number
  totalSeals: number
  level: GameLevel
  onNewGame: () => void
  onShowLeaderboard: () => void
  onBackToMenu?: () => void
}

// Check if we're in development mode
const isDevelopment = () => {
  // Check if we're in a development environment
  // This works in both client and server contexts
  return typeof window !== 'undefined' 
    ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    : process.env.NODE_ENV === 'development';
};

export default function GameOver({
  gameState,
  remainingTime,
  totalTime,
  sealsFound,
  totalSeals,
  level,
  onNewGame,
  onShowLeaderboard,
  onBackToMenu,
}: GameOverProps) {
  const [telegramScoreSubmitted, setTelegramScoreSubmitted] = useState(false)
  const [submittingScore, setSubmittingScore] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const isTelegramAvailable = typeof window !== 'undefined' && (isTelegramWebAppAvailable() || isDevelopment())

  // Calculate time used (totalTime - remainingTime)
  const timeUsed = totalTime - remainingTime
  
  // Calculate game score (with difficulty multiplier)
  const calculateGameScore = () => {
    if (gameState !== "won") return 0;
    
    // Base score: remaining time * 10
    let baseScore = remainingTime * 10;
    
    // Difficulty multiplier
    const difficultyMultiplier = {
      easy: 1,
      medium: 2,
      hard: 3
    };
    
    return Math.round(baseScore * difficultyMultiplier[level]);
  };

  useEffect(() => {
    // Auto-submit Telegram score (if running in Telegram WebApp)
    if (gameState === "won" && isTelegramAvailable && !isDevelopment()) {
      handleSubmitTelegramScore();
    }
  }, [gameState]);

  // Submit score to Telegram
  const handleSubmitTelegramScore = async () => {
    if (gameState !== "won") return;
    
    setSubmittingScore(true);
    setSubmitError(null);
    
    try {
      const score = calculateGameScore();
      console.log('Attempting to submit score:', score);
      
      const result = await submitGameScore(score);
      
      if (result.success) {
        setTelegramScoreSubmitted(true);
        toast.success(result.newHighScore 
          ? '새로운 최고 점수가 등록되었습니다!' 
          : '점수가 성공적으로 제출되었습니다.');
      } else {
        setSubmitError(result.error || '알 수 없는 오류');
        toast.error('점수 제출 실패: ' + (result.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('Error submitting Telegram score:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setSubmitError(errorMessage);
      toast.error('점수 제출 오류: ' + errorMessage);
    } finally {
      setSubmittingScore(false);
    }
  };

  const levelText = {
    easy: "쉬움",
    medium: "보통",
    hard: "어려움",
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
        <h2 className="text-2xl font-bold mb-4">{gameState === "won" ? "🎉 승리! 🎉" : "💥 게임 오버 💥"}</h2>

        <p className="mb-2">
          {gameState === "won"
            ? `${totalSeals}마리의 물개를 모두 찾았습니다!`
            : remainingTime === 0
              ? `시간 초과! ${totalSeals}마리 중 ${sealsFound}마리의 물개를 찾았습니다.`
              : `${totalSeals}마리 중 ${sealsFound}마리의 물개를 찾았습니다.`}
        </p>

        <p className="mb-1">난이도: {levelText[level]}</p>

        {gameState === "won" ? (
          <>
            <p className="mb-2">사용 시간: {formatTime(timeUsed)}</p>
            <p className="mb-4">점수: {calculateGameScore().toLocaleString()}</p>
            
            {gameState === "won" && !isTelegramWebAppAvailable() && !isDevelopment() && (
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  리더보드에 점수를 제출하려면 텔레그램에서 열어주세요
                </p>
              </div>
            )}
            
            {submitError && (
              <div className="bg-red-50 dark:bg-red-950 p-3 rounded-md mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-800 dark:text-red-300">
                  {submitError}
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="mb-2">{remainingTime === 0 ? "시간이 초과되었습니다!" : "실패했습니다!"}</p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <Button
            onClick={onBackToMenu}
            variant="secondary"
            className="flex flex-col items-center justify-center py-2 h-auto"
          >
            <Home className="w-5 h-5 mb-1" />
            <span className="text-xs">메뉴</span>
          </Button>

          <Button onClick={onNewGame} className="flex flex-col items-center justify-center py-2 h-auto">
            <RotateCcw className="w-5 h-5 mb-1" />
            <span className="text-xs">다시 하기</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onShowLeaderboard}
            variant="outline"
            className="flex flex-col items-center justify-center py-2 h-auto"
          >
            <Trophy className="w-5 h-5 mb-1" />
            <span className="text-xs">리더보드</span>
          </Button>
          
          {gameState === "won" && (
            isTelegramWebAppAvailable() ? (
              <Button
                onClick={handleSubmitTelegramScore}
                variant="outline"
                className="flex flex-col items-center justify-center py-2 h-auto bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900 dark:hover:bg-blue-800 dark:border-blue-700 dark:text-blue-300"
                disabled={telegramScoreSubmitted || submittingScore}
              >
                {submittingScore ? (
                  <RefreshCw className="w-5 h-5 mb-1 animate-spin" />
                ) : (
                  <MessageCircle className="w-5 h-5 mb-1" />
                )}
                <span className="text-xs">
                  {submittingScore ? '제출 중...' : telegramScoreSubmitted ? '제출 완료' : submitError ? '재시도' : '점수 제출'}
                </span>
              </Button>
            ) : isDevelopment() && (
              <Button
                onClick={handleSubmitTelegramScore}
                variant="outline"
                className="flex flex-col items-center justify-center py-2 h-auto bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900 dark:hover:bg-purple-800 dark:border-purple-700 dark:text-purple-300"
                disabled={telegramScoreSubmitted || submittingScore}
              >
                {submittingScore ? (
                  <RefreshCw className="w-5 h-5 mb-1 animate-spin" />
                ) : (
                  <MessageCircle className="w-5 h-5 mb-1" />
                )}
                <span className="text-xs">
                  {submittingScore ? '제출 중...' : telegramScoreSubmitted ? '제출 완료' : '개발 모드 제출'}
                </span>
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  )
}

