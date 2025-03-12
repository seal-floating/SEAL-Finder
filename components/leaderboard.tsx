"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import type { GameLevel } from "@/types/game"
import { Trophy, Users, X, MessageCircle } from "lucide-react"
import { formatTime } from "@/lib/utils"
import { isTelegramWebAppAvailable } from "@/lib/telegram"

interface TelegramLeaderboardEntry {
  rank: number
  telegramId: string
  username: string
  firstName?: string
  lastName?: string
  photoUrl?: string
  score: number
}

interface Season {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

interface LeaderboardProps {
  onClose: () => void
}

// Check if we're in development mode
const isDevelopment = () => {
  // Check if we're in a development environment
  // This works in both client and server contexts
  return typeof window !== 'undefined' 
    ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    : process.env.NODE_ENV === 'development';
};

// Default season for when API fails
const DEFAULT_SEASON: Season = {
  id: 'season1',
  name: 'Season 1',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  isActive: true
};

export default function Leaderboard({ onClose }: LeaderboardProps) {
  // Telegram leaderboard state
  const [telegramLeaderboard, setTelegramLeaderboard] = useState<TelegramLeaderboardEntry[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeason, setSelectedSeason] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const isTelegramAvailable = typeof window !== 'undefined' && (isTelegramWebAppAvailable() || isDevelopment())
  
  // Fetch seasons on component mount
  useEffect(() => {
    fetchSeasons()
  }, [])
  
  // Fetch telegram leaderboard data when season is selected
  useEffect(() => {
    if (selectedSeason) {
      fetchTelegramLeaderboard()
    }
  }, [selectedSeason])
  
  // Fetch seasons list
  const fetchSeasons = async () => {
    try {
      const response = await fetch('/api/seasons')
      const data = await response.json()
      
      if (data.seasons && data.seasons.length > 0) {
        setSeasons(data.seasons)
        
        // Find active season
        const activeSeason = data.seasons.find((season: Season) => season.isActive)
        if (activeSeason) {
          setSelectedSeason(activeSeason.id)
        } else {
          setSelectedSeason(data.seasons[0].id)
        }
      } else {
        console.warn('No seasons available from API, using default season')
        // Use default season when API returns no seasons
        const defaultSeasons = [DEFAULT_SEASON]
        setSeasons(defaultSeasons)
        setSelectedSeason(DEFAULT_SEASON.id)
        setError(null)
      }
    } catch (err) {
      console.error('Error fetching seasons:', err)
      // Use default season when API fails
      const defaultSeasons = [DEFAULT_SEASON]
      setSeasons(defaultSeasons)
      setSelectedSeason(DEFAULT_SEASON.id)
      setError(null)
    } finally {
      setLoading(false)
    }
  }
  
  // Fetch telegram leaderboard
  const fetchTelegramLeaderboard = async () => {
    if (!selectedSeason) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/leaderboard?seasonId=${selectedSeason}&limit=20`)
      const data = await response.json()
      
      if (data.leaderboard) {
        setTelegramLeaderboard(data.leaderboard)
      } else if (isDevelopment()) {
        // In development, show mock data if API returns empty
        setTelegramLeaderboard([
          {
            rank: 1,
            telegramId: 'dev-user-123',
            username: 'dev_user',
            firstName: 'Dev',
            lastName: 'User',
            score: 5000
          },
          {
            rank: 2,
            telegramId: 'dev-user-456',
            username: 'test_user',
            firstName: 'Test',
            lastName: 'User',
            score: 4500
          }
        ])
      }
      setError(null)
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      if (isDevelopment()) {
        // In development, show mock data if API fails
        setTelegramLeaderboard([
          {
            rank: 1,
            telegramId: 'dev-user-123',
            username: 'dev_user',
            firstName: 'Dev',
            lastName: 'User',
            score: 5000
          },
          {
            rank: 2,
            telegramId: 'dev-user-456',
            username: 'test_user',
            firstName: 'Test',
            lastName: 'User',
            score: 4500
          }
        ])
        setError(null)
      } else {
        setError('Unable to load leaderboard data')
        setTelegramLeaderboard([])
      }
    } finally {
      setLoading(false)
    }
  }
  
  // Format user display name
  const formatUserName = (entry: TelegramLeaderboardEntry) => {
    if (entry.username && entry.username !== 'Unknown') {
      return `@${entry.username}`
    }
    
    const fullName = [entry.firstName, entry.lastName]
      .filter(Boolean)
      .join(' ')
      
    return fullName || `User ${entry.telegramId.substring(0, 8)}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-20 p-4">
      <div className="bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl font-bold">Leaderboard</h2>
            {isTelegramAvailable && (
              <MessageCircle className="w-4 h-4 text-blue-500" />
            )}
            {isDevelopment() && !isTelegramWebAppAvailable() && (
              <span className="text-xs bg-purple-100 text-purple-800 px-1 rounded">Dev Mode</span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {!isTelegramAvailable && !isDevelopment() ? (
          <div className="p-8 text-center text-gray-700 dark:text-gray-300 flex flex-col items-center gap-2">
            <MessageCircle className="w-8 h-8 opacity-50" />
            <p>Telegram connection is required</p>
            <p className="text-sm">Please open this game in Telegram to view the leaderboard</p>
          </div>
        ) : (
          <>
            {seasons.length > 0 && (
              <div className="p-4 border-b">
                <select 
                  className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600"
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                >
                  {seasons.map((season) => (
                    <option key={season.id} value={season.id}>
                      {season.name} {season.isActive && '(Current)'}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="overflow-y-auto flex-1">
              {error ? (
                <div className="p-8 text-center text-red-500 flex flex-col items-center gap-2">
                  <p>{error}</p>
                </div>
              ) : loading ? (
                <div className="p-8 text-center text-gray-700 dark:text-gray-300 flex flex-col items-center gap-2">
                  <p>Loading...</p>
                </div>
              ) : telegramLeaderboard.length === 0 ? (
                <div className="p-8 text-center text-gray-700 dark:text-gray-300 flex flex-col items-center gap-2">
                  <Users className="w-8 h-8 opacity-50" />
                  <p>No scores yet for this season</p>
                  {isDevelopment() && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchTelegramLeaderboard}
                      className="mt-2"
                    >
                      Load Mock Data
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y">
                  {telegramLeaderboard.map((entry) => (
                    <div key={entry.telegramId} className="p-4 flex items-center">
                      <div className="w-8 font-bold text-center">
                        {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
                      </div>
                      <div className="flex-1 ml-2 flex items-center gap-2">
                        {entry.photoUrl && (
                          <img 
                            src={entry.photoUrl} 
                            alt={formatUserName(entry)} 
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <div>
                          <div className="font-medium">{formatUserName(entry)}</div>
                        </div>
                      </div>
                      <div className="text-right font-semibold">
                        {entry.score.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

