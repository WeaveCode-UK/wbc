// T2.25 — analytics use-cases (recalculateABC, sales stats, product
// ranking, client engagement)
//
// The use-cases here are pass-throughs to AnalyticsRepository plus
// defensive defaults for callers that don't wire a repo. We assert:
//   - forwarding contract: tenantId reaches the repo unchanged.
//   - defensive defaults when repo is undefined (no throw — returns
//     zeros). This is load-bearing for boot paths that lazily wire
//     analytics.
//   - calculateABCClassification with no repo returns { updated: 0 }
//     (corner case: tenant with no sales / repo not yet plugged in).
// The ABC math itself is covered by domain/__tests__/value-objects.test.ts;
// here we only cover the use-case glue.

import { describe, it, expect, vi } from "vitest";
import {
  getSalesStats,
  getProductRanking,
  getClientEngagement,
  calculateABCClassification,
} from "../get-stats";
import type {
  AnalyticsRepository,
  ClientEngagement,
  ProductRankingItem,
  SalesStats,
} from "../../ports/analytics-repository";

function repoMock(
  overrides: Partial<AnalyticsRepository> = {},
): AnalyticsRepository {
  return {
    getDashboard: vi.fn(),
    getSalesStats: vi.fn().mockResolvedValue({
      totalSales: 0,
      totalRevenue: 0,
      avgTicket: 0,
    } satisfies SalesStats),
    getProductRanking: vi.fn().mockResolvedValue([]),
    getClientEngagement: vi.fn().mockResolvedValue({
      score: 0,
      breakdown: {
        salesCount: 0,
        totalSpent: 0,
        daysSinceLastPurchase: -1,
        avgTicket: 0,
        referralsCount: 0,
      },
      components: { frequency: 0, recency: 0, ticket: 0, referrals: 0 },
    } satisfies ClientEngagement),
    calculateABCClassification: vi.fn().mockResolvedValue({ updated: 5 }),
    getSeasonality: vi.fn().mockResolvedValue([]),
    getTemporalComparison: vi.fn(),
    ...overrides,
  };
}

describe("getSalesStats", () => {
  it("forwards tenantId to the repo and returns its result", async () => {
    const repo = repoMock({
      getSalesStats: vi.fn().mockResolvedValue({
        totalSales: 7,
        totalRevenue: 1234.5,
        avgTicket: 176.36,
      }),
    });
    const r = await getSalesStats("tenant-X", "monthly", repo);
    expect(repo.getSalesStats).toHaveBeenCalledWith("tenant-X");
    expect(r.totalSales).toBe(7);
  });
});

describe("getProductRanking", () => {
  it("returns [] defensively when repo is undefined (lazy wiring)", async () => {
    const r = await getProductRanking("t1", 10);
    expect(r).toEqual([]);
  });

  it("forwards tenantId and limit to the repo", async () => {
    const repo = repoMock({
      getProductRanking: vi
        .fn()
        .mockResolvedValue([
          { productId: "p1", totalQuantity: 10, totalRevenue: 100 },
        ] satisfies ProductRankingItem[]),
    });
    await getProductRanking("t1", 5, repo);
    expect(repo.getProductRanking).toHaveBeenCalledWith("t1", 5);
  });

  it("uses default limit=10 when caller omits it", async () => {
    const repo = repoMock();
    await getProductRanking("t1", undefined as unknown as number, repo);
    // Why: the type signature uses `limit: number = 10`, so undefined
    // falls back to 10. Lock that default in.
    expect(repo.getProductRanking).toHaveBeenCalledWith("t1", 10);
  });
});

describe("getClientEngagement", () => {
  it("returns a zero-shaped object when repo is undefined", async () => {
    const r = await getClientEngagement("t1", "c1");
    expect(r.score).toBe(0);
    expect(r.breakdown.daysSinceLastPurchase).toBe(-1);
    expect(r.components).toEqual({
      frequency: 0,
      recency: 0,
      ticket: 0,
      referrals: 0,
    });
  });

  it("forwards (tenantId, clientId) and returns the repo's result", async () => {
    const expected: ClientEngagement = {
      score: 84,
      breakdown: {
        salesCount: 12,
        totalSpent: 2400,
        daysSinceLastPurchase: 7,
        avgTicket: 200,
        referralsCount: 1,
      },
      components: { frequency: 40, recency: 30, ticket: 14, referrals: 0 },
    };
    const repo = repoMock({
      getClientEngagement: vi.fn().mockResolvedValue(expected),
    });
    const r = await getClientEngagement("t1", "c1", repo);
    expect(repo.getClientEngagement).toHaveBeenCalledWith("t1", "c1");
    expect(r).toEqual(expected);
  });
});

describe("calculateABCClassification", () => {
  it("returns { updated: 0 } when repo is undefined (tenant not yet wired)", async () => {
    const r = await calculateABCClassification("t1");
    expect(r).toEqual({ updated: 0 });
  });

  it("forwards tenantId and returns the repo's update count", async () => {
    const repo = repoMock({
      calculateABCClassification: vi.fn().mockResolvedValue({ updated: 42 }),
    });
    const r = await calculateABCClassification("t1", repo);
    expect(repo.calculateABCClassification).toHaveBeenCalledWith("t1");
    expect(r.updated).toBe(42);
  });

  it("handles tenant with zero sales (updated = 0)", async () => {
    const repo = repoMock({
      calculateABCClassification: vi.fn().mockResolvedValue({ updated: 0 }),
    });
    const r = await calculateABCClassification("t-empty", repo);
    expect(r.updated).toBe(0);
  });
});
