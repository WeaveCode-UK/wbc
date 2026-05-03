import { describe, it, expect } from "vitest";
import { calculateClassification } from "../entities";
import { validatePhone, formatPhoneE164 } from "../value-objects";

// T1.2 — Client classification A/B/C thresholds + phone E164 edge cases.
// Rules from packages/business/clients/domain/entities.ts:
//   A: totalPurchases >= 5 AND totalSpent >= 500
//   B: totalPurchases >= 2 AND totalSpent >= 100 (and not A)
//   C: otherwise

describe("calculateClassification — A threshold boundaries", () => {
  it("exactly at A boundary -> A", () => {
    expect(calculateClassification(5, 500)).toBe("A");
  });

  it("just below A purchases boundary falls to B", () => {
    // 4 purchases, spent enough -> B (since >=2 && >=100)
    expect(calculateClassification(4, 500)).toBe("B");
  });

  it("just below A spent boundary falls to B", () => {
    expect(calculateClassification(5, 499)).toBe("B");
  });

  it("very high values -> A", () => {
    expect(calculateClassification(100, 100000)).toBe("A");
  });
});

describe("calculateClassification — B threshold boundaries", () => {
  it("exactly at B boundary -> B", () => {
    expect(calculateClassification(2, 100)).toBe("B");
  });

  it("just below B purchases -> C", () => {
    expect(calculateClassification(1, 100)).toBe("C");
  });

  it("just below B spent -> C", () => {
    expect(calculateClassification(2, 99)).toBe("C");
  });
});

describe("calculateClassification — C fallback", () => {
  it("zero purchases zero spent -> C", () => {
    expect(calculateClassification(0, 0)).toBe("C");
  });

  it("one purchase below B threshold -> C", () => {
    expect(calculateClassification(1, 50)).toBe("C");
  });

  it("many small purchases below spent threshold -> C", () => {
    // many purchases but total spent very low
    expect(calculateClassification(10, 99)).toBe("C");
  });
});

describe("validatePhone — edge cases (E164 invariants)", () => {
  it("rejects too-short numbers (less than 2 digits after country code)", () => {
    // E164 minimum is 2 digits per regex: ^\+?[1-9]\d{1,14}$
    expect(validatePhone("+1")).toBe(false);
  });

  it("accepts minimum valid length (2 digits)", () => {
    expect(validatePhone("+12")).toBe(true);
  });

  it("rejects above maximum 15 digits", () => {
    expect(validatePhone("+1234567890123456")).toBe(false); // 16 digits
  });

  it("accepts exactly 15 digits (E164 max)", () => {
    expect(validatePhone("+123456789012345")).toBe(true);
  });

  it("rejects whitespace inside number", () => {
    expect(validatePhone("+55 11 99999")).toBe(false);
  });

  it("rejects parentheses and dashes", () => {
    expect(validatePhone("+55(11)99999-9999")).toBe(false);
  });

  it("accepts US country code (1)", () => {
    expect(validatePhone("+15555555555")).toBe(true);
  });

  it("accepts UK country code (44)", () => {
    expect(validatePhone("+447911123456")).toBe(true);
  });
});

describe("formatPhoneE164 — country code variations", () => {
  it("preserves a non-BR international number with raw + prefix", () => {
    // 12 digits not starting with 55 should not gain +55. The current impl
    // adds + and returns digits; document the actual behaviour.
    expect(formatPhoneE164("+447911123456")).toBe("+447911123456");
  });

  it("strips formatting characters before applying logic", () => {
    expect(formatPhoneE164("+55 (11) 9 9999-9999")).toBe("+5511999999999");
  });

  it("handles short input (under 10 digits) without crashing", () => {
    // Under 10 digits doesn't match the BR auto-prefix branches; falls through
    // to the bare `+${cleaned}` branch.
    expect(formatPhoneE164("12345")).toBe("+12345");
  });

  it("empty input returns just '+'", () => {
    expect(formatPhoneE164("")).toBe("+");
  });
});
