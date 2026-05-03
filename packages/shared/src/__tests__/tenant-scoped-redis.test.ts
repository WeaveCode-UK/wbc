import { describe, it, expect, beforeEach } from "vitest";
import {
  TenantScopedRedis,
  TenantScopedRedisBound,
  TenantContextMissingError,
  tenantScopedKey,
  TENANT_SCOPED_KEY_PREFIX,
  type RedisLike,
} from "../redis/tenant-scoped-redis";
import { runWithTenant } from "../context/tenant-context";
import type { TenantContext } from "../types/tenant";

// ACH-012. TenantScopedRedis prefixes every key with `wbc:t:${tenantId}:`
// and refuses operations without a tenant context. We exercise both the
// AsyncLocalStorage-aware `TenantScopedRedis` and the bound variant
// against a hand-rolled in-memory `RedisLike` — full ioredis isn't
// needed since the surface area is small.

class InMemoryRedis implements RedisLike {
  store: Map<string, string> = new Map();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async set(
    key: string,
    value: string,
    _mode?: string,
    _duration?: number,
  ): Promise<unknown> {
    // The TTL args are accepted for parity but ignored — TTL behaviour
    // is verified separately by counting calls (see `setCalls`).
    this.store.set(key, value);
    return "OK";
  }

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const k of keys) {
      if (this.store.delete(k)) deleted++;
    }
    return deleted;
  }

  scanStream({
    match,
  }: {
    match: string;
    count?: number;
  }): AsyncIterable<string[]> {
    // Translate Redis glob to a JS regex (only `*` is meaningful here).
    const pattern = new RegExp(
      "^" +
        match.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") +
        "$",
    );
    const matched = Array.from(this.store.keys()).filter((k) =>
      pattern.test(k),
    );
    return {
      async *[Symbol.asyncIterator]() {
        if (matched.length > 0) yield matched;
      },
    };
  }

  pipeline(): { del(...keys: string[]): unknown; exec(): Promise<unknown> } {
    const queued: string[] = [];
    const self = this;
    return {
      del(...keys: string[]): unknown {
        for (const k of keys) queued.push(k);
        return this;
      },
      async exec(): Promise<unknown> {
        await self.del(...queued);
        return [];
      },
    };
  }
}

const TENANT_A: TenantContext = {
  tenantId: "tenant-a",
  userId: "u1",
  plan: "ESSENTIAL",
  role: "CONSULTANT",
  locale: "pt-BR",
  timezone: "America/Sao_Paulo",
  currency: "BRL",
};

describe("tenantScopedKey + TENANT_SCOPED_KEY_PREFIX", () => {
  it("uses the canonical prefix shape", () => {
    expect(TENANT_SCOPED_KEY_PREFIX).toBe("wbc:t:");
    expect(tenantScopedKey("tenant-a", "entitlements")).toBe(
      "wbc:t:tenant-a:entitlements",
    );
  });
});

describe("TenantContextMissingError", () => {
  it("has the expected name and explanatory message", () => {
    const e = new TenantContextMissingError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("TenantContextMissingError");
    expect(e.message).toContain("operacao tentada sem contexto de tenant");
  });
});

describe("TenantScopedRedis (context-aware)", () => {
  let redis: InMemoryRedis;
  let tsr: TenantScopedRedis;

  beforeEach(() => {
    redis = new InMemoryRedis();
    tsr = new TenantScopedRedis(redis);
  });

  it("get/set/delete are prefixed with tenantId from AsyncLocalStorage", async () => {
    await runWithTenant(TENANT_A, async () => {
      await tsr.set("entitlements", "json");
      // Underlying store sees the prefixed key, not the bare one.
      expect(redis.store.has("wbc:t:tenant-a:entitlements")).toBe(true);
      expect(await tsr.get("entitlements")).toBe("json");

      await tsr.delete("entitlements");
      expect(redis.store.has("wbc:t:tenant-a:entitlements")).toBe(false);
    });
  });

  it("set with ttl translates to Redis EX semantics", async () => {
    // We override `set` to inspect the args without changing the store.
    const args: unknown[][] = [];
    redis.set = async (...a: unknown[]): Promise<unknown> => {
      args.push(a);
      return "OK";
    };
    await runWithTenant(TENANT_A, async () => {
      await tsr.set("k", "v", 60);
    });
    expect(args[0]).toEqual(["wbc:t:tenant-a:k", "v", "EX", 60]);
  });

  it("set without ttl omits the EX args", async () => {
    const args: unknown[][] = [];
    redis.set = async (...a: unknown[]): Promise<unknown> => {
      args.push(a);
      return "OK";
    };
    await runWithTenant(TENANT_A, async () => {
      await tsr.set("k", "v");
    });
    expect(args[0]).toEqual(["wbc:t:tenant-a:k", "v"]);
  });

  it("throws when called outside a tenant context (cross-tenant guard)", async () => {
    await expect(tsr.get("k")).rejects.toBeInstanceOf(
      TenantContextMissingError,
    );
    await expect(tsr.set("k", "v")).rejects.toBeInstanceOf(
      TenantContextMissingError,
    );
    await expect(tsr.delete("k")).rejects.toBeInstanceOf(
      TenantContextMissingError,
    );
    await expect(tsr.invalidatePattern("*")).rejects.toBeInstanceOf(
      TenantContextMissingError,
    );
  });

  it("invalidatePattern only deletes keys belonging to the current tenant", async () => {
    // Pre-load keys from two tenants directly; the helper must isolate
    // tenant-a's namespace and never touch tenant-b's.
    redis.store.set("wbc:t:tenant-a:entitlements:1", "x");
    redis.store.set("wbc:t:tenant-a:entitlements:2", "x");
    redis.store.set("wbc:t:tenant-b:entitlements:1", "x");

    const deleted = await runWithTenant(TENANT_A, async () => {
      return tsr.invalidatePattern("entitlements:*");
    });

    expect(deleted).toBe(2);
    expect(redis.store.has("wbc:t:tenant-a:entitlements:1")).toBe(false);
    expect(redis.store.has("wbc:t:tenant-a:entitlements:2")).toBe(false);
    // Tenant-b must remain untouched — the cross-tenant invariant.
    expect(redis.store.has("wbc:t:tenant-b:entitlements:1")).toBe(true);
  });
});

describe("TenantScopedRedisBound (no AsyncLocalStorage required)", () => {
  let redis: InMemoryRedis;
  let bound: TenantScopedRedisBound;

  beforeEach(() => {
    redis = new InMemoryRedis();
    bound = new TenantScopedRedisBound(redis, "tenant-a");
  });

  it("get/set/delete use the bound tenantId", async () => {
    await bound.set("k", "v");
    expect(redis.store.has("wbc:t:tenant-a:k")).toBe(true);
    expect(await bound.get("k")).toBe("v");
    await bound.delete("k");
    expect(redis.store.has("wbc:t:tenant-a:k")).toBe(false);
  });

  it("forTenant returns a bound instance and refuses empty tenantId", () => {
    const tsr = new TenantScopedRedis(redis);
    const ok = tsr.forTenant("tenant-x");
    expect(ok).toBeInstanceOf(TenantScopedRedisBound);
    expect(() => tsr.forTenant("")).toThrow(TenantContextMissingError);
  });

  it("invalidatePattern scoped to the bound tenantId", async () => {
    redis.store.set("wbc:t:tenant-a:idem:1", "x");
    redis.store.set("wbc:t:tenant-b:idem:1", "x");
    const n = await bound.invalidatePattern("idem:*");
    expect(n).toBe(1);
    expect(redis.store.has("wbc:t:tenant-a:idem:1")).toBe(false);
    expect(redis.store.has("wbc:t:tenant-b:idem:1")).toBe(true);
  });

  it("set with ttl forwards EX args", async () => {
    const args: unknown[][] = [];
    redis.set = async (...a: unknown[]): Promise<unknown> => {
      args.push(a);
      return "OK";
    };
    await bound.set("k", "v", 30);
    expect(args[0]).toEqual(["wbc:t:tenant-a:k", "v", "EX", 30]);
  });
});
