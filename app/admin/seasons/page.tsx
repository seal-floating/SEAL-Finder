'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function SeasonsAdminPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 새 시즌 폼 상태
  const [newSeason, setNewSeason] = useState<{
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
  }>({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: false,
  });

  // 시즌 목록 가져오기
  const fetchSeasons = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/seasons');
      const data = await response.json();
      
      if (data.seasons) {
        setSeasons(data.seasons);
      }
      setError(null);
    } catch (err) {
      console.error('시즌 목록을 가져오는 중 오류 발생:', err);
      setError('시즌 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeasons();
  }, []);

  // 새 시즌 생성
  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/seasons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSeason),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(`시즌이 성공적으로 생성되었습니다. (ID: ${data.seasonId})`);
        fetchSeasons();
        // 폼 초기화
        setNewSeason({
          name: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          isActive: false,
        });
      } else {
        toast.error(`시즌 생성 실패: ${data.error || '알 수 없는 오류'}`);
      }
    } catch (err) {
      console.error('시즌 생성 중 오류 발생:', err);
      toast.error('시즌 생성 중 오류가 발생했습니다.');
    }
  };

  // 시즌 활성화/비활성화
  const handleToggleActive = async (seasonId: string, currentActive: boolean) => {
    try {
      const response = await fetch('/api/seasons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: seasonId,
          isActive: !currentActive,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(`시즌이 ${!currentActive ? '활성화' : '비활성화'}되었습니다.`);
        fetchSeasons();
      } else {
        toast.error(`시즌 업데이트 실패: ${data.error || '알 수 없는 오류'}`);
      }
    } catch (err) {
      console.error('시즌 업데이트 중 오류 발생:', err);
      toast.error('시즌 업데이트 중 오류가 발생했습니다.');
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <main className="flex min-h-screen flex-col p-6 bg-emerald-50 dark:bg-emerald-950">
      <div className="max-w-6xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6 text-emerald-800 dark:text-emerald-200">시즌 관리</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 시즌 생성 폼 */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>새 시즌 생성</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSeason} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">시즌 이름</Label>
                  <Input
                    id="name"
                    value={newSeason.name}
                    onChange={(e) => setNewSeason({ ...newSeason, name: e.target.value })}
                    placeholder="예: 2024 봄 시즌"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="startDate">시작일</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newSeason.startDate}
                    onChange={(e) => setNewSeason({ ...newSeason, startDate: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">종료일</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={newSeason.endDate}
                    onChange={(e) => setNewSeason({ ...newSeason, endDate: e.target.value })}
                    required
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={newSeason.isActive}
                    onCheckedChange={(checked) => setNewSeason({ ...newSeason, isActive: checked })}
                  />
                  <Label htmlFor="isActive">활성화</Label>
                </div>
                
                <Button type="submit" className="w-full">시즌 생성</Button>
              </form>
            </CardContent>
          </Card>
          
          {/* 시즌 목록 */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>시즌 목록</CardTitle>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="text-center text-red-500 py-4">{error}</div>
              ) : loading ? (
                <div className="text-center py-4">로딩 중...</div>
              ) : seasons.length === 0 ? (
                <div className="text-center py-4">등록된 시즌이 없습니다.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>이름</TableHead>
                      <TableHead>기간</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead className="text-right">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seasons.map((season) => (
                      <TableRow key={season.id}>
                        <TableCell className="font-medium">{season.name}</TableCell>
                        <TableCell>
                          {formatDate(season.startDate)} ~ {formatDate(season.endDate)}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            season.isActive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}>
                            {season.isActive ? '활성' : '비활성'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleActive(season.id, season.isActive)}
                          >
                            {season.isActive ? '비활성화' : '활성화'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
} 