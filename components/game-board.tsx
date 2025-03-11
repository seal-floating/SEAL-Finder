"use client"

import type { Cell, GameLevel } from "@/types/game"
import { LEVEL_CONFIGS } from "@/lib/game-utils"
import { Bomb } from "lucide-react"
import SealImage from "./seal-image"

interface GameBoardProps {
  board: Cell[][]
  level: GameLevel
  onCellClick: (rowIndex: number, colIndex: number) => void
}

export default function GameBoard({ board, level, onCellClick }: GameBoardProps) {
  const { cols } = LEVEL_CONFIGS[level]

  return (
    <div className="p-4">
      <div
        className="grid gap-1 md:gap-2"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              className={`
                w-full aspect-square rounded-md flex items-center justify-center text-sm md:text-base font-bold
                ${
                  cell.isRevealed
                    ? cell.hasFailure
                      ? "bg-red-100"
                      : cell.hasSeal
                        ? "bg-emerald-100"
                        : "bg-gray-100"
                    : "bg-emerald-200 hover:bg-emerald-300"
                }
                transition-colors
              `}
              onClick={() => onCellClick(rowIndex, colIndex)}
              disabled={cell.isRevealed}
            >
              {cell.isRevealed &&
                (cell.hasFailure ? (
                  <Bomb className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
                ) : cell.hasSeal ? (
                  <SealImage className="w-6 h-6 md:w-7 md:h-7" />
                ) : (
                  <span className="text-gray-800 dark:text-gray-200">{cell.adjacentFailures || ""}</span>
                ))}
            </button>
          )),
        )}
      </div>
    </div>
  )
}

