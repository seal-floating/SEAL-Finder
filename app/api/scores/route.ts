import { redis, getActiveSeasonId } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { telegramId, username, firstName, lastName, photoUrl, score } = await request.json();

    // 필수 파라미터 검증
    if (!telegramId || score === undefined) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다.' }, { status: 400 });
    }

    // 현재 활성 시즌 가져오기
    const seasonId = await getActiveSeasonId();

    // 사용자 정보 저장 (처음 등록하는 경우에만 업데이트)
    const userKey = `users:${telegramId}`;
    const existingUser = await redis.get(userKey);
    
    if (!existingUser) {
      await redis.set(userKey, {
        username,
        firstName,
        lastName,
        photoUrl,
        registeredAt: Date.now()
      });
    }

    // 사용자의 현재 시즌 최고 점수 가져오기
    const scoreKey = `scores:season:${seasonId}:${telegramId}`;
    const currentScore = await redis.get(scoreKey) as { score: number } | null;

    // 새 점수가 기존 점수보다 높은 경우에만 업데이트
    if (!currentScore || score > currentScore.score) {
      // 점수 업데이트
      await redis.set(scoreKey, {
        score,
        updatedAt: Date.now()
      });

      // 리더보드 키
      const leaderboardKey = `leaderboard:season:${seasonId}`;
      
      // 먼저 해당 사용자의 기존 항목을 모두 제거
      await redis.zrem(leaderboardKey, telegramId);
      
      // 그 후 새 점수로 추가
      await redis.zadd(leaderboardKey, { score, member: telegramId });

      return NextResponse.json({ 
        success: true, 
        message: '새로운 최고 점수가 등록되었습니다.',
        newHighScore: true
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: '점수가 제출되었지만 최고 점수를 갱신하지 못했습니다.',
      newHighScore: false
    });
  } catch (error) {
    console.error('점수 저장 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}