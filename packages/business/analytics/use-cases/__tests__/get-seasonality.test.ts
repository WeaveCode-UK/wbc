// T2.26 — getSeasonality (use-case glue)
//
// The use-case is a one-line forward to the repo; the aggregation /
// zero-fill logic lives in the prisma adapter. Tests here lock the
// glue contract:
//   - tenantId + monthsBack reach the repo unchanged.
//   - the repo's array is returned verbatim (no map/sort regression).
// Edge cases for the actual zero-fill (months without sales producing
// {salesCount:0, revenue:0} buckets) are exercised against a mock
// repo that returns the post-aggregation shape — we assert the use-case
// preserves that shape.

import { describe, it, expect, vi } from "vitest";
import { getSeasonality } from "../get-seasonality";
import type {
  AnalyticsRepository,
  SeasonalityBucket,
} from "../../ports/analytics-repository";

function repoMock(buckets: SeasonalityBucket[] = []): AnalyticsRepository {
  return {
    getDashboard: vi.fn(),
    getSalesStats: vi.fn(),
    getProductRanking: vi.fn(),
    getClientEngagement: vi.fn(),
    calculateABCClassification: vi.fn(),
    getSeasonality: vi.fn().mockResolvedValue(buckets),
    getTemporalComparison: vi.fn(),
  };
}

describe("getSeasonality", () => {
  it("forwards (tenantId, monthsBack) to the repo", async () => {
    const repo = repoMock();
    await getSeasonality("tenant-X", 6, repo);
    expect(repo.getSeasonality).toHaveBeenCalledWith("tenant-X", 6);
  });

  it("returns repo buckets verbatim — preserves zero-filled months", async () => {
    // Adapter contract: 3 buckets with one zero-month in the middle.
    // The use-case must NOT reorder or filter zeros.
    const buckets: SeasonalityBucket[] = [
      { year: 2026, month: 3, salesCount: 5, revenue: 500 },
      { year: 2026, month: 4, salesCount: 0, revenue: 0 },
      { year: 2026, month: 5, salesCount: 8, revenue: 800 },
    ];
    const repo = repoMock(buckets);
    const r = await getSeasonality("t1", 3, repo);
    expect(r).toEqual(buckets);
    expect(r[1]?.salesCount).toBe(0);
  });

  it("handles tenant with zero sales — repo returns N zero-buckets", async () => {
    const buckets: SeasonalityBucket[] = [
      { year: 2026, month: 4, salesCount: 0, revenue: 0 },
      { year: 2026, month: 5, salesCount: 0, revenue: 0 },
    ];
    const repo = repoMock(buckets);
    const r = await getSeasonality("t-empty", 2, repo);
    expect(r).toEqual(buckets);
    // Why: every bucket is zero — UI renders an empty-state, not a
    // chart with phantom values.
    expect(r.every((b) => b.salesCount === 0 && b.revenue === 0)).toBe(true);
  });

  it("returns empty array when monthsBack is 0 (boundary)", async () => {
    const repo = repoMock([]);
    const r = await getSeasonality("t1", 0, repo);
    expect(r).toEqual([]);
    expect(repo.getSeasonality).toHaveBeenCalledWith("t1", 0);
  });
});
