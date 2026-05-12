// src/lib/cache.ts

type CacheEntry<T> = {
  value: T;
  expires: number;
};

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, value: T, ttlSeconds: number = 60): void {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Global instance to persist across HMR in dev if needed
const globalCache: SimpleCache = (global as any)._simpleCache || new SimpleCache();
if (process.env.NODE_ENV !== 'production') {
  (global as any)._simpleCache = globalCache;
}

export const cache = globalCache;
