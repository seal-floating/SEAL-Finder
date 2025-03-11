"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, MousePointer, Clock, Bomb, Award } from "lucide-react"
import { SealIcon } from "@/components/icons"

interface HowToPlayProps {
  onBack: () => void
}

export default function HowToPlay({ onBack }: HowToPlayProps) {
  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-black dark:text-white">How to Play</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <p className="text-blue-800 dark:text-blue-300">
            Find the SEAL is a game similar to Minesweeper where you hunt for seals while avoiding failures (bombs).
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-black dark:text-white">Game Rules</h2>

          <div className="flex items-start gap-3">
            <div className="mt-1 bg-blue-100 p-2 rounded-full">
              <MousePointer className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-black dark:text-white">Tap on cells</h3>
              <p className="text-gray-700 dark:text-gray-300">Tap on cells to reveal what's underneath.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 bg-blue-100 p-2 rounded-full">
              <SealIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-black dark:text-white">Find all the seals</h3>
              <p className="text-gray-700 dark:text-gray-300">Your goal is to find all the seals hidden in the grid.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 bg-red-100 p-2 rounded-full">
              <Bomb className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h3 className="font-medium text-black dark:text-white">Avoid failures</h3>
              <p className="text-gray-700 dark:text-gray-300">Be careful not to tap on cells containing failures (bombs).</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 bg-gray-100 p-2 rounded-full">
              <span className="w-4 h-4 flex items-center justify-center font-bold text-gray-600">2</span>
            </div>
            <div>
              <h3 className="font-medium text-black dark:text-white">Number clues</h3>
              <p className="text-gray-700 dark:text-gray-300">Numbers indicate how many failures are in the adjacent cells.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 bg-green-100 p-2 rounded-full">
              <Clock className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-black dark:text-white">Beat the clock</h3>
              <p className="text-gray-700 dark:text-gray-300">Each level has a time limit. Find all seals before time runs out!</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 bg-yellow-100 p-2 rounded-full">
              <Award className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-medium text-black dark:text-white">Difficulty levels</h3>
              <p className="text-gray-700 dark:text-gray-300">
                Choose from Easy (5×5, 2 min), Medium (7×7, 3 min), or Hard (10×10, 5 min) grids.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={onBack} className="w-full">
            Back to Menu
          </Button>
        </div>
      </div>
    </div>
  )
}

