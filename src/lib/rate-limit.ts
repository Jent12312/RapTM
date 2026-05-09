// src/lib/rate-limit.ts

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

const cache = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  limit: number;     // requests
  window: number;    // milliseconds
}

/**
 * Basic in-memory rate limiter.
 * Note: In production (serverless), this should use Upstash/Redis.
 */
export async function rateLimit(identifier: string, config: RateLimitConfig) {
  const now = Date.now();
  const entry = cache.get(identifier);

  if (!entry || now > entry.resetTime) {
    cache.set(identifier, {
      count: 1,
      resetTime: now + config.window,
    });
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: now + config.window,
    };
  }

  if (entry.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: entry.resetTime,
    };
  }

  entry.count += 1;
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    reset: entry.resetTime,
  };
}
