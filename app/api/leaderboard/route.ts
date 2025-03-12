import { redis, getActiveSeasonId } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // URL에서 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url);
    const seasonId = searchParams.get('seasonId') || await getActiveSeasonId();
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    // 리더보드 데이터 가져오기 (높은 점수부터 내림차순)
    const leaderboardKey = `leaderboard:season:${seasonId}`;
    const leaderboardData = await redis.zrange(leaderboardKey, offset, offset + limit - 1, { 
      rev: true,
      withScores: true 
    });
    
    // 중복 제거를 위한 Set
    const uniqueIds = new Set<string>();
    
    // 사용자 정보 가져오기 (중복 제거)
    const enrichedLeaderboard = await Promise.all(
      leaderboardData
        .filter((entry: any) => {
          // 이미 처리한 사용자 ID인지 확인
          if (uniqueIds.has(entry.member)) {
            return false;
          }
          // 처리한 ID로 기록
          uniqueIds.add(entry.member);
          return true;
        })
        .map(async (entry: any, index: number) => {
          const telegramId = entry.member;
          const score = entry.score;
          
          // 사용자 정보 조회
          const userKey = `users:${telegramId}`;
          const userData = await redis.get(userKey) as any;
          
          return {
            rank: offset + index + 1,
            telegramId,
            score,
            username: userData?.username || '알 수 없음',
            firstName: userData?.firstName,
            lastName: userData?.lastName,
            photoUrl: userData?.photoUrl
          };
        })
    );
    
    // 시즌 정보 가져오기
    const seasonKey = `seasons:${seasonId}`;
    const seasonInfo = await redis.get(seasonKey);
    
    return NextResponse.json({
      season: seasonInfo || { id: seasonId },
      leaderboard: enrichedLeaderboard,
      total: await redis.zcard(leaderboardKey)
    });
  } catch (error) {
    console.error('리더보드 조회 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 