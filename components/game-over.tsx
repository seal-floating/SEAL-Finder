"use client"

import { useEffect, useState } from "react"
import type { GameState, GameLevel } from "@/types/game"
import { Button } from "@/components/ui/button"
import { formatTime } from "@/lib/utils"
import { Home, RotateCcw, Trophy, MessageCircle, AlertCircle, RefreshCw, Code } from "lucide-react"
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
    // Auto-submit Telegram score (if running in Telegram WebApp and not in development)
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
      
      // Import the functions to ensure we're using the latest version
      const { submitGameScore, initTelegramWebApp, getTelegramUser } = await import("@/lib/telegram");
      
      // Try to initialize Telegram WebApp again before submitting score
      if (!isDevelopment()) {
        // Log environment before initialization
        console.log('Environment before initialization:', {
          hostname: window.location.hostname,
          search: window.location.search,
          pathname: window.location.pathname,
          telegramWebAppExists: typeof window.Telegram !== 'undefined' && typeof window.Telegram.WebApp !== 'undefined'
        });
        
        // Check for user ID in URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const startParam = urlParams.get('tgWebAppStartParam');
        const userId = urlParams.get('user') || urlParams.get('id');
        
        if (startParam || userId) {
          console.log('Found URL parameters in game-over:', { startParam, userId });
        }
        
        // Initialize Telegram WebApp
        await initTelegramWebApp();
        
        // Check if we have the user after initialization
        const user = getTelegramUser();
        if (user) {
          console.log('User found before score submission:', user.telegramId);
        } else {
          console.warn('User still not found after initialization, will attempt submission anyway');
        }
      }
      
      const result = await submitGameScore(score);
      
      if (result.success) {
        setTelegramScoreSubmitted(true);
        toast.success(result.newHighScore 
          ? 'New high score registered!' 
          : 'Score submitted successfully.');
      } else {
        setSubmitError(result.error || 'Unknown error');
        toast.error('Failed to submit score: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting Telegram score:', error);
      
      // Extract and format error message
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Provide more user-friendly error messages
      if (errorMessage.includes('Telegram user information not found')) {
        if (isDevelopment()) {
          // In development, suggest refreshing
          errorMessage = 'Development mode: Mock Telegram user not detected. Try refreshing the page.';
        } else {
          // In production, give more context
          errorMessage = 'Cannot submit score: Telegram user information not found. Please try opening this game directly from Telegram.';
        }
      }
      
      setSubmitError(errorMessage);
      toast.error(errorMessage);
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
            
            {gameState === "won" && !isTelegramWebAppAvailable() && !isDevelopment() && (
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Open in Telegram to submit your score to the leaderboard
                </p>
              </div>
            )}
            
            {isDevelopment() && (
              <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-md mb-4 flex items-center gap-2">
                <Code className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <p className="text-sm text-purple-800 dark:text-purple-300">
                  Development Mode: Score submission will be simulated
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
          <p className="mb-2">{remainingTime === 0 ? "You ran out of time!" : "You hit a failure!"}</p>
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
            <span className="text-xs">Leaderboard</span>
          </Button>
          
          {gameState === "won" && (
            <Button
              onClick={handleSubmitTelegramScore}
              variant="outline"
              className={`flex flex-col items-center justify-center py-2 h-auto ${
                isDevelopment() 
                  ? "bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900 dark:hover:bg-purple-800 dark:border-purple-700 dark:text-purple-300"
                  : "bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900 dark:hover:bg-blue-800 dark:border-blue-700 dark:text-blue-300"
              }`}
              disabled={telegramScoreSubmitted || submittingScore}
            >
              {submittingScore ? (
                <RefreshCw className="w-5 h-5 mb-1 animate-spin" />
              ) : isDevelopment() ? (
                <Code className="w-5 h-5 mb-1" />
              ) : (
                <MessageCircle className="w-5 h-5 mb-1" />
              )}
              <span className="text-xs">
                {submittingScore 
                  ? 'Submitting...' 
                  : telegramScoreSubmitted 
                    ? 'Submitted' 
                    : submitError 
                      ? 'Retry' 
                      : isDevelopment() 
                        ? 'Submit (Dev)' 
                        : 'Submit Score'
                }
              </span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

