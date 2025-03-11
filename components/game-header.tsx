"use client"

import { Button } from "@/components/ui/button"
import { Clock, Target, Trophy, Home } from "lucide-react"
import { formatTime, getTimeColor } from "@/lib/utils"

interface GameHeaderProps {
  remainingTime: number
  totalTime: number
  sealsFound: number
  totalSeals: number
  onNewGame: () => void
  onShowLeaderboard: () => void
  onBackToMenu: () => void
}

export default function GameHeader({
  remainingTime,
  totalTime,
  sealsFound,
  totalSeals,
  onNewGame,
  onShowLeaderboard,
  onBackToMenu,
}: GameHeaderProps) {
  const timeColor = getTimeColor(remainingTime, totalTime)

  return (
    <div className="p-4 border-b flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBackToMenu}
          title="Back to Menu"
          className="flex items-center gap-1"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">Menu</span>
        </Button>

        <div className="flex items-center space-x-2">
          <Clock className={`w-4 h-4 ${timeColor}`} />
          <span className={`font-mono ${timeColor}`}>{formatTime(remainingTime)}</span>
        </div>

        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          <span className="text-black dark:text-white">
            {sealsFound}/{totalSeals}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={onShowLeaderboard} title="Leaderboard">
          <Trophy className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onNewGame}>
          New Game
        </Button>
      </div>
    </div>
  )
}

