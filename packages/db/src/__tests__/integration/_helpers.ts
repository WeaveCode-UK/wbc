// T5 — testcontainers helpers shared by the postgres integration suites.
//
// WHY: every test file is responsible for its own container lifecycle so
// failures in one file don't leak resources into the next. This module
// only exports tiny utilities (env gate, schema apply) so each file can
// keep its `beforeAll` short and explicit.

import { execSync } from "node:child_process";
import path from "node:path";

// WHY: opt-in. The default `pnpm test` run on a developer laptop without
// Docker should not block on a 30s pull. CI sets `CI=true`, and the
// `pnpm test:integration` script sets `RUN_INTEGRATION=1`.
export const SHOULD_RUN_INTEGRATION =
  process.env.CI === "true" ||
  process.env.CI === "1" ||
  process.env.RUN_INTEGRATION === "1";

// WHY: prisma's CLI is the only supported migrator. Spawn it with the
// container URL and let it handle replays, advisory locks, etc. The
// schema lives in `packages/db/prisma/schema.prisma`; we resolve the
// path from this file so the tests work regardless of the cwd.
export function applyMigrations(databaseUrl: string): void {
  const dbPackageRoot = path.resolve(__dirname, "../../..");
  execSync("pnpm exec prisma migrate deploy", {
    cwd: dbPackageRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "pipe",
  });
}
