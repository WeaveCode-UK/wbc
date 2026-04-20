# Database Baseline (ACH-016 dados-persistencia)

## Current state

`packages/db/prisma/migrations/0_baseline/migration.sql` is empty.
The initial schema was materialised via `prisma db push` rather than
`migrate dev`, so there's no SQL history of how v1 tables were
created. A fresh deploy that runs `prisma migrate deploy` from scratch
builds `processed_events`, `cashback_redemptions`, etc. but no base
tables.

That's a theoretical DR risk: losing every schema-bearing environment
at the same time (all prod replicas + staging + every dev clone)
leaves no machine-readable recipe to rebuild v1 tables.

## What to do (follow-up)

Two viable paths:

### Option A — backfill the baseline

1. Start a clean Postgres.
2. `pnpm --filter @wbc/db prisma db push --schema=packages/db/prisma/schema.prisma`
3. `pg_dump --schema-only --no-owner --no-privileges` the result
   into `0_baseline/migration.sql`.
4. Verify `prisma migrate deploy` replays it cleanly on another
   empty cluster.
5. Update `_prisma_migrations` on existing clusters so the baseline
   appears applied:
   ```sql
   INSERT INTO _prisma_migrations (
     id, checksum, finished_at, migration_name,
     logs, rolled_back_at, started_at, applied_steps_count
   ) VALUES (
     gen_random_uuid(), '<checksum>', now(),
     '0_baseline', '', null, now(), 1
   );
   ```

This is the correct fix but needs careful coordination across every
env so none ends up running the baseline against a populated cluster.

### Option B — leave the baseline empty, rely on backups

Accept that schema reconstruction from zero requires a restore of the
most recent backup. The RPO/RTO section of
`docs/architecture/backup-and-recovery.md` already promises this.

## Decision (current)

Option B until the restore drill (ACH-018 follow-up) is running
monthly. After one clean drill cycle proves the backup path, option A
becomes optional — do it only if the team decides the extra safety
is worth the rollout coordination.

## Validation script (stub)

When option A lands, commit
`scripts/validate-baseline.mjs` that:

1. Spins up a throwaway Postgres.
2. Runs `prisma migrate deploy` (which replays `0_baseline` + every
   later migration).
3. Compares the resulting schema against `schema.prisma` via
   `prisma db pull` + diff.
4. Fails CI on any drift.

Until then, no script — we don't want CI to quietly depend on a file
that's still empty.
