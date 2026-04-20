import { getRedis } from "./redis";
import { createLogger } from "./logger";
import {
  TenantScopedRedis,
  type RedisLike,
  CACHE_TTL_DEFAULT_SECONDS,
} from "@wbc/shared";

const logger = createLogger("cache");
const PREFIX = "wbc:";
const DEFAULT_TTL = CACHE_TTL_DEFAULT_SECONDS;

function prefixKey(key: string): string {
  return `${PREFIX}${key}`;
}

// Lazy-init so the wrapper is only built on first use (keeps test bootstrap
// cheap when cache paths aren't exercised). TenantScopedRedis refuses any
// operation without a tenant in AsyncLocalStorage — that's what prevents
// cache keys from one tenant leaking into another, which is why every
// per-tenant cache MUST go through `getTenantScopedRedis()` rather than the
// raw client from `getRedis()`.
let tenantScopedInstance: TenantScopedRedis | null = null;
export function getTenantScopedRedis(): TenantScopedRedis {
  if (!tenantScopedInstance) {
    tenantScopedInstance = new TenantScopedRedis(
      getRedis() as unknown as RedisLike,
    );
  }
  return tenantScopedInstance;
}

/**
 * Cache tenant-scoped: exige contexto de tenant (AsyncLocalStorage). Lanca
 * TenantContextMissingError se usado fora de contexto — previne vazamento
 * cross-tenant que e facil de acontecer com os helpers globais abaixo.
 *
 * Prefira estas funcoes em qualquer cache por-tenant; use as versoes sem
 * sufixo `ForTenant` apenas para caches globais (feature flags publicas etc.).
 */
export async function cacheGetForTenant<T>(key: string): Promise<T | null> {
  try {
    const data = await getTenantScopedRedis().get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    logger.warn({ key, error }, "Tenant cache get failed — bypassing cache");
    return null;
  }
}

export async function cacheSetForTenant<T>(
  key: string,
  value: T,
  ttl: number = DEFAULT_TTL,
): Promise<void> {
  try {
    await getTenantScopedRedis().set(key, JSON.stringify(value), ttl);
  } catch (error) {
    logger.warn({ key, error }, "Tenant cache set failed — bypassing cache");
  }
}

export async function cacheDeleteForTenant(key: string): Promise<void> {
  try {
    await getTenantScopedRedis().delete(key);
  } catch (error) {
    logger.warn({ key, error }, "Tenant cache delete failed — bypassing cache");
  }
}

export async function cacheInvalidatePatternForTenant(
  pattern: string,
): Promise<number> {
  try {
    return await getTenantScopedRedis().invalidatePattern(pattern);
  } catch (error) {
    logger.warn(
      { pattern, error },
      "Tenant cache invalidate failed — bypassing cache",
    );
    return 0;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis();
    const data = await redis.get(prefixKey(key));
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    logger.warn({ key, error }, "Cache get failed — bypassing cache");
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttl: number = DEFAULT_TTL,
): Promise<void> {
  try {
    const redis = getRedis();
    await redis.set(prefixKey(key), JSON.stringify(value), "EX", ttl);
  } catch (error) {
    logger.warn({ key, error }, "Cache set failed — bypassing cache");
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    const redis = getRedis();
    await redis.del(prefixKey(key));
  } catch (error) {
    logger.warn({ key, error }, "Cache delete failed — bypassing cache");
  }
}

/** Max DEL commands per pipeline flush — caps memory/latency on Redis and
 *  on the worker even when a tenant has tens of thousands of cache keys. */
const INVALIDATE_BATCH_SIZE = 500;

export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  try {
    const redis = getRedis();
    const stream = redis.scanStream({ match: prefixKey(pattern), count: 100 });

    let pipeline = redis.pipeline();
    let batched = 0;
    let totalDeleted = 0;

    // ACH-015: chunk DEL into pipelines of at most INVALIDATE_BATCH_SIZE so
    // a pattern that matches 50k keys doesn't queue 50k commands in a single
    // pipeline (which used to risk Redis timeout / worker OOM).
    for await (const keys of stream) {
      for (const key of keys as string[]) {
        pipeline.del(key);
        batched++;
        if (batched >= INVALIDATE_BATCH_SIZE) {
          await pipeline.exec();
          totalDeleted += batched;
          pipeline = redis.pipeline();
          batched = 0;
        }
      }
    }

    if (batched > 0) {
      await pipeline.exec();
      totalDeleted += batched;
    }

    if (totalDeleted > 0) {
      logger.debug({ pattern, totalDeleted }, "Cache pattern invalidated");
    }
  } catch (error) {
    logger.warn(
      { pattern, error },
      "Cache invalidate failed — bypassing cache",
    );
  }
}

// Cache TTL constants
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 900, // 15 minutes
  ENTITLEMENTS: 300, // 5 minutes — for plan/feature cache
} as const;
