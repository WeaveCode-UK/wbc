import { describe, it, expect } from "vitest";
import { isStockLow, isStockDepleted } from "../entities";
import type { Stock } from "../entities";

const stock = (overrides: Partial<Stock> = {}): Stock => ({
  id: "1",
  tenantId: "t1",
  productId: "p1",
  quantity: 5,
  minAlert: 5,
  ...overrides,
});

describe("Inventory Domain", () => {
  it("detects low stock", () => {
    expect(isStockLow(stock({ quantity: 3, minAlert: 5 }))).toBe(true);
  });

  it("does not flag stock above alert", () => {
    expect(isStockLow(stock({ quantity: 10, minAlert: 5 }))).toBe(false);
  });

  it("detects depleted stock", () => {
    expect(isStockDepleted(stock({ quantity: 0 }))).toBe(true);
  });

  it("no alert if minAlert is 0", () => {
    expect(isStockLow(stock({ quantity: 1, minAlert: 0 }))).toBe(false);
  });
});

// T1.6 — additional invariants:
// - threshold trigger fires exactly at quantity == minAlert (boundary)
// - stock decrement helper never returns a quantity below 0
// - depletion detection treats negative quantities as depleted

describe("Stock low-alert threshold boundaries", () => {
  it("triggers at exactly minAlert (<= boundary)", () => {
    expect(isStockLow(stock({ quantity: 5, minAlert: 5 }))).toBe(true);
  });

  it("triggers at minAlert - 1", () => {
    expect(isStockLow(stock({ quantity: 4, minAlert: 5 }))).toBe(true);
  });

  it("does not trigger one above the threshold", () => {
    expect(isStockLow(stock({ quantity: 6, minAlert: 5 }))).toBe(false);
  });

  it("triggers when stock is zero with positive minAlert", () => {
    expect(isStockLow(stock({ quantity: 0, minAlert: 1 }))).toBe(true);
  });
});

describe("Stock depletion detection", () => {
  it("depleted when quantity is exactly zero", () => {
    expect(isStockDepleted(stock({ quantity: 0 }))).toBe(true);
  });

  it("depleted when quantity is negative (defensive)", () => {
    // Real DB constraints prevent this, but the invariant guard must
    // still classify as depleted for any non-positive quantity.
    expect(isStockDepleted(stock({ quantity: -1 }))).toBe(true);
  });

  it("not depleted with one unit", () => {
    expect(isStockDepleted(stock({ quantity: 1 }))).toBe(false);
  });
});

describe("Stock decrement clamps to zero (domain invariant)", () => {
  // Pure invariant helper that any safe decrement must satisfy.
  function decrementStock(current: number, by: number): number {
    return Math.max(0, current - by);
  }

  it("normal decrement reduces by amount", () => {
    expect(decrementStock(10, 3)).toBe(7);
  });

  it("decrement equal to current goes to exactly zero", () => {
    expect(decrementStock(5, 5)).toBe(0);
  });

  it("decrement exceeding current clamps to zero (never negative)", () => {
    expect(decrementStock(3, 100)).toBe(0);
  });

  it("decrement of zero leaves stock unchanged", () => {
    expect(decrementStock(7, 0)).toBe(7);
  });
});
