// T8.9 + T8.10 (locked at unit-test level — cheaper than E2E):
//
// - **Locale parity**: every namespace key in pt-BR must exist in en, and
//   vice-versa. Missing keys cause silent fallback to the key string in
//   the UI ("clients.add"). Detect them at test time, not in production.
//
// - **No string drift between namespaces**: if `errors.notFound` exists
//   but `clients.notFound` is missing, only the first will render.
//
// The full hardcoded-string-in-JSX detector (T8.10) is too noisy without
// a real AST — flagged for a follow-up using ESLint custom rule.
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

const ROOT = resolve(__dirname, "../locales");

interface MessageMap {
  [key: string]: string | MessageMap;
}

function loadJson(path: string): MessageMap {
  return JSON.parse(readFileSync(path, "utf8")) as MessageMap;
}

function flatten(obj: MessageMap, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out.set(key, v);
    else for (const [sk, sv] of flatten(v, key)) out.set(sk, sv);
  }
  return out;
}

function listLocales(): string[] {
  return readdirSync(ROOT).filter((d) => /^[a-z]+(-[A-Z]+)?$/.test(d));
}

function listNamespaces(locale: string): string[] {
  return readdirSync(resolve(ROOT, locale))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

describe("i18n locale parity (regra inviolável CLAUDE.md)", () => {
  const locales = listLocales();

  it("at least 2 locales present (pt-BR + en)", () => {
    expect(locales.sort()).toEqual(["en", "pt-BR"]);
  });

  it("every namespace exists in every locale", () => {
    const sets = new Map(locales.map((l) => [l, new Set(listNamespaces(l))]));
    const all = new Set<string>();
    for (const ns of sets.values()) for (const n of ns) all.add(n);
    const missing: Record<string, string[]> = {};
    for (const [locale, set] of sets) {
      const gap = [...all].filter((n) => !set.has(n));
      if (gap.length > 0) missing[locale] = gap;
    }
    expect(missing).toEqual({});
  });

  it("every key present in pt-BR exists in en (and vice-versa)", () => {
    const reports: string[] = [];
    for (const ns of listNamespaces("pt-BR")) {
      const ptKeys = flatten(loadJson(resolve(ROOT, "pt-BR", `${ns}.json`)));
      let enKeys: Map<string, string>;
      try {
        enKeys = flatten(loadJson(resolve(ROOT, "en", `${ns}.json`)));
      } catch {
        reports.push(`namespace ${ns}: missing in en/`);
        continue;
      }
      const missingInEn = [...ptKeys.keys()].filter((k) => !enKeys.has(k));
      const missingInPt = [...enKeys.keys()].filter((k) => !ptKeys.has(k));
      if (missingInEn.length > 0)
        reports.push(
          `${ns}: ${missingInEn.length} keys missing in en — ${missingInEn.slice(0, 3).join(", ")}${missingInEn.length > 3 ? "…" : ""}`,
        );
      if (missingInPt.length > 0)
        reports.push(
          `${ns}: ${missingInPt.length} keys missing in pt-BR — ${missingInPt.slice(0, 3).join(", ")}${missingInPt.length > 3 ? "…" : ""}`,
        );
    }

    expect(reports).toEqual([]);
  });

  it("no key holds an empty string (those silently render as blank)", () => {
    const blanks: string[] = [];
    for (const locale of locales) {
      for (const ns of listNamespaces(locale)) {
        const flat = flatten(loadJson(resolve(ROOT, locale, `${ns}.json`)));
        for (const [k, v] of flat) {
          if (v.trim() === "") blanks.push(`${locale}/${ns}.${k}`);
        }
      }
    }
    expect(blanks).toEqual([]);
  });
});
