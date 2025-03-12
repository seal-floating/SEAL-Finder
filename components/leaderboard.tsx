"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import type { GameLevel } from "@/types/game"
import { Trophy, Users, X } from "lucide-react"
import { formatTime } from "@/lib/utils"

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

export default function Leaderboard({ onClose }: LeaderboardProps) {
  // Telegram leaderboard state
  const [telegramLeaderboard, setTelegramLeaderboard] = useState<TelegramLeaderboardEntry[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [selectedSeason, setSelectedSeason] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  
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
      }
      setError(null)
    } catch (err) {
      console.error('Error fetching seasons:', err)
      setError('Unable to load season data')
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
      }
      setError(null)
    } catch (err) {
      console.error('Error fetching leaderboard:', err)
      setError('Unable to load leaderboard data')
      setTelegramLeaderboard([])
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
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
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
      </div>
    </div>
  )
}

