import { Redis } from '@upstash/redis';

// Create Upstash Redis client
export const redis = new Redis({
  url: process.env.KV_REST_API_URL || '',
  token: process.env.KV_REST_API_TOKEN || '',
});

// Default season data
const DEFAULT_SEASON = {
  id: 'season1',
  name: 'Season 1',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
  isActive: true
};

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
      return DEFAULT_SEASON.id;
    }
    
    const activeSeasons = await redis.hgetall('activeSeasons');
    console.log('Active seasons from Redis:', activeSeasons);
    
    if (!activeSeasons || Object.keys(activeSeasons).length === 0) {
      console.log('No active seasons found, creating default season');
      
      // Try to create a default season if none exists
      try {
        await redis.hset('activeSeasons', { [DEFAULT_SEASON.id]: JSON.stringify(DEFAULT_SEASON) });
        await redis.hset('seasons', { [DEFAULT_SEASON.id]: JSON.stringify(DEFAULT_SEASON) });
        console.log('Created default season successfully');
        
        // Verify the season was created
        const verifySeasons = await redis.hgetall('activeSeasons');
        if (!verifySeasons || Object.keys(verifySeasons).length === 0) {
          console.warn('Failed to verify default season creation, using default ID');
          return DEFAULT_SEASON.id;
        }
      } catch (createError) {
        console.error('Failed to create default season:', createError);
        return DEFAULT_SEASON.id;
      }
      
      // Default season ID
      return DEFAULT_SEASON.id;
    }
    
    return Object.keys(activeSeasons)[0];
  } catch (error) {
    console.error('Error getting active season ID:', error);
    return DEFAULT_SEASON.id;
  }
}

// Get all seasons (for development/testing when Redis is not available)
export async function getAllSeasons() {
  try {
    const isConnected = await verifyRedisConnection();
    if (!isConnected) {
      console.warn('Using mock seasons data due to Redis connection failure');
      return { [DEFAULT_SEASON.id]: JSON.stringify(DEFAULT_SEASON) };
    }
    
    const seasons = await redis.hgetall('seasons');
    if (!seasons || Object.keys(seasons).length === 0) {
      // Create default season if none exists
      const defaultSeasons = { [DEFAULT_SEASON.id]: JSON.stringify(DEFAULT_SEASON) };
      try {
        await redis.hset('seasons', defaultSeasons);
        await redis.hset('activeSeasons', { [DEFAULT_SEASON.id]: JSON.stringify(DEFAULT_SEASON) });
        console.log('Created default season in getAllSeasons');
        return defaultSeasons;
      } catch (error) {
        console.error('Failed to create default season in getAllSeasons:', error);
        return defaultSeasons;
      }
    }
    
    return seasons;
  } catch (error) {
    console.error('Error getting all seasons:', error);
    return { [DEFAULT_SEASON.id]: JSON.stringify(DEFAULT_SEASON) };
  }
} 