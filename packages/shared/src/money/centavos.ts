// ACH-006 performance-escalabilidade: monetary arithmetic in cents.
//
// The domain used to compute totals in `number` (IEEE 754):
//
//   computeSaleSubtotal([{ quantity: 3, unitPrice: 0.1 }]) → 0.30000000000000004
//
// Binary floats can't represent 0.1 exactly; rounding errors accumulate
// in invoicing and reconciliation. Fixing every use-case in one pass
// is a large refactor (touches discounts, cashback, analytics). This
// module gives the tooling — helpers that convert to integer cents,
// do arithmetic in `bigint`, and convert back on the boundary.
// Adopters migrate each computation one at a time.
//
// `Decimal` from Prisma stays the wire/storage type; centavos are the
// internal representation for *computations*.

const HUNDRED = 100n;

/**
 * Convert a currency value (either `number` or stringified `Decimal`)
 * to integer cents. Throws on non-finite numbers.
 */
export function toCents(value: number | string): bigint {
  if (typeof value === "string") {
    // Stringified Decimal: "123.45" → 12345n. No `parseFloat` — that
    // loses precision on the way through a binary float.
    const parts = value.split(".");
    const whole = parts[0] ?? "0";
    const frac = parts[1] ?? "";
    const wholePart = whole.replace(/^-/, "");
    const negative = whole.startsWith("-");
    const fracPadded = (frac + "00").slice(0, 2); // two decimal places
    const combined = BigInt(wholePart) * HUNDRED + BigInt(fracPadded || "0");
    return negative ? -combined : combined;
  }
  if (!Number.isFinite(value)) {
    throw new Error(`toCents: non-finite input ${value}`);
  }
  // Use `.toFixed(2)` then parse via the string path to dodge binary
  // float drift. Math.round(value * 100) fails for e.g. 1.005.
  return toCents(value.toFixed(2));
}

/** Convert integer cents back to a `number` with two decimal places. */
export function fromCents(cents: bigint): number {
  const sign = cents < 0n ? -1 : 1;
  const abs = cents < 0n ? -cents : cents;
  const whole = abs / HUNDRED;
  const frac = abs % HUNDRED;
  return sign * (Number(whole) + Number(frac) / 100);
}

/** Convert integer cents to the canonical string shape for Decimal. */
export function toDecimalString(cents: bigint): string {
  const sign = cents < 0n ? "-" : "";
  const abs = cents < 0n ? -cents : cents;
  const whole = abs / HUNDRED;
  const frac = abs % HUNDRED;
  return `${sign}${whole}.${frac.toString().padStart(2, "0")}`;
}

export function addCents(a: bigint, b: bigint): bigint {
  return a + b;
}

export function subCents(a: bigint, b: bigint): bigint {
  return a - b;
}

export function mulQuantity(cents: bigint, quantity: number): bigint {
  if (!Number.isInteger(quantity)) {
    throw new Error(`mulQuantity: quantity must be integer, got ${quantity}`);
  }
  return cents * BigInt(quantity);
}

/**
 * Apply a percentage rate (e.g. 3% cashback) to a cent value.
 * `rateBps` is in basis points (300 = 3.00%) to stay integer.
 * Rounding: banker's rounding via half-to-even on the last digit.
 */
export function applyRateBps(cents: bigint, rateBps: number): bigint {
  if (!Number.isInteger(rateBps)) {
    throw new Error(`applyRateBps: rateBps must be integer, got ${rateBps}`);
  }
  const num = cents * BigInt(rateBps);
  const denom = 10000n; // basis points → %
  // Floor division; for finer control callers can scale cents by 10 first.
  return num / denom;
}

export function maxCents(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}

export function minCents(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}
