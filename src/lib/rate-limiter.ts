// src/lib/rate-limiter.ts

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const cache = new Map<string, RateLimitInfo>();

/**
 * Simple in-memory rate limiter.
 * In production, this should use Redis for distributed support.
 * 
 * @param key - Unique key for rate limiting (e.g., telegramId or IP)
 * @param limit - Maximum requests allowed per window
 * @param windowMs - Time window in milliseconds (default 1 second)
 * @returns true if request is allowed, false if rate limited
 */
export function isRateLimited(key: string, limit: number = 5, windowMs: number = 1000): boolean {
  const now = Date.now();
  const info = cache.get(key);

  if (!info || now > info.resetTime) {
    // New window
    cache.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return false; // Not limited
  }

  if (info.count >= limit) {
    return true; // Limited
  }

  info.count += 1;
  return false; // Not limited
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, info] of cache.entries()) {
    if (now > info.resetTime) {
      cache.delete(key);
    }
  }
}, 5 * 60 * 1000);
