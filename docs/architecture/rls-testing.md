# RLS Isolation Testing (ACH-004 dados-persistencia)

## Why

`packages/db/prisma/migrations/manual/001_rls_policies.sql` installs
`tenant_isolation_*` policies on ~19 tenant-scoped tables. A silent
regression — dropping a policy, forgetting to add one on a new table,
bypassing `app.current_tenant_id` in a new code path — leaks data
across tenants. There's no CI gate catching that today.

This doc + `packages/db/src/__tests__/rls-isolation.test.ts` is the
start of one.

## What the test does

1. Seeds two tenants and one client each via the admin DB connection
   (which bypasses RLS — we're the owner).
2. Runs three assertions under each tenant's GUC:
   - Setting `app.current_tenant_id = A` lets A see A's rows, never B's.
   - Setting `app.current_tenant_id = B` can't see A's rows by id.
   - With the GUC reset, every query returns empty (cast fails safely).
3. Cleans up both tenants.

The test is opt-in via `TEST_DATABASE_URL` — it needs a real Postgres
with migrations applied. It's never run against dev/prod.

## Running it locally

```bash
# Start a throwaway Postgres (docker compose or pg_tmp).
docker run -d --name wbc-rls-test -p 5433:5432 \
  -e POSTGRES_PASSWORD=test -e POSTGRES_DB=wbc_rls postgres:16

export TEST_DATABASE_URL='postgresql://postgres:test@localhost:5433/wbc_rls'

# Apply schema + RLS policies.
pnpm --filter @wbc/db prisma migrate deploy
psql "$TEST_DATABASE_URL" < packages/db/prisma/migrations/manual/001_rls_policies.sql

# Run the test.
pnpm --filter @wbc/db test src/__tests__/rls-isolation.test.ts

# Tear down.
docker rm -f wbc-rls-test
```

## CI (follow-up)

Add a workflow step to `.github/workflows/ci.yml`:

```yaml
- name: RLS isolation
  services:
    postgres:
      image: postgres:16
      env:
        POSTGRES_PASSWORD: test
        POSTGRES_DB: wbc_rls
      ports: ["5432:5432"]
  env:
    TEST_DATABASE_URL: postgresql://postgres:test@localhost:5432/wbc_rls
  run: |
    pnpm --filter @wbc/db prisma migrate deploy
    psql "$TEST_DATABASE_URL" < packages/db/prisma/migrations/manual/001_rls_policies.sql
    pnpm --filter @wbc/db test src/__tests__/rls-isolation.test.ts
```

## What's not covered (yet)

- Only the `clients` table is exercised. The policies apply to ~18
  others; add at least one assertion per table as they become part of
  production-critical flows.
- The test doesn't verify that a table added _without_ a policy gets
  caught — there's no "inventory of tenant-scoped tables" check yet.
  Add one once `enum OpportunityStatus` (ACH-009) lands so we have a
  stable column set to compare against.
