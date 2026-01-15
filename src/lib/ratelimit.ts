import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create Redis client - will use env vars UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

// Only initialize if Upstash credentials are available
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  // Create a new ratelimiter that allows 10 requests per 10 seconds
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '10 s'),
    analytics: true,
    prefix: '@upstash/ratelimit',
  });
}

/**
 * Rate limiting for general API endpoints
 * Allows 10 requests per 10 seconds per identifier
 */
export async function checkRateLimit(identifier: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  // If rate limiting is not configured, allow all requests
  if (!ratelimit) {
    console.warn('Rate limiting not configured - add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable');
    return {
      success: true,
      limit: 10,
      remaining: 10,
      reset: Date.now() + 10000,
    };
  }

  const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
  
  return {
    success,
    limit,
    remaining,
    reset,
  };
}

/**
 * Strict rate limiting for sensitive endpoints (auth, payments)
 * Allows 5 requests per minute per identifier
 */
export async function checkStrictRateLimit(identifier: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  // If rate limiting is not configured, allow all requests
  if (!redis) {
    console.warn('Rate limiting not configured - add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable');
    return {
      success: true,
      limit: 5,
      remaining: 5,
      reset: Date.now() + 60000,
    };
  }

  const strictRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
    prefix: '@upstash/ratelimit:strict',
  });

  const { success, limit, remaining, reset } = await strictRatelimit.limit(identifier);
  
  return {
    success,
    limit,
    remaining,
    reset,
  };
}

/**
 * Very strict rate limiting for critical endpoints (registration, password reset)
 * Allows 3 requests per hour per identifier
 */
export async function checkCriticalRateLimit(identifier: string): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  // If rate limiting is not configured, allow all requests
  if (!redis) {
    console.warn('Rate limiting not configured - add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable');
    return {
      success: true,
      limit: 3,
      remaining: 3,
      reset: Date.now() + 3600000,
    };
  }

  const criticalRatelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    analytics: true,
    prefix: '@upstash/ratelimit:critical',
  });

  const { success, limit, remaining, reset } = await criticalRatelimit.limit(identifier);
  
  return {
    success,
    limit,
    remaining,
    reset,
  };
}

/**
 * Helper to get client identifier from request
 * Uses IP address or forwarded IP
 */
export function getClientIdentifier(request: Request): string {
  // Try to get forwarded IP (from proxy/CDN)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Try to get real IP
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback to a generic identifier
  return 'unknown';
}
