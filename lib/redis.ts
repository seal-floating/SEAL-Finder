import { Redis } from '@upstash/redis';

console.log('Redis configuration information:');
console.log('- KV_REST_API_URL exists:', !!process.env.KV_REST_API_URL);
console.log('- KV_REST_API_TOKEN exists:', !!process.env.KV_REST_API_TOKEN);
console.log('- KV_URL exists:', !!process.env.KV_URL);

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
  const startTime = Date.now();
  console.log('🔄 Verifying Redis connection...');
  
  try {
    // Simple ping to verify connection
    const result = await redis.ping();
    const duration = Date.now() - startTime;
    console.log(`✅ Redis connection successful (${duration}ms):`, result);
    
    // Also try a basic operation to really confirm it's working
    try {
      // Try to get a simple key to confirm read works
      const testResult = await redis.get('test_connection');
      console.log('Redis test read result:', testResult === null ? 'null (expected for non-existent key)' : testResult);
      
      // Try to set a simple value to confirm write works
      const timestamp = new Date().toISOString();
      const setResult = await redis.set('connection_verified_at', timestamp);
      console.log('Redis test write result:', setResult);
      
      console.log('✅ Redis read/write test passed');
    } catch (opError) {
      console.error('⛔️ Redis operations failed despite successful ping:', opError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('⛔️ Redis connection failed:', error);
    
    // Check for common connection errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
      console.error('⛔️ Redis connection error: Cannot resolve hostname. Check your KV_REST_API_URL.');
    } else if (errorMessage.includes('ECONNREFUSED')) {
      console.error('⛔️ Redis connection error: Connection refused. Check your KV_REST_API_URL and network settings.');
    } else if (errorMessage.includes('unauthorized') || errorMessage.includes('token')) {
      console.error('⛔️ Redis connection error: Authentication failed. Check your KV_REST_API_TOKEN.');
    }
    
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
// Helper function to test Redis connectivity - call this from API routes
export async function testRedisConnection() {
  console.log('🧪 Testing Redis connection...');
  
  // Print all environment variables related to Redis (with redacted values)
  const redisEnvVars = Object.keys(process.env)
    .filter(key => key.includes('KV_') || key.includes('REDIS') || key.includes('UPSTASH'))
    .map(key => {
      const value = process.env[key];
      // Redact the actual values for security
      const redactedValue = value ? 
        (value.length > 10 ? value.substring(0, 4) + '...' + value.substring(value.length - 4) : '***') 
        : 'undefined';
      return `${key}: ${redactedValue}`;
    });
  
  console.log('Redis environment variables:', redisEnvVars);
  
  try {
    // First basic ping
    const pingStart = Date.now();
    const pingResult = await redis.ping();
    const pingDuration = Date.now() - pingStart;
    console.log(`Redis ping result (${pingDuration}ms):`, pingResult);
    
    // Test write operation
    const writeStart = Date.now();
    const timestamp = new Date().toISOString();
    const writeResult = await redis.set('test_key', `Test value at ${timestamp}`);
    const writeDuration = Date.now() - writeStart;
    console.log(`Redis write test (${writeDuration}ms):`, writeResult);
    
    // Test read operation
    const readStart = Date.now();
    const readResult = await redis.get('test_key');
    const readDuration = Date.now() - readStart;
    console.log(`Redis read test (${readDuration}ms):`, readResult);
    
    return {
      success: true,
      ping: { result: pingResult, duration: pingDuration },
      write: { result: writeResult, duration: writeDuration },
      read: { result: readResult, duration: readDuration }
    };
  } catch (error) {
    console.error('⛔️ Redis test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

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
    
    // Store user details - handle each field individually for safety
    const userKey = `user:${telegramId}`;
    
    // Ensure all string fields are actually strings to avoid Redis errors
    const sanitizedUsername = String(username || '');
    const sanitizedFirstName = String(firstName || '');
    const sanitizedLastName = String(lastName || '');
    
    const userDetails = {
      telegramId: String(telegramId),
      username: sanitizedUsername,
      firstName: sanitizedFirstName,
      lastName: sanitizedLastName,
      lastScore: score,
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`Storing user details at ${userKey}:`, userDetails);
    
    try {
      // First delete any existing key to avoid type conflicts
      await redis.del(userKey);
      
      // Then set the new values
      const hsetResult = await redis.hset(userKey, userDetails);
      console.log(`HSET result:`, hsetResult);
    } catch (hsetError) {
      console.error('Error with HSET operation:', hsetError);
      
      // Try a more basic approach if the first one fails
      try {
        console.log('Trying alternative Redis storage method...');
        // Store as a JSON string instead of hash
        const jsonResult = await redis.set(userKey, JSON.stringify(userDetails));
        console.log('Alternative storage result:', jsonResult);
        return true;
      } catch (fallbackError) {
        console.error('Fallback Redis storage also failed:', fallbackError);
        throw hsetError;
      }
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
        const userKey = `user:${telegramId}`;
        userDetails = await redis.hgetall(userKey);
        console.log(`User details for ${telegramId}:`, userDetails);
        
        // Check if we got hash data
        if (!userDetails || Object.keys(userDetails).length === 0) {
          // Try to get as JSON string (our fallback storage method)
          console.log(`No hash data found for ${telegramId}, trying JSON string format...`);
          const jsonStr = await redis.get(userKey);
          
          if (jsonStr) {
            try {
              userDetails = JSON.parse(jsonStr);
              console.log(`Parsed JSON user data for ${telegramId}:`, userDetails);
            } catch (jsonError) {
              console.warn(`Failed to parse JSON data for ${telegramId}:`, jsonError);
            }
          }
        }
      } catch (e) {
        console.warn(`Could not get details for user ${telegramId}:`, e);
      }
      
      // If we still don't have user details or they're invalid, use defaults
      if (!userDetails || Object.keys(userDetails).length === 0) {
        console.warn(`Using default user details for ${telegramId}`);
        userDetails = {
          telegramId,
          username: 'Unknown',
          firstName: 'Player',
          lastName: telegramId.substring(0, 6)
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