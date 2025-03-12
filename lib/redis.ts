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

// Fallback leaderboard operations for when Telegram API fails
// Store score in Redis
export async function storeScore(telegramId: string, username: string, firstName: string, lastName: string, score: number) {
  console.log(`Attempting to store score ${score} for user ${telegramId} in Redis`);
  
  // Safety check for required parameters
  if (!telegramId) {
    console.error('Cannot store score: Missing telegramId');
    return false;
  }
  
  if (typeof score !== 'number' || isNaN(score)) {
    console.error('Cannot store score: Invalid score value', score);
    return false;
  }
  
  try {
    // First verify Redis connection
    const isConnected = await verifyRedisConnection();
    if (!isConnected) {
      console.error('Redis connection failed when trying to store score');
      return false;
    }
    
    const seasonId = await getActiveSeasonId();
    const leaderboardKey = `leaderboard:${seasonId}`;
    
    console.log(`Using Redis key: ${leaderboardKey} for storing score`);
    
    // Add score to sorted set
    try {
      console.log(`Executing ZADD ${leaderboardKey} ${score} ${telegramId}`);
      const zaddResult = await redis.zadd(leaderboardKey, { score, member: telegramId });
      console.log(`ZADD result:`, zaddResult);
    } catch (zaddError) {
      console.error('Error with ZADD operation:', zaddError);
      throw zaddError;
    }
    
    // Store user details
    const userKey = `user:${telegramId}`;
    const userDetails = {
      telegramId,
      username,
      firstName,
      lastName,
      lastScore: score,
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`Storing user details at ${userKey}:`, userDetails);
    
    try {
      const hsetResult = await redis.hset(userKey, userDetails);
      console.log(`HSET result:`, hsetResult);
    } catch (hsetError) {
      console.error('Error with HSET operation:', hsetError);
      throw hsetError;
    }
    
    // Verify that the score was added
    try {
      const verifyScore = await redis.zscore(leaderboardKey, telegramId);
      console.log(`Verification - score for ${telegramId}:`, verifyScore);
      
      if (verifyScore === null) {
        console.warn('Score verification failed - score was not found after storing');
      }
    } catch (verifyError) {
      console.warn('Error verifying score:', verifyError);
    }
    
    console.log(`Successfully stored score ${score} for user ${telegramId} in Redis`);
    return true;
  } catch (error) {
    console.error('Error storing score in Redis:', error);
    return false;
  }
}

// Get leaderboard from Redis
export async function getLeaderboard(limit = 100) {
  console.log('Redis getLeaderboard function called');
  
  try {
    // First verify Redis connection
    const isConnected = await verifyRedisConnection();
    if (!isConnected) {
      console.warn('Redis connection failed when trying to get leaderboard');
      
      // Return empty array instead of mock data
      console.log('Returning empty array due to Redis connection failure');
      return [];
    }
    
    const seasonId = await getActiveSeasonId();
    const leaderboardKey = `leaderboard:${seasonId}`;
    
    console.log(`Fetching leaderboard from Redis key: ${leaderboardKey}`);
    
    // Get top scores with user IDs
    const rawScores = await redis.zrange(leaderboardKey, 0, limit - 1, { 
      rev: true,
      withScores: true 
    });
    
    console.log('Raw scores from Redis:', rawScores);
    
    if (!rawScores || rawScores.length === 0) {
      console.log('No scores found in Redis leaderboard');
      return [];
    }
    
    // Process scores to match Telegram format
    const leaderboard = [];
    let rank = 1;
    
    for (let i = 0; i < rawScores.length; i += 2) {
      const telegramId = rawScores[i];
      const score = parseInt(rawScores[i+1]);
      
      console.log(`Processing score for user ${telegramId}: ${score}`);
      
      // Get user details
      let userDetails;
      try {
        userDetails = await redis.hgetall(`user:${telegramId}`);
        console.log(`User details for ${telegramId}:`, userDetails);
      } catch (e) {
        console.warn(`Could not get details for user ${telegramId}:`, e);
        userDetails = {
          telegramId,
          username: 'Unknown',
          firstName: 'Unknown',
          lastName: 'User'
        };
      }
      
      leaderboard.push({
        rank,
        telegramId,
        username: userDetails.username || 'Unknown',
        firstName: userDetails.firstName || '',
        lastName: userDetails.lastName || '',
        score
      });
      
      rank++;
    }
    
    console.log(`Returning leaderboard with ${leaderboard.length} entries`);
    return leaderboard;
  } catch (error) {
    console.error('Error getting leaderboard from Redis:', error);
    
    // Return empty array instead of mock data
    console.log('Returning empty array due to Redis error');
    return [];
  }
} 