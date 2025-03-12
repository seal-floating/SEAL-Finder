"use client"

import { Button } from "@/components/ui/button"
import { Play, Trophy, HelpCircle, MessageCircle } from "lucide-react"
import SealImage from "./seal-image"

interface MainMenuProps {
  onPlay: () => void
  onRanking: () => void
  onHowToPlay: () => void
  onTelegramLeaderboard?: () => void
}

export default function MainMenu({ onPlay, onRanking, onHowToPlay, onTelegramLeaderboard }: MainMenuProps) {
  return (
    <div className="flex flex-col items-center p-6 space-y-6">
      <div className="text-center mb-4">
        <div className="flex justify-center mb-4">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center p-2">
            <SealImage className="w-20 h-20" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-black dark:text-white">Find the SEAL</h1>
        <p className="text-gray-700 dark:text-gray-300 mt-2">A Minesweeper-like game with seals</p>
      </div>

      <div className="w-full space-y-3 max-w-xs">
        <Button className="w-full h-12 text-lg flex items-center justify-center gap-2" onClick={onPlay}>
          <Play className="w-5 h-5" />
          Play Game
        </Button>

        <Button
          variant="outline"
          className="w-full h-12 text-lg flex items-center justify-center gap-2"
          onClick={onRanking}
        >
          <Trophy className="w-5 h-5" />
          Leaderboard
        </Button>

        {onTelegramLeaderboard && (
          <Button
            variant="outline"
            className="w-full h-12 text-lg flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700"
            onClick={onTelegramLeaderboard}
          >
            <MessageCircle className="w-5 h-5" />
            텔레그램 리더보드
          </Button>
        )}

        <Button
          variant="ghost"
          className="w-full h-12 text-lg flex items-center justify-center gap-2"
          onClick={onHowToPlay}
        >
          <HelpCircle className="w-5 h-5" />
          How to Play
        </Button>
      </div>
    </div>
  )
}

