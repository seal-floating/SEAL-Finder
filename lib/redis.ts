import { Redis } from '@upstash/redis';

// Upstash Redis 클라이언트 생성
export const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

// 현재 활성 시즌 ID를 가져오는 함수
export async function getActiveSeasonId() {
  try {
    const activeSeasons = await redis.hgetall('activeSeasons');
    if (!activeSeasons || Object.keys(activeSeasons).length === 0) {
      // 기본 시즌 ID
      return 'season1';
    }
    return Object.keys(activeSeasons)[0];
  } catch (error) {
    console.error('활성 시즌 ID 조회 중 오류:', error);
    return 'season1';
  }
} 