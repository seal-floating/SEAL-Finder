"use client"

import { useState, useEffect } from "react"
import GameBoard from "@/components/game-board"
import GameHeader from "@/components/game-header"
import GameOver from "@/components/game-over"
import LevelSelect from "@/components/level-select"
import Leaderboard, { type LeaderboardEntry } from "@/components/leaderboard"
import MainMenu from "@/components/main-menu"
import HowToPlay from "@/components/how-to-play"
import type { Cell, GameState, GameLevel } from "@/types/game"
import { generateBoard, LEVEL_CONFIGS } from "@/lib/game-utils"
import { getLeaderboard, getTelegramWebApp } from "@/lib/leaderboard-service"
import Script from "next/script"
import FloatingMenuButton from "@/components/floating-menu-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Toaster } from "sonner"

type AppScreen = "menu" | "game" | "howToPlay"

export default function Home() {
  // App navigation state
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("menu")

  // Game state
  const [gameState, setGameState] = useState<GameState>("playing")
  const [level, setLevel] = useState<GameLevel>("easy")
  const [board, setBoard] = useState<Cell[][]>([])
  const [remainingTime, setRemainingTime] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const [sealsFound, setSealsFound] = useState(0)
  const [totalSeals, setTotalSeals] = useState(0)
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)

  // Leaderboard state
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([])

  // Telegram state
  const [telegramReady, setTelegramReady] = useState(false)

  // Initialize Telegram WebApp
  useEffect(() => {
    const handleTelegramEvent = () => {
      setTelegramReady(true)
      const webApp = getTelegramWebApp()
      if (webApp) {
        webApp.ready()
        webApp.expand()
      }
    }

    if (typeof window !== "undefined") {
      if ("Telegram" in window && "WebApp" in (window as any).Telegram) {
        handleTelegramEvent()
      } else {
        window.addEventListener("TelegramWebAppReady", handleTelegramEvent)
      }
    }

    return () => {
      window.removeEventListener("TelegramWebAppReady", handleTelegramEvent)
    }
  }, [])

  const startNewGame = (newLevel?: GameLevel) => {
    // Clear any existing timer
    if (timerInterval) clearInterval(timerInterval)

    // Use provided level or current level
    const gameLevel = newLevel || level

    // Get time limit for the selected level
    const timeLimit = LEVEL_CONFIGS[gameLevel].timeLimit

    // Generate a new board based on the level
    const newBoard = generateBoard(gameLevel)
    const sealCount = newBoard.flat().filter((cell) => cell.hasSeal).length

    setBoard(newBoard)
    setGameState("playing")
    setRemainingTime(timeLimit)
    setTotalTime(timeLimit)
    setSealsFound(0)
    setTotalSeals(sealCount)

    // Start the countdown timer
    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        // If time is up, end the game
        if (prev <= 1) {
          clearInterval(interval)
          setGameState("lost")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    setTimerInterval(interval)

    // Switch to game screen if not already there
    setCurrentScreen("game")
  }

  // Handle level change
  const handleLevelChange = (newLevel: GameLevel) => {
    setLevel(newLevel)
    startNewGame(newLevel)
  }

  // Load leaderboard data
  const loadLeaderboard = () => {
    const entries = getLeaderboard()
    setLeaderboardEntries(entries)
    setShowLeaderboard(true)
  }

  // Clean up timer when component unmounts
  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval)
    }
  }, [timerInterval])

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    if (gameState !== "playing" || board[rowIndex][colIndex].isRevealed) return

    const newBoard = [...board]
    const cell = newBoard[rowIndex][colIndex]

    // Reveal the cell
    cell.isRevealed = true

    // Check if it's a failure (bomb)
    if (cell.hasFailure) {
      setGameState("lost")
      if (timerInterval) clearInterval(timerInterval)

      // Reveal all cells
      newBoard.forEach((row) => {
        row.forEach((cell) => {
          cell.isRevealed = true
        })
      })
    }
    // Check if it's a seal
    else if (cell.hasSeal) {
      const newSealsFound = sealsFound + 1
      setSealsFound(newSealsFound)

      // Check if all seals are found
      if (newSealsFound === totalSeals) {
        setGameState("won")
        if (timerInterval) clearInterval(timerInterval)
      }
    }

    setBoard(newBoard)
  }

  // Navigation handlers
  const handlePlayClick = () => {
    startNewGame()
  }

  const handleRankingClick = () => {
    loadLeaderboard()
  }

  const handleHowToPlayClick = () => {
    setCurrentScreen("howToPlay")
  }

  const handleTelegramLeaderboardClick = () => {
    window.location.href = '/telegram-leaderboard'
  }

  const handleBackToMenu = () => {
    // Clear any running game
    if (timerInterval) clearInterval(timerInterval)
    setCurrentScreen("menu")
  }

  // Add this effect to handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC key to return to main menu
      if (e.key === "Escape" && currentScreen === "game") {
        handleBackToMenu()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [currentScreen])

  const renderScreen = () => {
    switch (currentScreen) {
      case "menu":
        return <MainMenu 
          onPlay={handlePlayClick} 
          onRanking={handleRankingClick} 
          onHowToPlay={handleHowToPlayClick}
          onTelegramLeaderboard={handleTelegramLeaderboardClick}
        />

      case "howToPlay":
        return <HowToPlay onBack={handleBackToMenu} />

      case "game":
        return (
          <>
            <div className="p-4 bg-primary text-center">
              <h1 className="text-2xl font-bold text-black">Find the SEAL Game</h1>
              <p className="text-sm text-white">Find all the seals while avoiding failures!</p>
            </div>

            <LevelSelect currentLevel={level} onLevelChange={handleLevelChange} />

            <GameHeader
              remainingTime={remainingTime}
              totalTime={totalTime}
              sealsFound={sealsFound}
              totalSeals={totalSeals}
              onNewGame={() => startNewGame()}
              onShowLeaderboard={loadLeaderboard}
              onBackToMenu={handleBackToMenu}
            />

            <GameBoard board={board} level={level} onCellClick={handleCellClick} />

            {/* Floating menu button for mobile */}
            <FloatingMenuButton onClick={handleBackToMenu} />

            {gameState !== "playing" && (
              <GameOver
                gameState={gameState}
                remainingTime={remainingTime}
                totalTime={totalTime}
                sealsFound={sealsFound}
                totalSeals={totalSeals}
                onNewGame={() => startNewGame()}
                onShowLeaderboard={loadLeaderboard}
                onBackToMenu={handleBackToMenu}
                level={level}
              />
            )}
          </>
        )
    }
  }

  return (
    <>
      {/* Telegram WebApp Script */}
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <Toaster position="top-right" />

      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-emerald-50 dark:bg-emerald-950">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg shadow-lg overflow-hidden">{renderScreen()}</div>
      </main>

      {showLeaderboard && (
        <Leaderboard entries={leaderboardEntries} currentLevel={level} onClose={() => setShowLeaderboard(false)} />
      )}
      
      <ThemeToggle />
    </>
  )
}

