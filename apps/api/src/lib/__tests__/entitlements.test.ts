// Coverage gap: entitlements is the plan-feature gate every Pro-locked
// router runs through. Two regressions would silently break the
// business model:
//   - cache returns stale `isActive`/`plan` after a plan change → user
//     loses access they paid for, or keeps access they didn't
//   - requirePlan('PRO') accidentally accepts ESSENTIAL → entire
//     catalog of paid features leaks
//
// We mock the cache helpers AND the subscription repository so we can
// drive every branch (cache hit / miss / not-found / inactive / wrong
// plan / Pro feature on essential).

import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  cacheGetForTenant,
  cacheSetForTenant,
  getTenantScopedRedis,
  findByTenantId,
} = vi.hoisted(() => ({
  cacheGetForTenant: vi.fn(),
  cacheSetForTenant: vi.fn().mockResolvedValue(undefined),
  getTenantScopedRedis: vi.fn(),
  findByTenantId: vi.fn(),
}));

vi.mock("../cache", () => ({
  cacheGetForTenant,
  cacheSetForTenant,
  getTenantScopedRedis,
  CACHE_TTL: { ENTITLEMENTS: 300 },
}));

vi.mock(
  "../../../../../packages/business/auth/adapters/prisma-subscription-repository",
  () => ({
    PrismaSubscriptionRepository: class {
      findByTenantId = findByTenantId;
    },
  }),
);

import {
  getEntitlements,
  invalidateEntitlements,
  requirePlan,
  requireFeature,
} from "../entitlements";

beforeEach(() => {
  cacheGetForTenant.mockReset();
  cacheSetForTenant.mockClear().mockResolvedValue(undefined);
  getTenantScopedRedis.mockReset();
  findByTenantId.mockReset();
});

const ACTIVE_PRO = {
  id: "s-1",
  tenantId: "t-1",
  plan: "PRO" as const,
  status: "ACTIVE",
  startsAt: new Date("2026-01-01"),
  expiresAt: null,
  aiGenerationsUsed: 5,
  aiGenerationsLimit: 100,
};

const ACTIVE_ESSENTIAL = {
  ...ACTIVE_PRO,
  plan: "ESSENTIAL" as const,
};

const EXPIRED = {
  ...ACTIVE_PRO,
  expiresAt: new Date("2020-01-01"),
};

describe("getEntitlements — cache + repo behaviour", () => {
  it("returns the cached entitlements without hitting the repo on a hit", async () => {
    cacheGetForTenant.mockResolvedValue({
      plan: "PRO",
      isActive: true,
      aiUsed: 1,
      aiLimit: 50,
    });

    const result = await getEntitlements("t-1");

    expect(result).toEqual({
      plan: "PRO",
      isActive: true,
      aiUsed: 1,
      aiLimit: 50,
    });
    expect(findByTenantId).not.toHaveBeenCalled();
    expect(cacheSetForTenant).not.toHaveBeenCalled();
  });

  it("loads from the repo on cache miss and writes the cache", async () => {
    cacheGetForTenant.mockResolvedValue(null);
    findByTenantId.mockResolvedValue(ACTIVE_PRO);

    const result = await getEntitlements("t-1");

    expect(result).toEqual({
      plan: "PRO",
      isActive: true,
      aiUsed: 5,
      aiLimit: 100,
    });
    expect(cacheSetForTenant).toHaveBeenCalledWith("entitlements", result, 300);
  });

  it("throws TRPCError NOT_FOUND when subscription doesn't exist", async () => {
    cacheGetForTenant.mockResolvedValue(null);
    findByTenantId.mockResolvedValue(null);

    await expect(getEntitlements("missing")).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Subscription not found",
    });
  });

  it("computes isActive=false for an expired subscription", async () => {
    cacheGetForTenant.mockResolvedValue(null);
    findByTenantId.mockResolvedValue(EXPIRED);

    const result = await getEntitlements("t-1");
    expect(result.isActive).toBe(false);
  });
});

describe("invalidateEntitlements", () => {
  it("delegates to TenantScopedRedis.delete with the cache key", async () => {
    const del = vi.fn().mockResolvedValue(undefined);
    getTenantScopedRedis.mockReturnValue({ delete: del });

    await invalidateEntitlements("t-1");

    expect(del).toHaveBeenCalledWith("entitlements");
  });
});

describe("requirePlan", () => {
  it("allows when plan matches and subscription is active", async () => {
    cacheGetForTenant.mockResolvedValue({
      plan: "PRO",
      isActive: true,
      aiUsed: 0,
      aiLimit: 100,
    });
    await expect(requirePlan("t-1", "PRO")).resolves.toBeUndefined();
  });

  it("throws FORBIDDEN when subscription is inactive", async () => {
    cacheGetForTenant.mockResolvedValue({
      plan: "PRO",
      isActive: false,
      aiUsed: 0,
      aiLimit: 100,
    });
    await expect(requirePlan("t-1", "PRO")).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Subscription is not active",
    });
  });

  it("throws FORBIDDEN when requiring PRO but tenant is on ESSENTIAL", async () => {
    cacheGetForTenant.mockResolvedValue({
      plan: "ESSENTIAL",
      isActive: true,
      aiUsed: 0,
      aiLimit: 100,
    });
    await expect(requirePlan("t-1", "PRO")).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "This feature requires the Pro plan",
    });
  });

  it("ESSENTIAL requirement is a no-op for both plans (only PRO is gated)", async () => {
    cacheGetForTenant.mockResolvedValue({
      plan: "ESSENTIAL",
      isActive: true,
      aiUsed: 0,
      aiLimit: 100,
    });
    await expect(requirePlan("t-1", "ESSENTIAL")).resolves.toBeUndefined();
  });
});

describe("requireFeature", () => {
  it("allows WHATSAPP_N2 on PRO", async () => {
    cacheGetForTenant.mockResolvedValue({
      plan: "PRO",
      isActive: true,
      aiUsed: 0,
      aiLimit: 100,
    });
    await expect(requireFeature("t-1", "WHATSAPP_N2")).resolves.toBeUndefined();
  });

  it("throws FORBIDDEN for WHATSAPP_N2 on ESSENTIAL", async () => {
    cacheGetForTenant.mockResolvedValue({
      plan: "ESSENTIAL",
      isActive: true,
      aiUsed: 0,
      aiLimit: 100,
    });
    await expect(requireFeature("t-1", "WHATSAPP_N2")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("throws FORBIDDEN when subscription is inactive (regardless of feature)", async () => {
    cacheGetForTenant.mockResolvedValue({
      plan: "PRO",
      isActive: false,
      aiUsed: 0,
      aiLimit: 100,
    });
    await expect(requireFeature("t-1", "WHATSAPP_N2")).rejects.toMatchObject({
      message: "Subscription is not active",
    });
  });

  it("loads entitlements via the repo when the cache is cold", async () => {
    cacheGetForTenant.mockResolvedValue(null);
    findByTenantId.mockResolvedValue(ACTIVE_ESSENTIAL);

    await expect(requireFeature("t-1", "WHATSAPP_N2")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
