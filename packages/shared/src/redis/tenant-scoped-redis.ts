// TenantScopedRedis — isolamento multi-tenant de chaves Redis (ACH-012).
// Obtem tenantId do AsyncLocalStorage (@wbc/shared tenant-context) e prefixa
// automaticamente todas as chaves com `wbc:t:${tenantId}:`. Recusa operacoes
// sem contexto de tenant para prevenir vazamento cross-tenant.

import { getCurrentTenant } from "../context/tenant-context";

/** Prefixo canonico para chaves tenant-scoped. */
export const TENANT_SCOPED_KEY_PREFIX = "wbc:t:";

/** Interface minima esperada de um cliente Redis (subset compativel com ioredis). */
export interface RedisLike {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    mode?: string,
    duration?: number,
  ): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  scanStream(opts: { match: string; count?: number }): AsyncIterable<string[]>;
  pipeline(): { del(...keys: string[]): unknown; exec(): Promise<unknown> };
}

export class TenantContextMissingError extends Error {
  constructor() {
    super(
      "TenantScopedRedis: operacao tentada sem contexto de tenant. " +
        "Chame via runWithTenant() ou forneca tenantId explicito.",
    );
    this.name = "TenantContextMissingError";
  }
}

/**
 * Obtem o tenantId do contexto atual. Lanca erro se ausente — essa e a barreira
 * de seguranca contra vazamento cross-tenant.
 */
function currentTenantIdOrThrow(): string {
  const ctx = getCurrentTenant();
  if (!ctx || !ctx.tenantId) {
    throw new TenantContextMissingError();
  }
  return ctx.tenantId;
}

/** Constroi a chave final com prefixo tenant. */
export function tenantScopedKey(tenantId: string, key: string): string {
  return `${TENANT_SCOPED_KEY_PREFIX}${tenantId}:${key}`;
}

/**
 * Wrapper que injeta o tenantId do AsyncLocalStorage em toda chave acessada.
 * Uso tipico:
 *
 *     const tsr = new TenantScopedRedis(redisClient);
 *     await tsr.set('entitlements', JSON.stringify(data), 300);
 *     const v = await tsr.get('entitlements');
 *
 * Se o caller precisar acessar uma chave tenant especifica sem estar no contexto
 * (ex: em handler de evento externo), pode usar `.forTenant(tenantId).get(key)`.
 */
export class TenantScopedRedis {
  constructor(private readonly client: RedisLike) {}

  /** Liga um tenantId explicito (para uso fora de contexto AsyncLocalStorage). */
  forTenant(tenantId: string): TenantScopedRedisBound {
    if (!tenantId) throw new TenantContextMissingError();
    return new TenantScopedRedisBound(this.client, tenantId);
  }

  private keyFor(key: string): string {
    return tenantScopedKey(currentTenantIdOrThrow(), key);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(this.keyFor(key));
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds !== undefined) {
      await this.client.set(this.keyFor(key), value, "EX", ttlSeconds);
    } else {
      await this.client.set(this.keyFor(key), value);
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(this.keyFor(key));
  }

  /** Invalida todas as chaves deste tenant que batem com o pattern fornecido (ex: 'entitlements:*'). */
  async invalidatePattern(pattern: string): Promise<number> {
    const tenantId = currentTenantIdOrThrow();
    return scanAndDelete(this.client, tenantScopedKey(tenantId, pattern));
  }
}

/** Mesma interface de TenantScopedRedis mas com tenantId fixado no construtor. */
export class TenantScopedRedisBound {
  constructor(
    private readonly client: RedisLike,
    private readonly tenantId: string,
  ) {}

  private keyFor(key: string): string {
    return tenantScopedKey(this.tenantId, key);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(this.keyFor(key));
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds !== undefined) {
      await this.client.set(this.keyFor(key), value, "EX", ttlSeconds);
    } else {
      await this.client.set(this.keyFor(key), value);
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(this.keyFor(key));
  }

  async invalidatePattern(pattern: string): Promise<number> {
    return scanAndDelete(this.client, tenantScopedKey(this.tenantId, pattern));
  }
}

async function scanAndDelete(
  client: RedisLike,
  matchPattern: string,
): Promise<number> {
  const stream = client.scanStream({ match: matchPattern, count: 100 });
  const pipeline = client.pipeline();
  let count = 0;
  for await (const keys of stream) {
    for (const key of keys) {
      pipeline.del(key);
      count++;
    }
  }
  if (count > 0) await pipeline.exec();
  return count;
}
