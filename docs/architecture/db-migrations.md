# Database Migrations Workflow (ACH-015 dados-persistencia)

## Why

Before this, the project shipped two parallel migration pipelines:

1. Prisma migrations under `packages/db/prisma/migrations/` — applied
   by `prisma migrate deploy` in CI.
2. Hand-authored SQL under `packages/db/prisma/migrations/manual/` —
   applied manually with `psql` after every Prisma deploy.

Any environment where step 2 was skipped (staging that was never
refreshed, a developer's local DB set up via `db push`) silently
missed RLS policies and other hand-written concerns. No CI gate caught
that drift; it only surfaced as data-isolation bugs in production.

## The new workflow

`prisma migrate deploy` is the single source of truth. Every SQL
statement, including RLS policies, lives under
`packages/db/prisma/migrations/<timestamp>_<name>/migration.sql`.

- **Adding a schema change:** edit `schema.prisma`, run
  `prisma migrate dev --name <short_name>` locally, commit the
  generated migration folder along with `schema.prisma`.
- **Adding hand-SQL (e.g. new RLS policy, CHECK constraint, CREATE
  EXTENSION):** create an empty migration with
  `prisma migrate dev --create-only --name <name>`, write the SQL in
  the generated `migration.sql`, then run
  `prisma migrate deploy` on your local DB to apply it.
- **CI deploys:** the CI job runs `prisma migrate deploy` — nothing
  else. No more out-of-band `psql` invocations.

## The `manual/` folder

Now legacy / reference only:

- `001_rls_policies.sql` — migrated into
  `migrations/20260421000005_rls_policies/migration.sql`.
- `002_rls_policies_complement.sql` — also merged into that migration.
- `auth_v2_schema.sql`, `rls_policies.sql` — historical; the schema
  they described is already in `schema.prisma` + prior Prisma
  migrations.

The folder stays in the repo for now so git history remains readable,
but nothing in the deploy path reads from it. A follow-up can delete
it once every environment has re-run `prisma migrate deploy`.

## Idempotency

The integrated RLS migration uses `DROP POLICY IF EXISTS` then
`CREATE POLICY` so rerunning the migration on an environment that
already has policies just reinstalls them. `ENABLE ROW LEVEL
SECURITY` is a no-op on an already-enabled table.

## What's still follow-up

- Delete the `manual/` folder once staging and prod have both run the
  new migration.
- Add a CI assertion that every tenant-scoped table listed in
  `schema.prisma` appears in the RLS migration's table list (catch a
  new model landing without a policy).
