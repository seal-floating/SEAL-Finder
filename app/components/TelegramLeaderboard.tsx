'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LeaderboardEntry {
  rank: number;
  telegramId: string;
  username: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  score: number;
}

interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function TelegramLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 시즌 목록 가져오기
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const response = await fetch('/api/seasons');
        const data = await response.json();
        
        if (data.seasons && data.seasons.length > 0) {
          setSeasons(data.seasons);
          
          // 활성 시즌 찾기
          const activeSeason = data.seasons.find((season: Season) => season.isActive);
          if (activeSeason) {
            setSelectedSeason(activeSeason.id);
          } else {
            setSelectedSeason(data.seasons[0].id);
          }
        }
      } catch (err) {
        console.error('시즌 목록을 가져오는 중 오류 발생:', err);
        setError('시즌 정보를 불러올 수 없습니다.');
      }
    };

    fetchSeasons();
  }, []);

  // 리더보드 데이터 가져오기
  useEffect(() => {
    if (!selectedSeason) return;

    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/leaderboard?seasonId=${selectedSeason}&limit=20`);
        const data = await response.json();
        
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
        }
        setError(null);
      } catch (err) {
        console.error('리더보드를 가져오는 중 오류 발생:', err);
        setError('리더보드 데이터를 불러올 수 없습니다.');
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedSeason]);

  // 시즌 변경 핸들러
  const handleSeasonChange = (value: string) => {
    setSelectedSeason(value);
  };

  // 사용자 이름 표시 형식
  const formatUserName = (entry: LeaderboardEntry) => {
    if (entry.username && entry.username !== '알 수 없음') {
      return `@${entry.username}`;
    }
    
    const fullName = [entry.firstName, entry.lastName]
      .filter(Boolean)
      .join(' ');
      
    return fullName || `User ${entry.telegramId.substring(0, 8)}`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>리더보드</CardTitle>
        {seasons.length > 0 && (
          <Select value={selectedSeason} onValueChange={handleSeasonChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="시즌 선택" />
            </SelectTrigger>
            <SelectContent>
              {seasons.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.name} {season.isActive && '(현재)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center text-red-500 py-4">{error}</div>
        ) : loading ? (
          <div className="text-center py-4">로딩 중...</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-4">아직 기록이 없습니다.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">순위</TableHead>
                <TableHead>플레이어</TableHead>
                <TableHead className="text-right">점수</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((entry) => (
                <TableRow key={entry.telegramId}>
                  <TableCell className="font-medium">{entry.rank}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    {entry.photoUrl && (
                      <img 
                        src={entry.photoUrl} 
                        alt={formatUserName(entry)} 
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    {formatUserName(entry)}
                  </TableCell>
                  <TableCell className="text-right">{entry.score.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
} 