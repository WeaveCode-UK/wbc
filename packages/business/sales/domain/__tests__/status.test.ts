import { describe, it, expect } from "vitest";
import { isValidSaleTransition, SALE_STATUSES } from "../status";
import type { SaleStatus } from "../value-objects";
import { calculateSaleTotal } from "../entities";

// T1.1 — Sale status state machine.
// Source of truth: packages/business/sales/domain/status.ts
// DRAFT      -> CANCELLED
// CONFIRMED  -> SEPARATED, CANCELLED
// SEPARATED  -> SHIPPED, CANCELLED
// SHIPPED    -> DELIVERED, CANCELLED
// DELIVERED  -> (terminal)
// CANCELLED  -> (terminal)
const VALID_TRANSITIONS: ReadonlyArray<readonly [SaleStatus, SaleStatus]> = [
  ["DRAFT", "CANCELLED"],
  ["CONFIRMED", "SEPARATED"],
  ["CONFIRMED", "CANCELLED"],
  ["SEPARATED", "SHIPPED"],
  ["SEPARATED", "CANCELLED"],
  ["SHIPPED", "DELIVERED"],
  ["SHIPPED", "CANCELLED"],
];

const validKey = (from: SaleStatus, to: SaleStatus): boolean =>
  VALID_TRANSITIONS.some(([f, t]) => f === from && t === to);

describe("isValidSaleTransition — valid transitions", () => {
  for (const [from, to] of VALID_TRANSITIONS) {
    it(`accepts ${from} -> ${to}`, () => {
      expect(isValidSaleTransition(from, to)).toBe(true);
    });
  }
});

describe("isValidSaleTransition — exhaustive rejection of invalid pairs", () => {
  // Cartesian product of all status pairs minus the explicit valid set.
  for (const from of SALE_STATUSES) {
    for (const to of SALE_STATUSES) {
      if (validKey(from, to)) continue;
      it(`rejects ${from} -> ${to}`, () => {
        expect(isValidSaleTransition(from, to)).toBe(false);
      });
    }
  }
});

describe("isValidSaleTransition — terminal status invariants", () => {
  it("DELIVERED has no outgoing transitions", () => {
    for (const to of SALE_STATUSES) {
      expect(isValidSaleTransition("DELIVERED", to)).toBe(false);
    }
  });

  it("CANCELLED has no outgoing transitions", () => {
    for (const to of SALE_STATUSES) {
      expect(isValidSaleTransition("CANCELLED", to)).toBe(false);
    }
  });

  it("self-transitions are always invalid", () => {
    for (const s of SALE_STATUSES) {
      expect(isValidSaleTransition(s, s)).toBe(false);
    }
  });
});

describe("calculateSaleTotal — non-negative invariant", () => {
  it("clamps to zero under aggressive discount + cashback", () => {
    const items = [
      { quantity: 3, unitPrice: 50 }, // 150
      { quantity: 2, unitPrice: 25 }, // 50 -> subtotal 200
    ];
    expect(calculateSaleTotal(items, 9999, 9999)).toBe(0);
  });

  it("never returns negative even with empty items + positive discount", () => {
    expect(calculateSaleTotal([], 100, 50)).toBe(0);
  });

  it("never returns negative when cashback alone exceeds subtotal", () => {
    const items = [{ quantity: 1, unitPrice: 10 }];
    expect(calculateSaleTotal(items, 0, 1000)).toBe(0);
  });

  it("never returns negative when discount equals subtotal", () => {
    const items = [{ quantity: 4, unitPrice: 25 }]; // 100
    expect(calculateSaleTotal(items, 100, 0)).toBe(0);
  });
});
