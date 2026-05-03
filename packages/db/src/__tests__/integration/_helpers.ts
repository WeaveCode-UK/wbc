// T5 — testcontainers helpers shared by the postgres integration suites.
//
// WHY: every test file is responsible for its own container lifecycle so
// failures in one file don't leak resources into the next. This module
// only exports tiny utilities (env gate, schema apply) so each file can
// keep its `beforeAll` short and explicit.

import { execSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

// WHY: opt-in. The default `pnpm test` run on a developer laptop without
// Docker should not block on a 30s pull. CI sets `CI=true`, and the
// `pnpm test:integration` script sets `RUN_INTEGRATION=1`.
export const SHOULD_RUN_INTEGRATION =
  process.env.CI === "true" ||
  process.env.CI === "1" ||
  process.env.RUN_INTEGRATION === "1";

// WHY: the project's `0_baseline` migration is empty (it represents the
// pre-migrate-era state assumed to exist via `prisma db push`). On a
// fresh container we therefore use `prisma db push --skip-generate` to
// materialise the full schema in one shot, then replay only the
// post-baseline SQL files that add behaviour (RLS policies, audit-log
// trigger) on top of the schema. Pure-DDL migrations are skipped because
// `db push` already realises their structural effect.
export function applyMigrations(databaseUrl: string): void {
  const dbPackageRoot = path.resolve(__dirname, "../../..");
  const env = { ...process.env, DATABASE_URL: databaseUrl };

  // 1. Schema from schema.prisma — produces every table, enum, column
  //    and unique/index that the Prisma client knows about.
  execSync("pnpm exec prisma db push --skip-generate --accept-data-loss", {
    cwd: dbPackageRoot,
    env,
    stdio: "pipe",
  });

  // 2. Replay the migrations that install RLS policies and append-only
  //    triggers. These are the tests' actual subject — `db push` only
  //    realises the schema, not the policies/triggers attached to it.
  const migrationsDir = path.join(dbPackageRoot, "prisma", "migrations");
  const dirs = readdirSync(migrationsDir, { withFileTypes: true })
    .filter(
      (d) => d.isDirectory() && d.name !== "manual" && d.name !== "0_baseline",
    )
    .map((d) => d.name)
    .sort();

  const SQL_TO_REPLAY = new Set<string>([
    "20260421000005_rls_policies",
    "20260427100000_rls_coverage_complement",
    "20260427105000_audit_log_append_only",
  ]);

  for (const dir of dirs) {
    if (!SQL_TO_REPLAY.has(dir)) continue;
    const sqlPath = path.join(migrationsDir, dir, "migration.sql");
    // WHY: `prisma db execute --file` ships with the prisma CLI, so we
    // don't need a local `psql` install. `--schema` makes prisma read
    // the datasource block, but we want the container URL — pass `--url`
    // explicitly so the file is sent to the *test* DB, not whatever
    // DATABASE_URL points at.
    execSync(
      `pnpm exec prisma db execute --file "${sqlPath}" --url "${databaseUrl}"`,
      { cwd: dbPackageRoot, env, stdio: "pipe" },
    );
  }
  // WHY: silence the "unused" warning when the loop happens to skip
  // every entry; readFileSync stays available for future expansions.
  void readFileSync;
}
