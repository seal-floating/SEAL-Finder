"use client"

import { useEffect, useState } from "react"
import type { GameState, GameLevel } from "@/types/game"
import { Button } from "@/components/ui/button"
import { saveScore, getLeaderboard } from "@/lib/leaderboard-service"
import { formatTime } from "@/lib/utils"
import type { LeaderboardEntry } from "@/components/leaderboard"
import { Home, RotateCcw, Trophy, MessageCircle } from "lucide-react"
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
  const [rank, setRank] = useState<number | null>(null)
  const [savedEntry, setSavedEntry] = useState<LeaderboardEntry | null>(null)
  const [telegramScoreSubmitted, setTelegramScoreSubmitted] = useState(false)
  const [submittingScore, setSubmittingScore] = useState(false)
  const isTelegramAvailable = typeof window !== 'undefined' && isTelegramWebAppAvailable()

  // Calculate time used (totalTime - remainingTime)
  const timeUsed = totalTime - remainingTime
  
  // 게임 점수 계산 (난이도에 따라 가중치 부여)
  const calculateGameScore = () => {
    if (gameState !== "won") return 0;
    
    // 기본 점수: 남은 시간 * 10
    let baseScore = remainingTime * 10;
    
    // 난이도 가중치
    const difficultyMultiplier = {
      easy: 1,
      medium: 2,
      hard: 3
    };
    
    return Math.round(baseScore * difficultyMultiplier[level]);
  };

  useEffect(() => {
    // Only save score and calculate rank if the game was won
    if (gameState === "won") {
      // Save the score
      const entry = saveScore(level, timeUsed, sealsFound, totalSeals)
      setSavedEntry(entry)

      // Calculate rank
      const leaderboard = getLeaderboard()
      const levelScores = leaderboard
        .filter((e) => e.level === level && e.sealsFound === e.totalSeals)
        .sort((a, b) => a.time - b.time)

      const rankIndex = levelScores.findIndex((e) => e.id === entry.id)
      setRank(rankIndex !== -1 ? rankIndex + 1 : null)
      
      // 텔레그램 점수 자동 제출 (텔레그램 웹앱에서 실행 중인 경우)
      if (isTelegramAvailable) {
        handleSubmitTelegramScore();
      }
    }
  }, [gameState, level, timeUsed, sealsFound, totalSeals])

  // 텔레그램 점수 제출
  const handleSubmitTelegramScore = async () => {
    if (!isTelegramAvailable || gameState !== "won") return;
    
    setSubmittingScore(true);
    try {
      const score = calculateGameScore();
      const result = await submitGameScore(score);
      
      if (result.success) {
        setTelegramScoreSubmitted(true);
        toast.success(result.newHighScore 
          ? '새로운 최고 점수가 등록되었습니다!' 
          : '점수가 제출되었습니다.');
      }
    } catch (error) {
      console.error('텔레그램 점수 제출 오류:', error);
      toast.error('점수 제출 중 오류가 발생했습니다.');
    } finally {
      setSubmittingScore(false);
    }
  };

  const levelText = {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-10">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
        <h2 className="text-2xl font-bold mb-4">{gameState === "won" ? "🎉 You Won! 🎉" : "💥 Game Over 💥"}</h2>

        <p className="mb-2">
          {gameState === "won"
            ? `You found all ${totalSeals} seals!`
            : remainingTime === 0
              ? `Time's up! You found ${sealsFound} out of ${totalSeals} seals.`
              : `You found ${sealsFound} out of ${totalSeals} seals.`}
        </p>

        <p className="mb-1">Level: {levelText[level]}</p>

        {gameState === "won" ? (
          <>
            <p className="mb-2">Time used: {formatTime(timeUsed)}</p>
            <p className="mb-4">Score: {calculateGameScore().toLocaleString()}</p>
          </>
        ) : (
          <p className="mb-2">{remainingTime === 0 ? "You ran out of time!" : "You hit a failure!"}</p>
        )}

        {gameState === "won" && rank !== null && (
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-6">
            <p className="font-medium text-blue-800 dark:text-blue-300">{rank <= 3 ? `🏆 Amazing! You're ranked #${rank}` : `Your rank: #${rank}`}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <Button
            onClick={onBackToMenu}
            variant="secondary"
            className="flex flex-col items-center justify-center py-2 h-auto"
          >
            <Home className="w-5 h-5 mb-1" />
            <span className="text-xs">Menu</span>
          </Button>

          <Button onClick={onNewGame} className="flex flex-col items-center justify-center py-2 h-auto">
            <RotateCcw className="w-5 h-5 mb-1" />
            <span className="text-xs">Play Again</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onShowLeaderboard}
            variant="outline"
            className="flex flex-col items-center justify-center py-2 h-auto"
          >
            <Trophy className="w-5 h-5 mb-1" />
            <span className="text-xs">Ranking</span>
          </Button>
          
          {isTelegramAvailable && gameState === "won" && (
            <Button
              onClick={handleSubmitTelegramScore}
              variant="outline"
              className="flex flex-col items-center justify-center py-2 h-auto bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900 dark:hover:bg-blue-800 dark:border-blue-700 dark:text-blue-300"
              disabled={telegramScoreSubmitted || submittingScore}
            >
              <MessageCircle className="w-5 h-5 mb-1" />
              <span className="text-xs">
                {submittingScore ? '제출 중...' : telegramScoreSubmitted ? '제출 완료' : '텔레그램 점수 제출'}
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

