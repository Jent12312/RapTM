// src/lib/rate-limiter.ts

export interface RateLimitConfig 
{
  limit: number;     
  window: number;    
}

export interface RateLimitResult 
{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

interface RateLimitInfo 
{
  count: number;
  resetTime: number;
}

const cache = new Map<string, RateLimitInfo>();

// Универсальный ограничитель частоты запросов в оперативной памяти.
export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult 
{
  const now = Date.now();
  const info = cache.get(key);

  if (!info || now > info.resetTime) 
  {
    const resetTime = now + config.window;
    cache.set(key, {
      count: 1,
      resetTime: resetTime,
    });
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: resetTime,
    };
  }

  if (info.count >= config.limit) 
  {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: info.resetTime,
    };
  }

  info.count += 1;
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - info.count,
    reset: info.resetTime,
  };
}


//Упрощенная проверка лимита (возвращает только boolean)

export function isRateLimited(key: string, limit: number = 5, windowMs: number = 1000): boolean 
{
  const result = rateLimit(key, { limit, window: windowMs });
  return !result.success;
}

// Очистка устаревших записей каждые 5 минут для экономии памяти
if (typeof setInterval !== 'undefined') 
{
  setInterval(() => {
    const now = Date.now();
    for (const [key, info] of cache.entries()) {
      if (now > info.resetTime) {
        cache.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
