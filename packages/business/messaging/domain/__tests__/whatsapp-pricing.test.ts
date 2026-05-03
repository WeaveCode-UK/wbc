import { describe, it, expect } from "vitest";
import {
  WHATSAPP_PRICING,
  priceForConversation,
  classifyCountryByPhone,
  type CountryCode,
} from "../whatsapp-pricing";

// ACH-003 custos-finops. Pricing table is hand-curated quarterly. We
// pin specific cells so accidental edits to the constant trip CI.

describe("WHATSAPP_PRICING table", () => {
  it("includes all known countries plus DEFAULT", () => {
    const expected: CountryCode[] = ["BR", "US", "UK", "DEFAULT"];
    for (const c of expected) {
      expect(WHATSAPP_PRICING[c]).toBeDefined();
    }
  });

  it("BR utility cost is the documented rate", () => {
    expect(WHATSAPP_PRICING.BR.utility).toBe(0.008);
  });

  it("service messages are always free at the table level", () => {
    // Table value is 0 for service across countries; the helper applies
    // the 24h-window override on top of this.
    expect(WHATSAPP_PRICING.BR.service).toBe(0);
    expect(WHATSAPP_PRICING.US.service).toBe(0);
    expect(WHATSAPP_PRICING.UK.service).toBe(0);
    expect(WHATSAPP_PRICING.DEFAULT.service).toBe(0);
  });

  it("DEFAULT mirrors the most expensive known country (UK) — conservative fallback", () => {
    expect(WHATSAPP_PRICING.DEFAULT.utility).toBe(WHATSAPP_PRICING.UK.utility);
    expect(WHATSAPP_PRICING.DEFAULT.marketing).toBe(
      WHATSAPP_PRICING.UK.marketing,
    );
    expect(WHATSAPP_PRICING.DEFAULT.authentication).toBe(
      WHATSAPP_PRICING.UK.authentication,
    );
  });
});

describe("priceForConversation", () => {
  it("returns 0 for service when conversation is already open (24h window)", () => {
    expect(priceForConversation("BR", "service", true)).toBe(0);
  });

  it("returns the table service price (0) when conversation is fresh", () => {
    expect(priceForConversation("BR", "service", false)).toBe(0);
  });

  it("returns BR utility price for BR + utility", () => {
    expect(priceForConversation("BR", "utility", false)).toBe(0.008);
  });

  it("returns BR marketing price for BR + marketing", () => {
    expect(priceForConversation("BR", "marketing", false)).toBe(0.04);
  });

  it("returns BR authentication price for BR + authentication", () => {
    expect(priceForConversation("BR", "authentication", false)).toBe(0.018);
  });

  it("returns US price for US country", () => {
    expect(priceForConversation("US", "marketing", false)).toBe(0.0225);
  });

  it("falls back to DEFAULT when country is missing in the table", () => {
    // Casting the unknown literal — we want to assert the fallback path
    // even if the type system would normally prevent the misuse.
    const unknown = "ZZ" as CountryCode;
    expect(priceForConversation(unknown, "utility", false)).toBe(
      WHATSAPP_PRICING.DEFAULT.utility,
    );
  });
});

describe("classifyCountryByPhone", () => {
  it("recognises Brazilian numbers (+55)", () => {
    expect(classifyCountryByPhone("+5511999999999")).toBe("BR");
  });

  it("recognises US numbers (+1)", () => {
    expect(classifyCountryByPhone("+14155551234")).toBe("US");
  });

  it("recognises UK numbers (+44)", () => {
    expect(classifyCountryByPhone("+447911123456")).toBe("UK");
  });

  it("falls back to DEFAULT for unknown country codes", () => {
    expect(classifyCountryByPhone("+33123456789")).toBe("DEFAULT");
  });

  it("falls back to DEFAULT for non-E164 input (defensive)", () => {
    expect(classifyCountryByPhone("11999999999")).toBe("DEFAULT");
  });
});
