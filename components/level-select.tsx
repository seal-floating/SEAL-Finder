"use client"

import { Button } from "@/components/ui/button"
import type { GameLevel } from "@/types/game"

interface LevelSelectProps {
  currentLevel: GameLevel
  onLevelChange: (level: GameLevel) => void
}

export default function LevelSelect({ currentLevel, onLevelChange }: LevelSelectProps) {
  const levels: { id: GameLevel; label: string; description: string }[] = [
    {
      id: "easy",
      label: "Easy",
      description: "5×5 grid, fewer failures",
    },
    {
      id: "medium",
      label: "Medium",
      description: "7×7 grid, balanced challenge",
    },
    {
      id: "hard",
      label: "Hard",
      description: "10×10 grid, many failures",
    },
  ]

  return (
    <div className="p-4 border-b">
      <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Level:</h2>
      <div className="flex flex-wrap gap-2">
        {levels.map((level) => (
          <Button
            key={level.id}
            variant={currentLevel === level.id ? "default" : "outline"}
            size="sm"
            onClick={() => onLevelChange(level.id)}
            className="flex-1"
          >
            <div>
              <div>{level.label}</div>
              <div className="text-xs font-normal opacity-70">{level.description}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  )
}

