import { describe, it, expect } from "vitest";
import {
  computeAvailableCashback,
  computeCashbackAllocation,
  daysUntilExpiry,
  isCashbackExpiringSoon,
  CASHBACK_EXPIRING_SOON_DAYS,
  type CashbackRecord,
} from "../cashback";

// T1.3 — Cashback domain invariants.
// Source: packages/business/sales/domain/cashback.ts.

const oneDayMs = 1000 * 60 * 60 * 24;

describe("computeAvailableCashback", () => {
  it("returns 0 for empty list", () => {
    expect(computeAvailableCashback([])).toBe(0);
  });

  it("sums (amount - usedAmount) across records", () => {
    const records: CashbackRecord[] = [
      { amount: 100, usedAmount: 25, expiresAt: new Date() },
      { amount: 50, usedAmount: 0, expiresAt: new Date() },
      { amount: 30, usedAmount: 30, expiresAt: new Date() },
    ];
    expect(computeAvailableCashback(records)).toBe(125); // 75 + 50 + 0
  });

  it("supports Decimal-like values via toString()", () => {
    const decimal = (n: number): { toString(): string } => ({
      toString: () => String(n),
    });
    const records: CashbackRecord[] = [
      {
        amount: decimal(20.5),
        usedAmount: decimal(0.5),
        expiresAt: new Date(),
      },
    ];
    expect(computeAvailableCashback(records)).toBe(20);
  });
});

describe("daysUntilExpiry", () => {
  it("returns 0 when expiry is exactly now", () => {
    const now = new Date("2026-05-03T12:00:00Z");
    expect(daysUntilExpiry(now, now)).toBe(0);
  });

  it("rounds up partial days (cashback usable until end of last day)", () => {
    const now = new Date("2026-05-03T12:00:00Z");
    const expiresAt = new Date(now.getTime() + oneDayMs * 2.4);
    expect(daysUntilExpiry(expiresAt, now)).toBe(3);
  });

  it("returns whole days for round multiples", () => {
    const now = new Date("2026-05-03T00:00:00Z");
    const expiresAt = new Date(now.getTime() + oneDayMs * 7);
    expect(daysUntilExpiry(expiresAt, now)).toBe(7);
  });

  it("returns negative for already-expired cashback", () => {
    const now = new Date("2026-05-03T00:00:00Z");
    const expiresAt = new Date(now.getTime() - oneDayMs * 2);
    expect(daysUntilExpiry(expiresAt, now)).toBe(-2);
  });
});

describe("isCashbackExpiringSoon", () => {
  it("flags as expiring when within default 30-day threshold", () => {
    const now = new Date("2026-05-03T00:00:00Z");
    const expiresAt = new Date(now.getTime() + oneDayMs * 10);
    expect(isCashbackExpiringSoon(expiresAt, undefined, now)).toBe(true);
  });

  it("does NOT flag when beyond default threshold", () => {
    const now = new Date("2026-05-03T00:00:00Z");
    const expiresAt = new Date(
      now.getTime() + oneDayMs * (CASHBACK_EXPIRING_SOON_DAYS + 5),
    );
    expect(isCashbackExpiringSoon(expiresAt, undefined, now)).toBe(false);
  });

  it("flags exactly at threshold boundary (<=)", () => {
    const now = new Date("2026-05-03T00:00:00Z");
    const expiresAt = new Date(
      now.getTime() + oneDayMs * CASHBACK_EXPIRING_SOON_DAYS,
    );
    expect(isCashbackExpiringSoon(expiresAt, undefined, now)).toBe(true);
  });

  it("custom threshold respected", () => {
    const now = new Date("2026-05-03T00:00:00Z");
    const expiresAt = new Date(now.getTime() + oneDayMs * 6);
    expect(isCashbackExpiringSoon(expiresAt, 5, now)).toBe(false);
    expect(isCashbackExpiringSoon(expiresAt, 7, now)).toBe(true);
  });

  it("flags expired cashbacks (negative days)", () => {
    const now = new Date("2026-05-03T00:00:00Z");
    const expiresAt = new Date(now.getTime() - oneDayMs);
    expect(isCashbackExpiringSoon(expiresAt, undefined, now)).toBe(true);
  });
});

describe("computeCashbackAllocation", () => {
  it("returns min(available, remaining)", () => {
    expect(computeCashbackAllocation(100, 50)).toBe(50);
    expect(computeCashbackAllocation(50, 100)).toBe(50);
    expect(computeCashbackAllocation(100, 100)).toBe(100);
  });

  it("never returns negative when remaining is negative", () => {
    expect(computeCashbackAllocation(100, -10)).toBe(0);
  });

  it("never returns negative when available is negative", () => {
    expect(computeCashbackAllocation(-50, 100)).toBe(0);
  });

  it("returns 0 when both are zero", () => {
    expect(computeCashbackAllocation(0, 0)).toBe(0);
  });
});

describe("FIFO consumption (oldest-first reducer)", () => {
  // Domain rule: cashbacks must be consumed oldest-first (FIFO).
  // We verify by sorting by createdAt ASC and applying allocations in order.
  type Lot = { createdAt: Date; available: number };

  function consumeFifo(
    lots: readonly Lot[],
    needed: number,
  ): {
    consumed: ReadonlyArray<{ from: Date; amount: number }>;
    remaining: number;
  } {
    const sorted = [...lots].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    let remaining = needed;
    const consumed: Array<{ from: Date; amount: number }> = [];
    for (const lot of sorted) {
      if (remaining <= 0) break;
      const take = computeCashbackAllocation(lot.available, remaining);
      if (take > 0) {
        consumed.push({ from: lot.createdAt, amount: take });
        remaining -= take;
      }
    }
    return { consumed, remaining };
  }

  it("consumes the oldest lot first", () => {
    const lots: Lot[] = [
      { createdAt: new Date("2026-03-01"), available: 30 },
      { createdAt: new Date("2026-01-01"), available: 50 }, // oldest
      { createdAt: new Date("2026-02-01"), available: 20 },
    ];
    const { consumed, remaining } = consumeFifo(lots, 60);
    expect(remaining).toBe(0);
    expect(consumed).toEqual([
      { from: new Date("2026-01-01"), amount: 50 },
      { from: new Date("2026-02-01"), amount: 10 },
    ]);
  });

  it("returns positive remaining when total available is insufficient", () => {
    const lots: Lot[] = [{ createdAt: new Date("2026-01-01"), available: 10 }];
    const { remaining } = consumeFifo(lots, 100);
    expect(remaining).toBe(90);
  });

  it("never consumes more than needed even with abundant supply", () => {
    const lots: Lot[] = [
      { createdAt: new Date("2026-01-01"), available: 1000 },
    ];
    const { consumed, remaining } = consumeFifo(lots, 25);
    expect(remaining).toBe(0);
    expect(consumed).toEqual([{ from: new Date("2026-01-01"), amount: 25 }]);
  });
});
