import { describe, it, expect } from "vitest";
import {
  computeItemSubtotal,
  computeSaleSubtotal,
  computeSaleTotal,
  CASHBACK_PERCENTAGE,
  CASHBACK_EXPIRY_DAYS,
  type SaleItemInput,
} from "../value-objects";

// Sales pricing primitives. ADR-001/ACH-005: these live in domain/ and
// adapters must NEVER recompute them — so the invariants here are the
// authoritative ones.

describe("CASHBACK constants", () => {
  it("locks the cashback percentage at 5% (business rule)", () => {
    expect(CASHBACK_PERCENTAGE).toBe(0.05);
  });

  it("locks the cashback expiry at 90 days", () => {
    expect(CASHBACK_EXPIRY_DAYS).toBe(90);
  });
});

describe("computeItemSubtotal", () => {
  it("multiplies quantity by unit price", () => {
    expect(computeItemSubtotal(3, 10)).toBe(30);
  });

  it("returns 0 when quantity is zero", () => {
    expect(computeItemSubtotal(0, 50)).toBe(0);
  });

  it("returns 0 when price is zero", () => {
    expect(computeItemSubtotal(5, 0)).toBe(0);
  });

  it("supports decimals (currency cents-as-decimal)", () => {
    expect(computeItemSubtotal(2, 1.5)).toBe(3);
  });
});

describe("computeSaleSubtotal", () => {
  it("returns 0 for an empty cart", () => {
    expect(computeSaleSubtotal([])).toBe(0);
  });

  it("sums per-item subtotals", () => {
    const items: SaleItemInput[] = [
      { quantity: 2, unitPrice: 50 },
      { quantity: 1, unitPrice: 30 },
      { quantity: 4, unitPrice: 5 },
    ];
    expect(computeSaleSubtotal(items)).toBe(150);
  });

  it("ignores zero-priced items without breaking the sum", () => {
    const items: SaleItemInput[] = [
      { quantity: 1, unitPrice: 100 },
      { quantity: 3, unitPrice: 0 },
    ];
    expect(computeSaleSubtotal(items)).toBe(100);
  });
});

describe("computeSaleTotal", () => {
  it("subtracts discount and cashback from subtotal", () => {
    expect(computeSaleTotal(100, 10, 5)).toBe(85);
  });

  it("defaults discount and cashback to zero", () => {
    expect(computeSaleTotal(100)).toBe(100);
  });

  // Domain invariant: total cannot be negative — discount + cashback
  // exceeding subtotal should zero the total, not generate a debit.
  it("never returns negative when discount + cashback exceed subtotal", () => {
    expect(computeSaleTotal(50, 30, 30)).toBe(0);
    expect(computeSaleTotal(0, 100, 100)).toBe(0);
  });

  it("only discount is supported", () => {
    expect(computeSaleTotal(200, 50)).toBe(150);
  });

  it("only cashback is supported", () => {
    expect(computeSaleTotal(200, 0, 25)).toBe(175);
  });
});
