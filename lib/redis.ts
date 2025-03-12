import { Redis } from '@upstash/redis';

// Create Upstash Redis client
export const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

// Get the current active season ID
export async function getActiveSeasonId() {
  try {
    const activeSeasons = await redis.hgetall('activeSeasons');
    if (!activeSeasons || Object.keys(activeSeasons).length === 0) {
      // Default season ID
      return 'season1';
    }
    return Object.keys(activeSeasons)[0];
  } catch (error) {
    console.error('Error getting active season ID:', error);
    return 'season1';
  }
} 