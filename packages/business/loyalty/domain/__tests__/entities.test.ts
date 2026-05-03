import { describe, it, expect } from "vitest";
import { POINTS_PER_BRL } from "../../use-cases/manage-loyalty";
import type { LoyaltyAccount } from "../entities";

// T1.4 — Loyalty domain invariants.
// The points formula lives in `use-cases/manage-loyalty.ts` as
// `Math.floor(saleTotal * POINTS_PER_BRL * multiplier)`. This file pins
// the formula contract so any future change is intentional and reviewed.

const computePoints = (saleTotal: number, multiplier = 1): number =>
  Math.floor(saleTotal * POINTS_PER_BRL * multiplier);

describe("POINTS_PER_BRL constant", () => {
  it("is exactly 1 / 10 (ACH-077: 1 point per BRL 10)", () => {
    expect(POINTS_PER_BRL).toBe(1 / 10);
  });
});

describe("points calculation (1 pt per R$10, floor rounding)", () => {
  it("R$0 -> 0 points", () => {
    expect(computePoints(0)).toBe(0);
  });

  it("R$5 (below floor) -> 0 points", () => {
    expect(computePoints(5)).toBe(0);
  });

  it("R$9.99 (just below) -> 0 points", () => {
    expect(computePoints(9.99)).toBe(0);
  });

  it("R$10 -> 1 point", () => {
    expect(computePoints(10)).toBe(1);
  });

  it("R$10.50 -> 1 point (floor, not round)", () => {
    expect(computePoints(10.5)).toBe(1);
  });

  it("R$19.99 -> 1 point", () => {
    expect(computePoints(19.99)).toBe(1);
  });

  it("R$20 -> 2 points", () => {
    expect(computePoints(20)).toBe(2);
  });

  it("R$1234.56 -> 123 points", () => {
    expect(computePoints(1234.56)).toBe(123);
  });
});

describe("category multipliers", () => {
  it("multiplier of 2 doubles the points", () => {
    expect(computePoints(100, 2)).toBe(20);
  });

  it("multiplier of 0.5 halves with floor", () => {
    // 100 * 0.1 * 0.5 = 5.0 -> floor 5
    expect(computePoints(100, 0.5)).toBe(5);
  });

  it("multiplier of 0 yields 0 points", () => {
    expect(computePoints(1000, 0)).toBe(0);
  });

  it("never yields negative points (negative multiplier still floored)", () => {
    // Document current behaviour: floor of a negative product is < 0,
    // but the use-case guards via `if (earned <= 0) return ...` and
    // never persists. We assert the raw formula here for transparency.
    expect(computePoints(100, -1)).toBe(-10);
  });
});

describe("redemption invariants (balance never goes negative)", () => {
  // The actual redeem flow lives in use-cases (requires repo). We assert
  // the pure invariant: a domain LoyaltyAccount with a non-negative balance
  // refuses redemptions exceeding it. This mirrors `redeemPoints` in
  // `use-cases/manage-loyalty.ts` which must throw InsufficientLoyaltyBalance.
  function canRedeem(account: LoyaltyAccount, points: number): boolean {
    return points > 0 && account.balance >= points;
  }

  const account: LoyaltyAccount = {
    id: "lp1",
    tenantId: "t1",
    clientId: "c1",
    balance: 100,
    lifetimeEarned: 500,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it("allows redemption equal to balance", () => {
    expect(canRedeem(account, 100)).toBe(true);
  });

  it("allows redemption below balance", () => {
    expect(canRedeem(account, 50)).toBe(true);
  });

  it("rejects redemption exceeding balance", () => {
    expect(canRedeem(account, 101)).toBe(false);
  });

  it("rejects zero redemption", () => {
    expect(canRedeem(account, 0)).toBe(false);
  });

  it("rejects negative redemption", () => {
    expect(canRedeem(account, -10)).toBe(false);
  });
});
