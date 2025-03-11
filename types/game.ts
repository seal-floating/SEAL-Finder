export type GameState = "playing" | "won" | "lost"
export type GameLevel = "easy" | "medium" | "hard"

export interface Cell {
  hasSeal: boolean
  hasFailure: boolean
  isRevealed: boolean
  adjacentFailures: number
}

export interface LevelConfig {
  rows: number
  cols: number
  sealPercentage: number
  failurePercentage: number
  timeLimit: number // Time limit in seconds
}

