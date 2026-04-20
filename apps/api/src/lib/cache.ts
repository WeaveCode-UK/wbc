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

// TenantScopedRedis lazy-inicializado para caches tenant-scoped (ACH-012).
// Usa o Redis client do app via getRedis() e o AsyncLocalStorage de tenant-context
// para prefixar chaves automaticamente com `wbc:t:${tenantId}:`.
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

export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  try {
    const redis = getRedis();
    const stream = redis.scanStream({ match: prefixKey(pattern), count: 100 });
    const pipeline = redis.pipeline();
    let count = 0;

    for await (const keys of stream) {
      for (const key of keys as string[]) {
        pipeline.del(key);
        count++;
      }
    }

    if (count > 0) await pipeline.exec();
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
