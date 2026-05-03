import { describe, it, expect } from "vitest";
import {
  computeAvgTicket,
  computeDaysSince,
  computeRecencyBonus,
  computeEngagementScore,
  computeEngagementScoreV2,
  classifyABC,
} from "../value-objects";

describe("computeAvgTicket", () => {
  it("divides revenue by sales count", () => {
    expect(computeAvgTicket(1000, 5)).toBe(200);
  });
  it("guards against zero sales", () => {
    expect(computeAvgTicket(1000, 0)).toBe(0);
  });
});

describe("computeDaysSince", () => {
  it("returns -1 when date is null", () => {
    expect(computeDaysSince(null)).toBe(-1);
  });
  it("computes whole days between past date and now", () => {
    const now = new Date("2026-05-10T12:00:00Z");
    const past = new Date("2026-05-01T12:00:00Z");
    expect(computeDaysSince(past, now)).toBe(9);
  });
});

describe("computeRecencyBonus (legacy)", () => {
  it("gives full bonus for very recent purchase", () => {
    expect(computeRecencyBonus(5)).toBe(30);
  });
  it("gives moderate bonus around 30-60 days", () => {
    expect(computeRecencyBonus(45)).toBe(15);
  });
  it("gives no bonus past 60 days", () => {
    expect(computeRecencyBonus(120)).toBe(0);
  });
  it("gives no bonus when never purchased", () => {
    expect(computeRecencyBonus(-1)).toBe(0);
  });
});

describe("computeEngagementScore (legacy)", () => {
  it("caps at the 100 ceiling", () => {
    const { score } = computeEngagementScore(50, 5);
    expect(score).toBe(100);
  });
  it("returns 0 when no sales and no recency", () => {
    const { score } = computeEngagementScore(0, -1);
    expect(score).toBe(0);
  });
});

describe("computeEngagementScoreV2 (40/30/20/10)", () => {
  it("yields 0 for a never-buyer with no activity", () => {
    const result = computeEngagementScoreV2({
      salesCount: 0,
      daysSinceLastPurchase: -1,
      avgTicket: 0,
      referralsCount: 0,
    });
    expect(result.score).toBe(0);
  });

  it("caps each component at its weight", () => {
    const result = computeEngagementScoreV2({
      salesCount: 100,
      daysSinceLastPurchase: 0,
      avgTicket: 100_000,
      referralsCount: 100,
    });
    expect(result.breakdown.frequency).toBe(40);
    expect(result.breakdown.recency).toBe(30);
    expect(result.breakdown.ticket).toBe(20);
    expect(result.breakdown.referrals).toBe(10);
    expect(result.score).toBe(100);
  });

  it("rewards a moderate active client proportionally", () => {
    const result = computeEngagementScoreV2({
      salesCount: 4, // half of 8 saturation → ~20
      daysSinceLastPurchase: 45, // moderate → 15
      avgTicket: 100, // half of 200 benchmark → 10
      referralsCount: 0, // no source → 0
    });
    expect(result.breakdown.frequency).toBe(20);
    expect(result.breakdown.recency).toBe(15);
    expect(result.breakdown.ticket).toBe(10);
    expect(result.breakdown.referrals).toBe(0);
    expect(result.score).toBe(45);
  });

  it("zeroes the recency component when client never purchased", () => {
    const result = computeEngagementScoreV2({
      salesCount: 0,
      daysSinceLastPurchase: -1,
      avgTicket: 0,
      referralsCount: 0,
    });
    expect(result.breakdown.recency).toBe(0);
  });
});

describe("classifyABC", () => {
  it("returns empty buckets for empty input", () => {
    expect(classifyABC([])).toEqual({ aIds: [], bIds: [], cIds: [] });
  });

  it("places top 20% in A, next 30% in B, rest in C", () => {
    const clients = Array.from({ length: 10 }, (_, i) => ({
      id: `c${i}`,
      totalSpent: 1000 - i * 100, // c0 highest, c9 lowest
    }));
    const result = classifyABC(clients);
    expect(result.aIds).toHaveLength(2); // 20%
    expect(result.bIds).toHaveLength(3); // 30% (cumulative 50%)
    expect(result.cIds).toHaveLength(5); // 50% remaining
    expect(result.aIds).toContain("c0");
    expect(result.aIds).toContain("c1");
    expect(result.cIds).toContain("c9");
  });

  it("places a single client in C (percentile 100% > B threshold)", () => {
    // Quirk of the percentile algorithm: with one client the cumulative
    // percentile is 1.0, which exceeds the 0.5 B-threshold and falls
    // through to C. Documented here so future refactors don't change
    // the behavior accidentally.
    const result = classifyABC([{ id: "x", totalSpent: 100 }]);
    expect(result.aIds).toEqual([]);
    expect(result.bIds).toEqual([]);
    expect(result.cIds).toEqual(["x"]);
  });
});
