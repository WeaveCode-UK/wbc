import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { calculateSaleTotal, calculateCashback } from "../entities";
import {
  computeCashbackAllocation,
  computeAvailableCashback,
} from "../cashback";
import { CASHBACK_PERCENTAGE } from "../value-objects";

// T1.8 — Property-based testing for money math.
// "If it breaks, lawsuit." Critical invariants checked across thousands
// of randomized inputs via fast-check.

const money = (): fc.Arbitrary<number> =>
  fc
    .double({
      min: 0,
      max: 1_000_000,
      noNaN: true,
      noDefaultInfinity: true,
    })
    // Truncate to 2 decimals to match BRL granularity.
    .map((n) => Math.round(n * 100) / 100);

const saleItem = (): fc.Arbitrary<{ quantity: number; unitPrice: number }> =>
  fc.record({
    quantity: fc.integer({ min: 0, max: 1000 }),
    unitPrice: money(),
  });

describe("calculateSaleTotal — property invariants", () => {
  it("is always >= 0 for any items, discount, cashbackUsed", () => {
    fc.assert(
      fc.property(
        fc.array(saleItem(), { maxLength: 50 }),
        money(),
        money(),
        (items, discount, cashbackUsed) => {
          const total = calculateSaleTotal(items, discount, cashbackUsed);
          return total >= 0;
        },
      ),
    );
  });

  it("equals subtotal - discount - cashback when discount+cashback <= subtotal", () => {
    fc.assert(
      fc.property(
        fc.array(saleItem(), { minLength: 1, maxLength: 50 }),
        fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true }),
        (items, discountFraction, cashbackFraction) => {
          const subtotal = items.reduce(
            (sum, i) => sum + i.quantity * i.unitPrice,
            0,
          );
          // Split subtotal between discount and cashback (each 0..50%).
          const discount = subtotal * discountFraction * 0.5;
          const cashbackUsed = subtotal * cashbackFraction * 0.5;
          const total = calculateSaleTotal(items, discount, cashbackUsed);
          // Allow tiny floating-point slack.
          const expected = subtotal - discount - cashbackUsed;
          return Math.abs(total - expected) < 1e-6;
        },
      ),
    );
  });

  it("zero items always yields zero (regardless of discount/cashback)", () => {
    fc.assert(
      fc.property(money(), money(), (discount, cashbackUsed) => {
        return calculateSaleTotal([], discount, cashbackUsed) === 0;
      }),
    );
  });

  it("monotonic in discount: more discount never increases total", () => {
    fc.assert(
      fc.property(
        fc.array(saleItem(), { maxLength: 20 }),
        money(),
        money(),
        money(),
        (items, baseDiscount, extra, cashbackUsed) => {
          const a = calculateSaleTotal(items, baseDiscount, cashbackUsed);
          const b = calculateSaleTotal(
            items,
            baseDiscount + extra,
            cashbackUsed,
          );
          return b <= a + 1e-6;
        },
      ),
    );
  });
});

describe("computeCashbackAllocation — property invariants", () => {
  it("is always in [0, max(0, min(available, remaining))]", () => {
    fc.assert(
      fc.property(
        fc.double({
          min: -1_000_000,
          max: 1_000_000,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        fc.double({
          min: -1_000_000,
          max: 1_000_000,
          noNaN: true,
          noDefaultInfinity: true,
        }),
        (available, remaining) => {
          const result = computeCashbackAllocation(available, remaining);
          if (result < 0) return false;
          if (available > 0 && result > available + 1e-9) return false;
          if (remaining > 0 && result > remaining + 1e-9) return false;
          return true;
        },
      ),
    );
  });

  it("never exceeds available", () => {
    fc.assert(
      fc.property(money(), money(), (available, remaining) => {
        return computeCashbackAllocation(available, remaining) <= available;
      }),
    );
  });

  it("never exceeds remaining", () => {
    fc.assert(
      fc.property(money(), money(), (available, remaining) => {
        return computeCashbackAllocation(available, remaining) <= remaining;
      }),
    );
  });

  it("returns 0 when either input is non-positive", () => {
    fc.assert(
      fc.property(money(), (positive) => {
        return (
          computeCashbackAllocation(0, positive) === 0 &&
          computeCashbackAllocation(positive, 0) === 0 &&
          computeCashbackAllocation(-positive, positive) === 0 &&
          computeCashbackAllocation(positive, -positive) === 0
        );
      }),
    );
  });
});

describe("computeAvailableCashback — property invariants", () => {
  it("is always >= 0 when each record has usedAmount <= amount", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc
            .record({ amount: money(), used: money() })
            .map(({ amount, used }) => ({
              amount,
              usedAmount: Math.min(used, amount),
              expiresAt: new Date(),
            })),
          { maxLength: 50 },
        ),
        (records) => {
          return computeAvailableCashback(records) >= -1e-6;
        },
      ),
    );
  });
});

describe("calculateCashback — rounding consistency", () => {
  it("rounds to 2 decimals", () => {
    fc.assert(
      fc.property(money(), (total) => {
        const cashback = calculateCashback(total);
        // Result must be representable with 2 decimal places.
        const cents = Math.round(cashback * 100);
        return Math.abs(cashback - cents / 100) < 1e-9;
      }),
    );
  });

  it("never exceeds total * CASHBACK_PERCENTAGE + rounding slack", () => {
    fc.assert(
      fc.property(money(), (total) => {
        const cashback = calculateCashback(total);
        // Up to half-cent rounding up.
        return cashback <= total * CASHBACK_PERCENTAGE + 0.005 + 1e-9;
      }),
    );
  });

  it("zero total yields zero cashback", () => {
    expect(calculateCashback(0)).toBe(0);
  });
});
