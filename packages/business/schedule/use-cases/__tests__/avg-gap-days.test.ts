import { describe, it, expect } from "vitest";
import { avgGapDays } from "../build-restock-reminders-per-product";

describe("avgGapDays — per-product restock cadence (item 13)", () => {
  it("returns 0 with fewer than 2 samples", () => {
    expect(avgGapDays([])).toBe(0);
    expect(avgGapDays([new Date("2026-01-01")])).toBe(0);
  });

  it("computes the mean gap in days between consecutive descending dates", () => {
    // Caller sorts desc — dates[0] is most recent.
    const dates = [
      new Date("2026-04-01"),
      new Date("2026-03-01"),
      new Date("2026-02-01"),
    ];
    // Gap1 = Apr-Mar = 31 days; Gap2 = Mar-Feb = 28 days; mean ≈ 29.5
    expect(avgGapDays(dates)).toBeCloseTo(29.5, 1);
  });

  it("handles a uniform 30-day cadence", () => {
    const ms30 = 30 * 24 * 60 * 60 * 1000;
    const base = new Date("2026-04-01").getTime();
    const dates = [
      new Date(base),
      new Date(base - ms30),
      new Date(base - 2 * ms30),
      new Date(base - 3 * ms30),
    ];
    expect(avgGapDays(dates)).toBe(30);
  });
});
