import type { GameLevel } from "@/types/game"
import type { LeaderboardEntry } from "@/components/leaderboard"

// Check if Telegram WebApp is available
const isTelegramWebApp = typeof window !== "undefined" && "Telegram" in window && "WebApp" in (window as any).Telegram

// Get Telegram WebApp instance
export const getTelegramWebApp = () => {
  if (isTelegramWebApp) {
    return (window as any).Telegram.WebApp
  }
  return null
}

// Get user data from Telegram
export const getTelegramUser = () => {
  const webApp = getTelegramWebApp()
  if (webApp && webApp.initDataUnsafe && webApp.initDataUnsafe.user) {
    return webApp.initDataUnsafe.user
  }

  // Return a default user for testing outside of Telegram
  return {
    id: "local-user",
    first_name: "Local",
    last_name: "User",
    username: "local_user",
  }
}

// Save score to leaderboard
export const saveScore = (level: GameLevel, time: number, sealsFound: number, totalSeals: number): LeaderboardEntry => {
  const user = getTelegramUser()
  const webApp = getTelegramWebApp()

  const entry: LeaderboardEntry = {
    id: `${user.id}-${Date.now()}`,
    name: user.first_name + (user.last_name ? ` ${user.last_name}` : ""),
    level,
    time,
    sealsFound,
    totalSeals,
    date: new Date().toISOString(),
  }

  // Get existing leaderboard
  const leaderboard = getLeaderboard()

  // Add new entry
  leaderboard.push(entry)

  // Save updated leaderboard
  if (webApp && webApp.CloudStorage) {
    // Use Telegram Cloud Storage if available
    webApp.CloudStorage.setItem("leaderboard", JSON.stringify(leaderboard))
  } else {
    // Fallback to localStorage
    localStorage.setItem("leaderboard", JSON.stringify(leaderboard))
  }

  return entry
}

// Get leaderboard data
export const getLeaderboard = (): LeaderboardEntry[] => {
  const webApp = getTelegramWebApp()
  let leaderboardData: LeaderboardEntry[] = []

  try {
    let data: string | null = null

    if (webApp && webApp.CloudStorage) {
      // Use Telegram Cloud Storage if available
      data = webApp.CloudStorage.getItem("leaderboard")
    } else {
      // Fallback to localStorage
      data = localStorage.getItem("leaderboard")
    }

    if (data) {
      leaderboardData = JSON.parse(data)
    }
  } catch (error) {
    console.error("Error loading leaderboard:", error)
  }

  return leaderboardData
}

