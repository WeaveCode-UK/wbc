// Coverage gap: apps/api/src/lib/cache.ts is the single point that
// every per-tenant cache funnels through. Two non-obvious properties
// matter:
//   - graceful degradation: a Redis outage MUST NOT throw out of the
//     API — every helper logs+swallows and returns the "miss" path
//   - the tenant-scoped helpers (cacheGetForTenant / setForTenant /
//     deleteForTenant / invalidatePatternForTenant) ALWAYS go through
//     TenantScopedRedis, which throws TenantContextMissingError when
//     called without an AsyncLocalStorage tenant — so a forgotten
//     `withTenant` wrapper turns into a 0-cache result instead of a
//     cross-tenant leak.
//
// We mock `./redis` so getRedis() returns a fake. We don't try to mock
// TenantScopedRedis itself because the helper instantiates it lazily —
// the public contract we're locking is "tenant scope is required;
// errors degrade gracefully".

import { describe, it, expect, vi, beforeEach } from "vitest";

interface FakeRedis {
  get: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
  scanStream: ReturnType<typeof vi.fn>;
  pipeline: ReturnType<typeof vi.fn>;
}

const fakeRedis: FakeRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  scanStream: vi.fn(),
  pipeline: vi.fn(),
};

vi.mock("../redis", () => ({
  getRedis: () => fakeRedis,
}));

import {
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheGetForTenant,
  cacheSetForTenant,
  cacheDeleteForTenant,
  cacheInvalidatePatternForTenant,
  cacheInvalidatePattern,
  CACHE_TTL,
} from "../cache";
import { runWithTenant } from "@wbc/shared";

beforeEach(() => {
  fakeRedis.get.mockReset();
  fakeRedis.set.mockReset();
  fakeRedis.del.mockReset();
  fakeRedis.scanStream.mockReset();
  fakeRedis.pipeline.mockReset();
});

const TENANT = {
  tenantId: "t-1",
  userId: "u-1",
  plan: "ESSENTIAL" as const,
  role: "CONSULTANT" as const,
  locale: "pt-BR",
  timezone: "America/Sao_Paulo",
  currency: "BRL",
};

describe("cacheGet / cacheSet / cacheDelete (global, prefix=wbc:)", () => {
  it("get returns parsed JSON when the key exists under wbc:<key>", async () => {
    fakeRedis.get.mockResolvedValue(JSON.stringify({ a: 1 }));
    const result = await cacheGet<{ a: number }>("foo");
    expect(result).toEqual({ a: 1 });
    expect(fakeRedis.get).toHaveBeenCalledWith("wbc:foo");
  });

  it("get returns null when the key is missing (cache miss)", async () => {
    fakeRedis.get.mockResolvedValue(null);
    const result = await cacheGet("missing");
    expect(result).toBeNull();
  });

  it("get swallows Redis errors and returns null (graceful degradation)", async () => {
    fakeRedis.get.mockRejectedValue(new Error("ECONNREFUSED"));
    const result = await cacheGet("any");
    expect(result).toBeNull();
  });

  it("set forwards key, JSON value, EX and ttl to redis.set", async () => {
    fakeRedis.set.mockResolvedValue("OK");
    await cacheSet("foo", { a: 1 }, 60);
    expect(fakeRedis.set).toHaveBeenCalledWith(
      "wbc:foo",
      JSON.stringify({ a: 1 }),
      "EX",
      60,
    );
  });

  it("set uses CACHE_TTL_DEFAULT when ttl omitted", async () => {
    fakeRedis.set.mockResolvedValue("OK");
    await cacheSet("foo", { a: 1 });
    const args = fakeRedis.set.mock.calls[0]!;
    expect(typeof args[3]).toBe("number");
    expect((args[3] as number) > 0).toBe(true);
  });

  it("set swallows Redis errors so the request still succeeds", async () => {
    fakeRedis.set.mockRejectedValue(new Error("write failed"));
    await expect(cacheSet("foo", { a: 1 })).resolves.toBeUndefined();
  });

  it("delete calls redis.del with the prefixed key", async () => {
    fakeRedis.del.mockResolvedValue(1);
    await cacheDelete("foo");
    expect(fakeRedis.del).toHaveBeenCalledWith("wbc:foo");
  });

  it("delete swallows errors", async () => {
    fakeRedis.del.mockRejectedValue(new Error("nope"));
    await expect(cacheDelete("foo")).resolves.toBeUndefined();
  });
});

describe("cache*ForTenant — requires tenant context", () => {
  // These helpers use TenantScopedRedis under the hood; called without
  // a tenant they throw TenantContextMissingError, which the helpers
  // catch and degrade to the miss path. That's the property we lock.

  it("cacheGetForTenant returns null when called without tenant context", async () => {
    const result = await cacheGetForTenant("anything");
    expect(result).toBeNull();
  });

  it("cacheSetForTenant swallows the missing-context error", async () => {
    await expect(cacheSetForTenant("k", { a: 1 }, 60)).resolves.toBeUndefined();
  });

  it("cacheDeleteForTenant swallows the missing-context error", async () => {
    await expect(cacheDeleteForTenant("k")).resolves.toBeUndefined();
  });

  it("cacheInvalidatePatternForTenant returns 0 when no tenant context", async () => {
    const count = await cacheInvalidatePatternForTenant("foo:*");
    expect(count).toBe(0);
  });
});

describe("cache*ForTenant — with tenant context", () => {
  it("get/set go through TenantScopedRedis using the tenant-prefixed key", async () => {
    fakeRedis.set.mockResolvedValue("OK");
    fakeRedis.get.mockResolvedValue(JSON.stringify({ x: 9 }));

    await runWithTenant(TENANT, async () => {
      await cacheSetForTenant("entitlements", { x: 9 }, 300);
      const v = await cacheGetForTenant<{ x: number }>("entitlements");
      expect(v).toEqual({ x: 9 });
    });

    // The TenantScopedRedis prefix is `wbc:t:<tenantId>:<key>`. We
    // only need to check the prefix shape — exact format change is
    // a migration we'd notice via integration tests.
    const setArgs = fakeRedis.set.mock.calls[0]!;
    expect(typeof setArgs[0]).toBe("string");
    expect((setArgs[0] as string).includes("t-1")).toBe(true);
  });
});

describe("cacheInvalidatePattern (global)", () => {
  it("does nothing when SCAN yields no keys", async () => {
    // Empty AsyncIterable.
    const stream = {
      async *[Symbol.asyncIterator]() {
        // no-op
      },
    };
    fakeRedis.scanStream.mockReturnValue(stream);
    const pipelineMock = { del: vi.fn(), exec: vi.fn().mockResolvedValue([]) };
    fakeRedis.pipeline.mockReturnValue(pipelineMock);

    await cacheInvalidatePattern("foo:*");
    // Nothing was added to the pipeline, so exec is never called.
    expect(pipelineMock.del).not.toHaveBeenCalled();
  });

  it("flushes a final partial batch under INVALIDATE_BATCH_SIZE", async () => {
    const keys = ["wbc:foo:1", "wbc:foo:2", "wbc:foo:3"];
    const stream = {
      async *[Symbol.asyncIterator]() {
        yield keys;
      },
    };
    fakeRedis.scanStream.mockReturnValue(stream);
    const exec = vi.fn().mockResolvedValue([]);
    const del = vi.fn();
    fakeRedis.pipeline.mockReturnValue({ del, exec });

    await cacheInvalidatePattern("foo:*");

    // 3 DEL calls accumulated, then a single exec at the end.
    expect(del).toHaveBeenCalledTimes(3);
    expect(exec).toHaveBeenCalledOnce();
  });

  it("chunks DELs into pipelines of 500 (INVALIDATE_BATCH_SIZE)", async () => {
    const big = Array.from({ length: 750 }, (_, i) => `wbc:big:${i}`);
    const stream = {
      async *[Symbol.asyncIterator]() {
        yield big;
      },
    };
    fakeRedis.scanStream.mockReturnValue(stream);

    // The function creates a fresh pipeline after each flush; mock
    // returns a new shape on every call.
    let pipelineCount = 0;
    const exec = vi.fn().mockResolvedValue([]);
    fakeRedis.pipeline.mockImplementation(() => {
      pipelineCount++;
      return { del: vi.fn(), exec };
    });

    await cacheInvalidatePattern("big:*");

    // First 500 → exec; remaining 250 → exec → 2 pipeline rotations
    // produce 2 exec calls (the second one is the final partial batch).
    expect(exec).toHaveBeenCalledTimes(2);
    expect(pipelineCount).toBeGreaterThanOrEqual(2);
  });

  it("swallows scan errors (graceful degradation)", async () => {
    fakeRedis.scanStream.mockImplementation(() => {
      throw new Error("scan unavailable");
    });
    await expect(cacheInvalidatePattern("foo:*")).resolves.toBeUndefined();
  });
});

describe("CACHE_TTL constants", () => {
  it("exposes named buckets distinct from the legacy MEDIUM=300", () => {
    // Locks the public TTL contract — accidental rename / removal is
    // caught here.
    expect(CACHE_TTL.SHORT).toBe(60);
    expect(CACHE_TTL.LONG).toBe(900);
    expect(CACHE_TTL.ENTITLEMENTS).toBe(300);
    expect(CACHE_TTL.DASHBOARD).toBe(60);
    expect(CACHE_TTL.MONTHLY_STATS).toBe(3600);
    expect(CACHE_TTL.DAILY_STATS).toBe(900);
    expect(CACHE_TTL.CATALOG_PUBLIC).toBe(600);
  });
});
