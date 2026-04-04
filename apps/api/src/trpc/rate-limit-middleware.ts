import { TRPCError } from '@trpc/server';
import { getRedis } from '../lib/redis';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const PUBLIC_LIMIT: RateLimitConfig = { windowMs: 60_000, maxRequests: 30 };
const PROTECTED_LIMIT: RateLimitConfig = { windowMs: 60_000, maxRequests: 100 };

function getKey(prefix: string, identifier: string, path: string): string {
  return `ratelimit:${prefix}:${identifier}:${path}`;
}

async function checkRateLimit(key: string, config: RateLimitConfig): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getRedis();
  const windowSeconds = Math.ceil(config.windowMs / 1000);

  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }

  return {
    allowed: current <= config.maxRequests,
    remaining: Math.max(0, config.maxRequests - current),
  };
}

export async function applyPublicRateLimit(path: string, identifier: string): Promise<void> {
  const key = getKey('pub', identifier, path);
  const { allowed } = await checkRateLimit(key, PUBLIC_LIMIT);
  if (!allowed) {
    throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded' });
  }
}

export async function applyProtectedRateLimit(path: string, tenantId: string, userId: string): Promise<void> {
  const key = getKey('auth', `${tenantId}:${userId}`, path);
  const { allowed } = await checkRateLimit(key, PROTECTED_LIMIT);
  if (!allowed) {
    throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded' });
  }
}
