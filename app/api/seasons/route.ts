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

// Get seasons list
export async function GET() {
  try {
    // Get all season keys
    const seasonKeys = await redis.keys('seasons:*');
    
    // Get each season's data
    const seasons = await Promise.all(
      seasonKeys.map(async (key: string) => {
        const seasonData = await redis.get(key) as Record<string, any> | null;
        const seasonId = key.split(':')[1];
        
        // Check active status
        const isActive = await redis.hexists('activeSeasons', seasonId) ? true : false;
        
        return {
          id: seasonId,
          ...(seasonData || {}),
          isActive
        } as Season;
      })
    );
    
    // Sort by start date (newest first)
    const sortedSeasons = seasons.sort((a, b) => {
      const dateA = new Date(a.startDate || 0).getTime();
      const dateB = new Date(b.startDate || 0).getTime();
      return dateB - dateA; // Sort descending so newest seasons come first
    });
    
    return NextResponse.json({ seasons: sortedSeasons });
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return NextResponse.json({ error: 'Server error occurred' }, { status: 500 });
  }
}

// Create or update a season
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, name, startDate, endDate, isActive } = data;
    
    // Generate or use provided season ID
    let seasonId = id;
    
    // Create new ID if not provided
    if (!seasonId) {
      // Count existing seasons
      const seasonKeys = await redis.keys('seasons:*');
      const seasonCount = seasonKeys.length;
      
      // Generate new season ID (season1, season2, ...)
      seasonId = `season${seasonCount + 1}`;
    }
    
    // Validate required parameters
    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    // Save season data
    const seasonKey = `seasons:${seasonId}`;
    await redis.set(seasonKey, {
      name,
      startDate,
      endDate,
      createdAt: Date.now()
    });
    
    // Set active status
    if (isActive) {
      // Deactivate all existing active seasons
      await redis.del('activeSeasons');
      // Set new active season
      await redis.hset('activeSeasons', { [seasonId]: true });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Season created/updated successfully',
      seasonId
    });
  } catch (error) {
    console.error('Error creating/updating season:', error);
    return NextResponse.json({ error: 'Server error occurred' }, { status: 500 });
  }
} 