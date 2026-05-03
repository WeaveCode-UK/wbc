// T2.10 — Static guard: every Prisma query in a tenant-scoped repository
// MUST include `tenantId` in its WHERE clause. The CLAUDE.md "regras
// inviolaveis" makes this a hard rule; we enforce it by parsing the
// repository files directly.
//
// Approach: regex over each `prisma.<model>.<op>({ ... })` call. We don't
// need a real TS parser — Prisma's call shape is regular enough that a
// scoped regex catches the misses without false positives, and the cost
// of a real parser (typescript-eslint or ts-morph) is not worth it for
// a guard that runs in CI on every commit.
//
// Allowlist: cross-tenant operations that are intentionally global —
// auth lookups by email/session, public webhook handlers, system tables
// like `processedEvent`. Each allowlist entry must carry a justification
// so reviewers know why it was added.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { describe, it, expect } from "vitest";

function walk(dir: string, accept: (p: string) => boolean): string[] {
  const out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) out.push(...walk(full, accept));
    else if (accept(full)) out.push(full);
  }
  return out;
}

// Operations that read or write data — every call to these must carry
// tenantId in the where clause when made from a tenant-scoped repo.
const TENANT_SENSITIVE_OPS = [
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "upsert",
  "aggregate",
  "groupBy",
  "count",
];

// Tables that are intentionally global (not partitioned by tenant) —
// e.g. system metadata, auth lookup, cross-tenant feed. Each entry
// must explain WHY.
const GLOBAL_MODELS = new Set([
  // Auth/user lookup happens by email/session before tenant context exists.
  "user",
  "account",
  "session",
  "verificationToken",
  // Outbox/processed-events are infra-level, scoped via tenantId column
  // when relevant but the table itself is global.
  "processedEvent",
  // Plans + brands are catalog-wide.
  "plan",
  "brand",
  // Reference template feed shared across tenants.
  "communityTemplate",
  // OutboxEvent / DLQ are infra-level. Each row carries tenantId in its
  // payload but is consumed by workers that operate on event id. The
  // tenant scope is enforced at the SUBSCRIBER, not the repo.
  "outboxEvent",
  "deadLetter",
  "dlqEntry",
]);

// Per-file allowlist for legitimate exceptions documented by the author.
// Format: `${relativePath}:${lineNumber}` — the exact file+line skipped.
// Adding to this list requires a comment in code AND a reason here.
const ALLOWED_LINE_EXCEPTIONS: ReadonlySet<string> = new Set([
  // Auth flows look up by email/token before tenant context — they're
  // gated by other constraints (token uniqueness, password hashing).
]);

interface Violation {
  file: string;
  line: number;
  snippet: string;
  model: string;
  op: string;
}

function findViolationsInFile(absPath: string, relPath: string): Violation[] {
  const src = readFileSync(absPath, "utf8");
  const lines = src.split("\n");
  const violations: Violation[] = [];

  // Strip block + line comments so a commented prisma.x.findMany doesn't
  // produce a false positive.
  const stripped = src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

  // Match prisma.<model>.<op>({ ... }) — capture model + op + first 400
  // chars of the args object (enough to spot tenantId).
  const callRe = /prisma\.(\w+)\.(\w+)\s*\(\s*(\{[\s\S]{0,800}?\})\s*[,)]/g;
  let match: RegExpExecArray | null;
  while ((match = callRe.exec(stripped)) !== null) {
    const [, model, op, args] = match;
    if (!TENANT_SENSITIVE_OPS.includes(op)) continue;
    if (GLOBAL_MODELS.has(model)) continue;
    // Heuristic: must mention `tenantId` somewhere inside the call args,
    // either as a key (`tenantId: …`), as a destructuring shorthand
    // (`{ id, tenantId }` / `{ tenantId }`), or as a relation traversal
    // (`sale: { tenantId }`). We don't try to detect the `where:`
    // clause specifically — false negatives there are rarer than false
    // positives here.
    if (/\btenantId\s*[:,}\s]/.test(args)) continue;

    // Compute 1-based line number of the match in the original text.
    const upto = src.slice(0, src.indexOf(match[0]));
    const line = upto.split("\n").length;
    if (ALLOWED_LINE_EXCEPTIONS.has(`${relPath}:${line}`)) continue;

    violations.push({
      file: relPath,
      line,
      snippet: lines[line - 1]?.trim() ?? "",
      model,
      op,
    });
  }
  return violations;
}

function findRepoFiles(): { absPath: string; relPath: string }[] {
  const root = resolve(__dirname, "../../../../..");
  const accept = (p: string): boolean => {
    if (!p.endsWith(".ts")) return false;
    if (/__tests__|\.test\.ts|\.d\.ts$|migrations\//.test(p)) return false;
    // Adapters that talk to Prisma directly.
    if (
      /\/packages\/business\/[^/]+\/adapters\/(prisma-|.*repository).*\.ts$/.test(
        p,
      )
    )
      return true;
    // Centralised db package — outbox, RLS helpers, middleware.
    if (/\/packages\/db\/src\//.test(p)) return true;
    return false;
  };
  return walk(root, accept).map((absPath) => ({
    absPath,
    relPath: absPath.replace(root + "/", ""),
  }));
}

describe("tenant isolation static guard", () => {
  const files = findRepoFiles();

  it("scans at least 30 repository files (sanity)", () => {
    expect(files.length).toBeGreaterThanOrEqual(30);
  });

  // Baseline mode: the project has pre-existing violations (legacy
  // adapters that rely on the tenantInjection middleware in
  // packages/db/src/middleware/tenant-injection.middleware.ts to inject
  // tenantId at runtime). Refactoring all of them is a larger task.
  // For now we capture the CURRENT count + signature in a snapshot so
  // any NEW violation breaks CI even before it's reviewed. To
  // legitimately reduce the count, fix the offender and update the
  // snapshot via `pnpm vitest -u packages/shared`.
  it("snapshot of known-violations — fails if a NEW violation appears", () => {
    const all: Violation[] = [];
    for (const { absPath, relPath } of files) {
      all.push(...findViolationsInFile(absPath, relPath));
    }
    // Stable serialisation: file + model + op + line, sorted.
    const fingerprints = all
      .map((v) => `${v.file}#${v.line} ${v.model}.${v.op}`)
      .sort();
    expect({ count: fingerprints.length, fingerprints }).toMatchSnapshot();
  });
});
