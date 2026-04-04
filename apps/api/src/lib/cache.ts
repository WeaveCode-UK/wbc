import { getRedis } from './redis';
import { createLogger } from './logger';

const logger = createLogger('cache');
const PREFIX = 'wbc:';
const DEFAULT_TTL = 300; // 5 minutes

function prefixKey(key: string): string {
  return `${PREFIX}${key}`;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis();
    const data = await redis.get(prefixKey(key));
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    logger.warn({ key, error }, 'Cache get failed — bypassing cache');
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T, ttl: number = DEFAULT_TTL): Promise<void> {
  try {
    const redis = getRedis();
    await redis.set(prefixKey(key), JSON.stringify(value), 'EX', ttl);
  } catch (error) {
    logger.warn({ key, error }, 'Cache set failed — bypassing cache');
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    const redis = getRedis();
    await redis.del(prefixKey(key));
  } catch (error) {
    logger.warn({ key, error }, 'Cache delete failed — bypassing cache');
  }
}

export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  try {
    const redis = getRedis();
    const keys = await redis.keys(prefixKey(pattern));
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    logger.warn({ pattern, error }, 'Cache invalidate failed — bypassing cache');
  }
}

// Cache TTL constants
export const CACHE_TTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 900,        // 15 minutes
  ENTITLEMENTS: 300, // 5 minutes — for plan/feature cache
} as const;
