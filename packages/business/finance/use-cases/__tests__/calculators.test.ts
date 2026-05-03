// T-coverage — getMargin / getGoalReverse / getCAC
//
// getMargin and getGoalReverse are pure: they re-export the domain
// helpers. Numbers are rounded to 2 decimals at the domain layer to
// match the BRL display format. CAC is a pass-through to the repo.
import { describe, it, expect, vi } from "vitest";
import { getMargin, getGoalReverse, getCAC } from "../calculators";
import type { FinanceRepository } from "../../ports/finance-repository";

describe("getMargin", () => {
  it("computes absolute and percentage margin", () => {
    const r = getMargin(20, 50);
    expect(r.margin).toBe(30);
    expect(r.percentage).toBe(60); // 30/50 = 60%
  });

  it("returns 0 percentage when salePrice is 0 (avoid div-by-zero)", () => {
    const r = getMargin(10, 0);
    expect(r.margin).toBe(-10);
    expect(r.percentage).toBe(0);
  });

  it("rounds to 2 decimals (BRL display format)", () => {
    const r = getMargin(33.333, 100);
    expect(r.margin).toBe(66.67);
    expect(r.percentage).toBe(66.67);
  });

  it("handles a negative margin (cost > sale)", () => {
    const r = getMargin(80, 50);
    expect(r.margin).toBe(-30);
    expect(r.percentage).toBe(-60);
  });
});

describe("getGoalReverse", () => {
  it("computes required sales given target income and avg margin %", () => {
    // 1000 / (50/100) = 2000
    const r = getGoalReverse(1000, 50);
    expect(r.requiredSales).toBe(2000);
  });

  it("returns 0 when avg margin is 0 (would be infinity otherwise)", () => {
    expect(getGoalReverse(1000, 0).requiredSales).toBe(0);
  });

  it("returns 0 when avg margin is negative (loss-making — target unreachable)", () => {
    expect(getGoalReverse(1000, -10).requiredSales).toBe(0);
  });
});

describe("getCAC", () => {
  it("forwards tenantId + clientId to the repo", async () => {
    const repo: FinanceRepository = {
      getDashboard: vi.fn(),
      getCAC: vi.fn().mockResolvedValue({
        totalMarketing: 100,
        totalClients: 5,
        clientSales: 0,
        cac: 20,
      }),
    };
    await getCAC("t1", "c1", repo);
    expect(repo.getCAC).toHaveBeenCalledWith("t1", "c1");
  });

  it("forwards undefined clientId for the global CAC view", async () => {
    const repo: FinanceRepository = {
      getDashboard: vi.fn(),
      getCAC: vi.fn().mockResolvedValue({ totalMarketing: 0, cac: 0 }),
    };
    await getCAC("t1", undefined, repo);
    expect(repo.getCAC).toHaveBeenCalledWith("t1", undefined);
  });
});
