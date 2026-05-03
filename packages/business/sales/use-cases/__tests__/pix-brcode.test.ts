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

  // Coverage extension: branches not exercised by the original suite —
  // description (subfield 02), empty merchantName/City fallbacks, CRC
  // stability and divergence on small input changes, merchantCity 15-char
  // clamp.

  it("includes description as PIX subfield 02 when supplied", () => {
    const code = buildPixBrCode({
      pixKey: "key@x.com",
      merchantName: "X",
      merchantCity: "Y",
      amount: 1,
      description: "Pedido 42",
    });
    expect(code).toContain("Pedido 42");
  });

  it("clamps a long description to 50 chars (BACEN cap)", () => {
    const longDesc = "X".repeat(80);
    const code = buildPixBrCode({
      pixKey: "k",
      merchantName: "X",
      merchantCity: "Y",
      amount: 1,
      description: longDesc,
    });
    // The original 80-char run must not survive — anything over 50 is a
    // BACEN-spec violation that bank apps will flag.
    expect(code).not.toContain("X".repeat(51));
  });

  it("falls back to RECEBEDOR / BRASIL when name and city are empty post-fold", () => {
    // ASCII-fold strips emoji-only inputs to ""; the fallback constants
    // anchor the payload so the QR isn't malformed.
    const code = buildPixBrCode({
      pixKey: "k",
      merchantName: "🎉🎉🎉",
      merchantCity: "🎉🎉🎉",
      amount: 1,
    });
    expect(code).toContain("RECEBEDOR");
    expect(code).toContain("BRASIL");
  });

  it("yields the same CRC suffix for identical inputs (deterministic)", () => {
    const a = buildPixBrCode({
      pixKey: "k",
      merchantName: "X",
      merchantCity: "Y",
      amount: 50.25,
      txid: "TX-1",
    });
    const b = buildPixBrCode({
      pixKey: "k",
      merchantName: "X",
      merchantCity: "Y",
      amount: 50.25,
      txid: "TX-1",
    });
    expect(a).toBe(b);
  });

  it("yields a different CRC when amount changes by one cent (no collision)", () => {
    const a = buildPixBrCode({
      pixKey: "k",
      merchantName: "X",
      merchantCity: "Y",
      amount: 50.0,
    });
    const b = buildPixBrCode({
      pixKey: "k",
      merchantName: "X",
      merchantCity: "Y",
      amount: 50.01,
    });
    expect(a).not.toBe(b);
    expect(a.slice(-4)).not.toBe(b.slice(-4));
  });

  it("preserves printable ASCII (CRC's input is the visible payload)", () => {
    const code = buildPixBrCode({
      pixKey: "k",
      merchantName: "Empresa Teste",
      merchantCity: "Sao Paulo",
      amount: 12.34,
    });
    // The whole payload (including CRC) must be 7-bit printable ASCII.
    expect(/^[\x20-\x7E]+$/.test(code)).toBe(true);
  });
});
