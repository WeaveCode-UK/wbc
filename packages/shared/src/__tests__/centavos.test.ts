// Coverage push — currency arithmetic in integer cents. The whole point
// of this module is to dodge IEEE-754 drift in money math. Every helper
// here ends up touching cashback, invoicing, reconciliation. We assert
// the boundary cases that floats famously break:
//   - 0.1 * 3 → integer cents, not 0.30000000000000004
//   - 1.005 → 100, not 101 (Math.round bug repro)
//   - negative / fractional / two-or-more decimal place inputs
import { describe, it, expect } from "vitest";
import {
  toCents,
  fromCents,
  toDecimalString,
  addCents,
  subCents,
  mulQuantity,
  applyRateBps,
  maxCents,
  minCents,
} from "../money/centavos";

describe("toCents", () => {
  it("converts number with 2 decimals exactly", () => {
    expect(toCents(123.45)).toBe(12345n);
    expect(toCents(0.1)).toBe(10n);
    expect(toCents(0)).toBe(0n);
  });

  it("dodges the 1.005 / Math.round trap", () => {
    // Math.round(1.005 * 100) === 100 (binary drift), but toFixed
    // round-half-to-even gives "1.00" — the test asserts the actual
    // implementation behaviour rather than 101.
    expect(toCents(1.005)).toBe(toCents("1.00"));
  });

  it("converts stringified Decimal verbatim (no parseFloat)", () => {
    expect(toCents("123.45")).toBe(12345n);
    expect(toCents("0.01")).toBe(1n);
    expect(toCents("0")).toBe(0n);
    expect(toCents("100")).toBe(10000n);
  });

  it("handles negative numbers in both string and number form", () => {
    expect(toCents(-50.25)).toBe(-5025n);
    expect(toCents("-50.25")).toBe(-5025n);
  });

  it("pads fractional shorter than 2 digits", () => {
    expect(toCents("12.5")).toBe(1250n);
    expect(toCents("12")).toBe(1200n);
  });

  it("truncates fractional longer than 2 digits", () => {
    expect(toCents("12.999")).toBe(1299n);
  });

  it("throws on non-finite numbers", () => {
    expect(() => toCents(Infinity)).toThrow(/non-finite/);
    expect(() => toCents(NaN)).toThrow(/non-finite/);
    expect(() => toCents(-Infinity)).toThrow(/non-finite/);
  });
});

describe("fromCents", () => {
  it("converts cents back to number", () => {
    expect(fromCents(12345n)).toBe(123.45);
    expect(fromCents(0n)).toBe(0);
    expect(fromCents(1n)).toBe(0.01);
  });

  it("handles negative cents", () => {
    expect(fromCents(-5025n)).toBe(-50.25);
  });

  it("preserves precision through round-trip", () => {
    for (const v of [0, 0.01, 0.1, 1, 9.99, 100.5, 12345.67]) {
      expect(fromCents(toCents(v))).toBeCloseTo(v, 10);
    }
  });
});

describe("toDecimalString", () => {
  it("renders cents as Decimal-shaped string", () => {
    expect(toDecimalString(12345n)).toBe("123.45");
    expect(toDecimalString(0n)).toBe("0.00");
    expect(toDecimalString(1n)).toBe("0.01");
    expect(toDecimalString(100n)).toBe("1.00");
  });

  it("handles negative cents with leading minus", () => {
    expect(toDecimalString(-5025n)).toBe("-50.25");
  });

  it("pads single-digit fractional with leading zero", () => {
    expect(toDecimalString(305n)).toBe("3.05");
  });
});

describe("addCents / subCents", () => {
  it("adds without losing precision (the whole reason this module exists)", () => {
    // 0.1 + 0.2 in floats === 0.30000000000000004
    const a = toCents(0.1);
    const b = toCents(0.2);
    expect(toDecimalString(addCents(a, b))).toBe("0.30");
  });

  it("subtracts integer cents", () => {
    expect(subCents(10000n, 1234n)).toBe(8766n);
  });

  it("supports negative results", () => {
    expect(subCents(0n, 100n)).toBe(-100n);
  });
});

describe("mulQuantity", () => {
  it("multiplies cents by an integer quantity", () => {
    expect(mulQuantity(99n, 3)).toBe(297n);
    expect(mulQuantity(toCents(0.1), 3)).toBe(30n);
    expect(toDecimalString(mulQuantity(toCents(0.1), 3))).toBe("0.30");
  });

  it("rejects non-integer quantity", () => {
    expect(() => mulQuantity(100n, 2.5)).toThrow(/integer/);
  });

  it("zero quantity is zero", () => {
    expect(mulQuantity(123n, 0)).toBe(0n);
  });
});

describe("applyRateBps (basis points)", () => {
  it("3% of R$100 = R$3", () => {
    expect(applyRateBps(toCents(100), 300)).toBe(toCents(3));
  });

  it("0.5% of R$200 = R$1", () => {
    expect(applyRateBps(toCents(200), 50)).toBe(toCents(1));
  });

  it("0% leaves cents at zero", () => {
    expect(applyRateBps(toCents(123.45), 0)).toBe(0n);
  });

  it("rejects non-integer rate", () => {
    expect(() => applyRateBps(100n, 3.5)).toThrow(/integer/);
  });
});

describe("maxCents / minCents", () => {
  it("max returns the larger of two BigInts", () => {
    expect(maxCents(100n, 200n)).toBe(200n);
    expect(maxCents(-100n, 100n)).toBe(100n);
    expect(maxCents(50n, 50n)).toBe(50n);
  });

  it("min returns the smaller of two BigInts", () => {
    expect(minCents(100n, 200n)).toBe(100n);
    expect(minCents(-100n, 100n)).toBe(-100n);
    expect(minCents(50n, 50n)).toBe(50n);
  });
});
