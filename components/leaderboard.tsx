"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { GameLevel } from "@/types/game"
import { Trophy, Users, X } from "lucide-react"
import { formatTime } from "@/lib/utils"

export interface LeaderboardEntry {
  id: string
  name: string
  level: GameLevel
  time: number
  sealsFound: number
  totalSeals: number
  date: string
}

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  currentLevel: GameLevel
  onClose: () => void
}

export default function Leaderboard({ entries, currentLevel, onClose }: LeaderboardProps) {
  const [selectedLevel, setSelectedLevel] = useState<GameLevel>(currentLevel)

  // Filter entries by selected level and sort by time (ascending)
  const filteredEntries = entries
    .filter((entry) => entry.level === selectedLevel && entry.sealsFound === entry.totalSeals)
    .sort((a, b) => a.time - b.time)
    .slice(0, 10) // Show only top 10

  const levelLabels = {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-20 p-4">
      <div className="bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl font-bold">Leaderboard</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 border-b">
          <div className="flex gap-2">
            {Object.entries(levelLabels).map(([level, label]) => (
              <Button
                key={level}
                variant={selectedLevel === level ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedLevel(level as GameLevel)}
                className="flex-1"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {filteredEntries.length > 0 ? (
            <div className="divide-y">
              {filteredEntries.map((entry, index) => (
                <div key={entry.id} className="p-4 flex items-center">
                  <div className="w-8 font-bold text-center">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
                  </div>
                  <div className="flex-1 ml-2">
                    <div className="font-medium">{entry.name}</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {formatTime(entry.time)} • {new Date(entry.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-700 dark:text-gray-300 flex flex-col items-center gap-2">
              <Users className="w-8 h-8 opacity-50" />
              <p>No scores yet for this level</p>
              <p className="text-sm">Be the first to complete it!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

