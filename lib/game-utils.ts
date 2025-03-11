import type { Cell, GameLevel, LevelConfig } from "@/types/game"

export const LEVEL_CONFIGS: Record<GameLevel, LevelConfig> = {
  easy: {
    rows: 5,
    cols: 5,
    sealPercentage: 0.2,
    failurePercentage: 0.1,
    timeLimit: 120, // 2 minutes
  },
  medium: {
    rows: 7,
    cols: 7,
    sealPercentage: 0.2,
    failurePercentage: 0.15,
    timeLimit: 180, // 3 minutes
  },
  hard: {
    rows: 10,
    cols: 10,
    sealPercentage: 0.2,
    failurePercentage: 0.2,
    timeLimit: 300, // 5 minutes
  },
}

export function generateBoard(level: GameLevel): Cell[][] {
  const config = LEVEL_CONFIGS[level]
  const { rows, cols, sealPercentage, failurePercentage } = config

  // Create empty board
  const board: Cell[][] = Array(rows)
    .fill(null)
    .map(() =>
      Array(cols)
        .fill(null)
        .map(() => ({
          hasSeal: false,
          hasFailure: false,
          isRevealed: false,
          adjacentFailures: 0,
        })),
    )

  // Place seals
  const sealCount = Math.floor(rows * cols * sealPercentage)
  placeMines(board, sealCount, true)

  // Place failures/bombs
  const failureCount = Math.floor(rows * cols * failurePercentage)
  placeMines(board, failureCount, false)

  // Calculate adjacent failures
  calculateAdjacentFailures(board)

  return board
}

function placeMines(board: Cell[][], count: number, isSeals: boolean) {
  const rows = board.length
  const cols = board[0].length
  let placed = 0

  while (placed < count) {
    const row = Math.floor(Math.random() * rows)
    const col = Math.floor(Math.random() * cols)
    const cell = board[row][col]

    // Skip if this cell already has a seal or failure
    if (cell.hasSeal || cell.hasFailure) continue

    if (isSeals) {
      cell.hasSeal = true
    } else {
      cell.hasFailure = true
    }

    placed++
  }
}

function calculateAdjacentFailures(board: Cell[][]) {
  const rows = board.length
  const cols = board[0].length

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (board[row][col].hasFailure) continue

      let count = 0

      // Check all 8 adjacent cells
      for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
          if (r === row && c === col) continue
          if (board[r][c].hasFailure) count++
        }
      }

      board[row][col].adjacentFailures = count
    }
  }
}

