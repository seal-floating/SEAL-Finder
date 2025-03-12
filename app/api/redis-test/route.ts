import { NextRequest, NextResponse } from 'next/server';
import { testRedisConnection } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    // Print all environment variables related to Redis (with redacted values for security)
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
    
    // Test Redis connection
    const testResult = await testRedisConnection();
    
    // Return a success response with the test results
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      environmentVariables: redisEnvVars,
      redisTest: testResult
    });
  } catch (error) {
    console.error('Error testing Redis connection:', error);
    
    // Return an error response
    return NextResponse.json({ 
      error: 'Failed to test Redis connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}