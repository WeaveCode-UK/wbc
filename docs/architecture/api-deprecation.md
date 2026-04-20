# API Deprecation Policy (ACH-005 apis-integracoes)

## Policy

A field or procedure that ships on a MAJOR version **stays alive for
at least one full MAJOR after being marked deprecated**. Clients
coded against MAJOR N keep working on MAJOR N+1; they only break on
N+2.

This rule applies equally to:

- Input fields (Zod `.optional()` on the deprecated field, never
  remove).
- Output fields (keep populating them; allow `null` only if the old
  contract allowed `null`).
- Procedures (keep the route registered; it can delegate to the new
  procedure with an adapter).

## Marking something deprecated

1. Add a JSDoc `@deprecated` with the target removal version and the
   replacement.

   ```ts
   /** @deprecated v2.0 — use `sale.totalCents` instead. */
   total: z.number(),
   ```

2. Log a warn on the server side the first time a request hits the
   deprecated path per tenant per day. Use `security-logger` so the
   log carries tenant / user / route fields.

3. Add an entry to the API changelog (follow-up — today we rely on
   git log; once a changelog exists, also link it from release notes).

## CI guard

`scripts/check-deprecated-fields.mjs` enumerates the Zod schemas
exported from `@wbc/validators` and diffs them against
`.api-snapshot.json`:

- **added** — OK, counts as MINOR.
- **tightened** (optional → required) — FAIL. MAJOR + deprecation
  required.
- **removed** — FAIL. MAJOR + deprecation required.

Run on PRs; rewrite the snapshot only on release branches.

```bash
# On a feature PR (checks only):
node scripts/check-deprecated-fields.mjs

# On a release branch, after intentional bumps:
node scripts/check-deprecated-fields.mjs --snapshot
git add .api-snapshot.json
```

## Limitations of the current stub

- Only top-level object fields are diffed. Nested schemas aren't
  walked yet.
- Removed **procedures** aren't detected — `AppRouter` diff needs a
  separate enumerator that consumes `apps/api/src/trpc/router.ts`.
- `@deprecated` JSDoc isn't parsed from the schema (yet). A field can
  be silently removed if you forget to bump the snapshot.

All three are follow-ups — the stub is enough to catch the most
common regression (field disappeared without warning) while the
dedicated tooling is built.
