import { redis } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

interface Season {
  id: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt?: number;
}

// 시즌 목록 조회
export async function GET() {
  try {
    // 모든 시즌 키 가져오기
    const seasonKeys = await redis.keys('seasons:*');
    
    // 각 시즌 정보 가져오기
    const seasons: Season[] = await Promise.all(
      seasonKeys.map(async (key: string) => {
        const seasonData = await redis.get(key) as Record<string, any> | null;
        const seasonId = key.split(':')[1];
        
        // 활성 상태 확인
        const isActive = await redis.hexists('activeSeasons', seasonId);
        
        return {
          id: seasonId,
          ...(seasonData || {}),
          isActive
        };
      })
    );
    
    // 시작일 기준으로 정렬
    const sortedSeasons = seasons.sort((a, b) => {
      const dateA = new Date(a.startDate || 0).getTime();
      const dateB = new Date(b.startDate || 0).getTime();
      return dateB - dateA; // 최신 시즌이 먼저 오도록 내림차순 정렬
    });
    
    return NextResponse.json({ seasons: sortedSeasons });
  } catch (error) {
    console.error('시즌 목록 조회 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 새 시즌 생성 또는 기존 시즌 업데이트
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, name, startDate, endDate, isActive } = data;
    
    // 시즌 ID 생성 또는 사용
    let seasonId = id;
    
    // ID가 없는 경우 새로 생성
    if (!seasonId) {
      // 기존 시즌 수 확인
      const seasonKeys = await redis.keys('seasons:*');
      const seasonCount = seasonKeys.length;
      
      // 새 시즌 ID 생성 (season1, season2, ...)
      seasonId = `season${seasonCount + 1}`;
    }
    
    // 필수 파라미터 검증
    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다.' }, { status: 400 });
    }
    
    // 시즌 정보 저장
    const seasonKey = `seasons:${seasonId}`;
    await redis.set(seasonKey, {
      name,
      startDate,
      endDate,
      createdAt: Date.now()
    });
    
    // 활성 시즌 설정
    if (isActive) {
      // 기존 활성 시즌 비활성화
      await redis.del('activeSeasons');
      // 새 활성 시즌 설정
      await redis.hset('activeSeasons', { [seasonId]: true });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: '시즌이 성공적으로 생성/업데이트되었습니다.',
      seasonId
    });
  } catch (error) {
    console.error('시즌 생성/업데이트 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 