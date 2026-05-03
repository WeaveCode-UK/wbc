// T6 — Rate limiting (HG1 from CHECAGEM)
//
// Unit-level coverage with a mock Redis. The sliding-window real test
// (T6.4) and the connection-pool exhaust scenario (T6.7) need a live
// Redis + load — those go to T5/T8 with testcontainers / k6.
//
// What we cover here:
//   - per-plan tenant budget ceilings (Essential 300, Pro 1500)
//   - per-route sensitive limits beat the default protected limit
//   - tenant isolation: tenant A exhausting its budget does not affect tenant B
//   - public/protected key namespacing (no cross-bucket leak)
//   - 429 surface (`TRPCError` with code `TOO_MANY_REQUESTS`)
//   - boundary: exactly maxRequests passes; the next one fails
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

// In-memory Redis stand-in — `incr` increments, `expire` is a no-op.
function makeFakeRedis() {
  const store = new Map<string, number>();
  return {
    store,
    incr: vi.fn(async (key: string) => {
      const next = (store.get(key) ?? 0) + 1;
      store.set(key, next);
      return next;
    }),
    expire: vi.fn(async (_key: string, _seconds: number) => 1),
    flushall: () => store.clear(),
  };
}

const fakeRedis = makeFakeRedis();

vi.mock("../../lib/redis", () => ({
  getRedis: () => fakeRedis,
}));

import {
  applyPublicRateLimit,
  applyProtectedRateLimit,
  applyTenantBudgetLimit,
  shouldShed,
} from "../rate-limit-middleware";

beforeEach(() => {
  fakeRedis.flushall();
  fakeRedis.incr.mockClear();
  fakeRedis.expire.mockClear();
});

describe("applyPublicRateLimit", () => {
  it("allows up to 30 requests in the window for a generic public path", async () => {
    for (let i = 0; i < 30; i++) {
      await applyPublicRateLimit("clients.list", "ip-1");
    }
    // 31st must throw.
    await expect(
      applyPublicRateLimit("clients.list", "ip-1"),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("uses a tighter sensitive bucket for auth.login (5/min)", async () => {
    for (let i = 0; i < 5; i++) {
      await applyPublicRateLimit("auth.login", "ip-attacker");
    }
    await expect(
      applyPublicRateLimit("auth.login", "ip-attacker"),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("uses an even tighter bucket for catalog.getPublicShowcase (10/min) — anti-enum", async () => {
    for (let i = 0; i < 10; i++) {
      await applyPublicRateLimit("catalog.getPublicShowcase", "ip-scanner");
    }
    await expect(
      applyPublicRateLimit("catalog.getPublicShowcase", "ip-scanner"),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("isolates buckets by IP — exhausting ip-A does not affect ip-B", async () => {
    for (let i = 0; i < 30; i++) {
      await applyPublicRateLimit("clients.list", "ip-A");
    }
    // ip-B has its own bucket.
    await expect(
      applyPublicRateLimit("clients.list", "ip-B"),
    ).resolves.toBeUndefined();
  });

  it("isolates buckets by path — exhausting one path does not block another", async () => {
    for (let i = 0; i < 30; i++) {
      await applyPublicRateLimit("clients.list", "ip-A");
    }
    await expect(
      applyPublicRateLimit("sales.list", "ip-A"),
    ).resolves.toBeUndefined();
  });

  it("throws TOO_MANY_REQUESTS code (not generic 500) on overflow", async () => {
    for (let i = 0; i < 5; i++) {
      await applyPublicRateLimit("auth.login", "ip-1");
    }
    try {
      await applyPublicRateLimit("auth.login", "ip-1");
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(TRPCError);
      expect((err as TRPCError).code).toBe("TOO_MANY_REQUESTS");
    }
  });
});

describe("applyProtectedRateLimit", () => {
  it("allows up to 100 requests in the window for a generic protected path", async () => {
    for (let i = 0; i < 100; i++) {
      await applyProtectedRateLimit("clients.list", "t1", "u1");
    }
    await expect(
      applyProtectedRateLimit("clients.list", "t1", "u1"),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("scopes by (tenantId, userId) — same tenant, different user is independent", async () => {
    for (let i = 0; i < 100; i++) {
      await applyProtectedRateLimit("clients.list", "t1", "u-alice");
    }
    await expect(
      applyProtectedRateLimit("clients.list", "t1", "u-bob"),
    ).resolves.toBeUndefined();
  });

  it("scopes by tenantId — different tenants are independent", async () => {
    for (let i = 0; i < 100; i++) {
      await applyProtectedRateLimit("clients.list", "t-A", "u1");
    }
    await expect(
      applyProtectedRateLimit("clients.list", "t-B", "u1"),
    ).resolves.toBeUndefined();
  });

  it("does not share buckets with the public limiter (different namespace)", async () => {
    for (let i = 0; i < 30; i++) {
      await applyPublicRateLimit("clients.list", "t1:u1");
    }
    // Public bucket exhausted, but protected uses its own key prefix.
    await expect(
      applyProtectedRateLimit("clients.list", "t1", "u1"),
    ).resolves.toBeUndefined();
  });
});

describe("applyTenantBudgetLimit (HG1 — per-tenant aggregate)", () => {
  it("ESSENTIAL plan caps at 300 / window", async () => {
    for (let i = 0; i < 300; i++) {
      await applyTenantBudgetLimit("t1", "ESSENTIAL");
    }
    await expect(
      applyTenantBudgetLimit("t1", "ESSENTIAL"),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("PRO plan caps at 1500 / window — 5× ESSENTIAL", async () => {
    for (let i = 0; i < 1500; i++) {
      await applyTenantBudgetLimit("t1", "PRO");
    }
    await expect(applyTenantBudgetLimit("t1", "PRO")).rejects.toBeInstanceOf(
      TRPCError,
    );
  });

  it("noisy tenant cannot affect a quiet tenant's budget", async () => {
    for (let i = 0; i < 300; i++) {
      await applyTenantBudgetLimit("noisy", "ESSENTIAL");
    }
    await expect(
      applyTenantBudgetLimit("quiet", "ESSENTIAL"),
    ).resolves.toBeUndefined();
  });

  it("the 429 message names the budget so operators recognise it in logs", async () => {
    for (let i = 0; i < 300; i++) {
      await applyTenantBudgetLimit("t1", "ESSENTIAL");
    }
    try {
      await applyTenantBudgetLimit("t1", "ESSENTIAL");
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(TRPCError);
      expect((err as TRPCError).message).toContain("budget");
    }
  });
});

describe("shouldShed (adaptive shedding stub)", () => {
  it("returns false when ADAPTIVE_SHEDDING flag is unset", () => {
    delete process.env.ADAPTIVE_SHEDDING;
    expect(shouldShed(9999)).toBe(false);
  });

  it("still returns false (placeholder) even when flag is on — implementation pending", () => {
    process.env.ADAPTIVE_SHEDDING = "1";
    expect(shouldShed(9999)).toBe(false);
    delete process.env.ADAPTIVE_SHEDDING;
  });
});
