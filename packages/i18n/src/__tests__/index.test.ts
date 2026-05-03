// Coverage push — i18n constants. Locks the public API surface that
// next-intl + the contract snapshot depend on. A silent change to the
// `locales` or `namespaces` arrays would silently de-route all UI
// strings of an entire feature.
import { describe, it, expect } from "vitest";
import { locales, defaultLocale, namespaces } from "../index";

describe("@wbc/i18n constants", () => {
  it("locales: exactly pt-BR and en, in this order", () => {
    expect([...locales]).toEqual(["pt-BR", "en"]);
  });

  it("defaultLocale is pt-BR (Brazilian primary market)", () => {
    expect(defaultLocale).toBe("pt-BR");
  });

  it("defaultLocale is one of the listed locales (no orphan)", () => {
    expect(locales.includes(defaultLocale)).toBe(true);
  });

  it("namespaces include every product feature module", () => {
    // The full set should match the dashboard top-level features. Adding
    // a new module without a translation namespace silently breaks i18n
    // for that feature.
    const expected = [
      "common",
      "auth",
      "clients",
      "sales",
      "campaigns",
      "messaging",
      "finance",
      "inventory",
      "schedule",
      "team",
      "analytics",
      "logistics",
      "landing",
      "platform",
      "ai",
      "errors",
      "catalog",
    ];
    expect([...namespaces].sort()).toEqual(expected.sort());
  });

  it("namespaces are unique (no duplicate)", () => {
    expect(new Set(namespaces).size).toBe(namespaces.length);
  });
});
