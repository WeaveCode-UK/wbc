// T2.20 — Edge/Node split for NextAuth config
//
// `apps/web/src/middleware.ts` runs in the Edge runtime, which can't
// bundle Node-only modules (ioredis, bcryptjs, otplib, node:crypto, …).
// `auth.config.edge.ts` exists ONLY to give middleware a config that is
// Edge-safe to import. If anyone accidentally adds a forbidden import to
// it, every request through middleware turns into a 500.
//
// We catch that drift here with a source-level scan: read both files,
// extract the `from "..."` specifiers, and assert the Edge config
// imports nothing from a known-Node-only set. The Node config is
// allowed to import everything; we just sanity-check it CAN import
// from `@wbc/business` (i.e. it's the place where Node-side wiring
// happens).
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// __dirname here = apps/web/src/lib/__tests__. Walk up one level
// to land on the source files under test.
const LIB_DIR = resolve(__dirname, "..");
const EDGE_CONFIG = resolve(LIB_DIR, "auth.config.edge.ts");
const NODE_CONFIG = resolve(LIB_DIR, "auth.config.ts");

/**
 * Pulls every static `import ... from "<spec>"` (and side-effect
 * `import "<spec>"`) specifier out of a TypeScript source string.
 * Good enough as a static contract scan — we don't need full AST
 * fidelity, only the specifier list.
 */
function importsFrom(source: string): string[] {
  const re = /import\s+(?:[^"'`]+?\s+from\s+)?["']([^"']+)["']/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    out.push(m[1]!);
  }
  return out;
}

const FORBIDDEN_PATTERNS: RegExp[] = [
  // Node crypto family.
  /^node:crypto$/,
  /^crypto$/,
  // Redis clients & helpers.
  /^ioredis$/,
  /^redis$/,
  // bcrypt / password hashers — pull in native bindings or large polyfills.
  /^bcrypt$/,
  /^bcryptjs$/,
  // otplib uses node:crypto under the hood.
  /^otplib$/,
  // @wbc/shared transitively imports node:crypto. Forbidden.
  /^@wbc\/shared(?:\/.*)?$/,
  // @wbc/db is the Prisma client — Node-only.
  /^@wbc\/db(?:\/.*)?$/,
  // @wbc/business pulls every adapter through index.ts; forbidden in edge.
  /^@wbc\/business(?:\/.*)?$/,
];

describe("apps/web auth Edge/Node split — source contract (T2.20)", () => {
  it("auth.config.edge.ts must not import any Node-only module", () => {
    const src = readFileSync(EDGE_CONFIG, "utf8");
    const specs = importsFrom(src);

    expect(specs.length).toBeGreaterThan(0); // sanity: file actually has imports

    const offenders = specs.filter((s) =>
      FORBIDDEN_PATTERNS.some((re) => re.test(s)),
    );

    // Custom message lists the offending specifiers — much easier to
    // debug than a bare "expected [] to equal []".
    expect(
      offenders,
      `Edge config imports forbidden Node-only module(s): ${offenders.join(", ")}`,
    ).toEqual([]);
  });

  it("auth.config.edge.ts must not import the Node config (no transitive leak)", () => {
    const src = readFileSync(EDGE_CONFIG, "utf8");
    const specs = importsFrom(src);
    // Re-importing the Node config from the Edge config would re-introduce
    // every banned dep transitively. Block both relative spellings.
    expect(specs).not.toContain("./auth.config");
    expect(specs).not.toContain("./auth.config.ts");
  });

  it("auth.config.edge.ts declares an empty providers list (Edge has no authorize)", () => {
    const src = readFileSync(EDGE_CONFIG, "utf8");
    // Whitespace-tolerant — covers `providers: []` and `providers : [ ]`.
    expect(src).toMatch(/providers\s*:\s*\[\s*\]/);
  });

  it("auth.config.edge.ts declares the JWT session strategy (cookie shape stays compatible)", () => {
    const src = readFileSync(EDGE_CONFIG, "utf8");
    expect(src).toMatch(/strategy\s*:\s*["']jwt["']/);
  });

  it("auth.config.ts (Node) DOES import @wbc/business (sanity — it's the wiring root)", () => {
    const src = readFileSync(NODE_CONFIG, "utf8");
    const specs = importsFrom(src);
    // Spread across multiple specific entries (`@wbc/business/auth/...`),
    // so we just need ANY match.
    const importsBusiness = specs.some((s) =>
      /^@wbc\/business(?:\/.*)?$/.test(s),
    );
    expect(importsBusiness).toBe(true);
  });

  it("auth.config.ts (Node) imports a Redis client — we want the difference to be load-bearing", () => {
    const src = readFileSync(NODE_CONFIG, "utf8");
    const specs = importsFrom(src);
    expect(specs.some((s) => s === "ioredis" || s === "redis")).toBe(true);
  });

  it("Edge and Node configs declare matching session-cookie names (cookie shape compat)", () => {
    const edgeSrc = readFileSync(EDGE_CONFIG, "utf8");
    const nodeSrc = readFileSync(NODE_CONFIG, "utf8");
    // The two configs MUST agree on the cookie name pattern, otherwise
    // the JWT signed by Node won't be found by middleware.
    expect(edgeSrc).toContain("__Secure-authjs.session-token");
    expect(edgeSrc).toContain("authjs.session-token");
    expect(nodeSrc).toContain("__Secure-authjs.session-token");
    expect(nodeSrc).toContain("authjs.session-token");
  });
});
