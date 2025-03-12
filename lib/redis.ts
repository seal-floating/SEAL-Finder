import { Redis } from '@upstash/redis';

// Create Upstash Redis client
export const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

// Verify Redis connection
export async function verifyRedisConnection() {
  try {
    // Simple ping to verify connection
    const result = await redis.ping();
    console.log('Redis connection verified:', result);
    return true;
  } catch (error) {
    console.error('Redis connection failed:', error);
    return false;
  }
}

// Get the current active season ID
export async function getActiveSeasonId() {
  try {
    // First verify connection
    const isConnected = await verifyRedisConnection();
    if (!isConnected) {
      console.warn('Using default season ID due to Redis connection failure');
      return 'season1';
    }
    
    const activeSeasons = await redis.hgetall('activeSeasons');
    console.log('Active seasons from Redis:', activeSeasons);
    
    if (!activeSeasons || Object.keys(activeSeasons).length === 0) {
      console.log('No active seasons found, using default');
      
      // Try to create a default season if none exists
      try {
        const defaultSeason = {
          id: 'season1',
          name: 'Season 1',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
          isActive: true
        };
        
        await redis.hset('activeSeasons', { 'season1': JSON.stringify(defaultSeason) });
        await redis.hset('seasons', { 'season1': JSON.stringify(defaultSeason) });
        console.log('Created default season');
      } catch (createError) {
        console.error('Failed to create default season:', createError);
      }
      
      // Default season ID
      return 'season1';
    }
    
    return Object.keys(activeSeasons)[0];
  } catch (error) {
    console.error('Error getting active season ID:', error);
    return 'season1';
  }
} 