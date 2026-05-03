import { describe, expect, it } from "vitest";
import { buildPixBrCode } from "../pix-brcode";

// F11 follow-up: BR Code is a strict standard — a single character
// off and bank apps reject the QR. These tests pin the public shape
// (TLV layout, CRC suffix, ASCII fold, length caps) so a refactor
// can't silently regress.

describe("buildPixBrCode", () => {
  it("starts with the BACEN payload format indicator and ends with a 4-digit CRC", () => {
    const code = buildPixBrCode({
      pixKey: "12345678900",
      merchantName: "Renata Cosmeticos",
      merchantCity: "Sao Paulo",
      amount: 100,
    });
    expect(code.startsWith("000201")).toBe(true);
    expect(code.slice(-8, -4)).toBe("6304");
    expect(/^[0-9A-F]{4}$/.test(code.slice(-4))).toBe(true);
  });

  it("encodes the amount with two decimal places", () => {
    const code = buildPixBrCode({
      pixKey: "12345678900",
      merchantName: "X",
      merchantCity: "Y",
      amount: 12.5,
    });
    // 5404 = id 54, length 04 → "12.50"
    expect(code).toContain("540512.50");
  });

  it("folds accents to ASCII and clamps merchant name to 25 chars", () => {
    const code = buildPixBrCode({
      pixKey: "12345678900",
      merchantName: "Renata Cosméticos & Beleza Premium SP",
      merchantCity: "São Paulo",
      amount: 50,
    });
    // ID 59 carries the merchant name. Locate the chunk and verify
    // it's ASCII-only and ≤25 characters of payload.
    const idx = code.indexOf("59");
    const len = Number(code.slice(idx + 2, idx + 4));
    expect(len).toBeLessThanOrEqual(25);
    const value = code.slice(idx + 4, idx + 4 + len);
    expect(/^[\x20-\x7E]+$/.test(value)).toBe(true);
    expect(value).not.toMatch(/[áàãéêíóõúç]/i);
  });

  it("uses '***' as the default txid when none is supplied", () => {
    const code = buildPixBrCode({
      pixKey: "12345678900",
      merchantName: "X",
      merchantCity: "Y",
      amount: 1,
    });
    // 62 wraps the additional data; 05 wraps the txid. The merchant
    // bank app reads "***" as a free-form transaction id.
    expect(code).toContain("0503***");
  });

  it("respects an explicit txid (truncated to 25 chars)", () => {
    const code = buildPixBrCode({
      pixKey: "12345678900",
      merchantName: "X",
      merchantCity: "Y",
      amount: 1,
      txid: "WBC0123456789012345678901234567890",
    });
    expect(code).toMatch(/0525WBC[0-9]{22}/);
  });
});
