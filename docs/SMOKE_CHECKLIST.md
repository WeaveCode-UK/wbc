# Post-deploy smoke checklist (F11.E22)

Run after every staging or production deploy. Stop and roll back if any
required item fails.

## Network reachability

- [ ] `curl -sI $BASE_URL/login` returns 200
- [ ] `curl -sI $BASE_URL/api/health` returns 200
- [ ] `curl -sI $BASE_URL/api/auth/session` returns 200 (body `null` when
      anonymous)
- [ ] `curl -s $BASE_URL/api/trpc/health.live` returns a superjson
      payload `{"result":{"data":{"json":{...}}}}`
- [ ] `curl -sI $BASE_URL/<seeded-slug>` returns 200 (public landing)

## Authentication

- [ ] `/login` form posts and the user lands on `/`
- [ ] Hard refresh on `/clients` keeps the user logged in (cookie persists)
- [ ] "Sair" button (F11.E20.5) calls `signOut` and redirects to `/login`
- [ ] Middleware redirects `/clients` to `/login` for an anonymous browser

## Core CRUD (under a fresh session)

- [ ] `/` (Meu Dia) renders the four stat cards with real numbers
- [ ] `/clients` lists at least one row from the seed
- [ ] "Adicionar cliente" opens the modal; submitting creates a row and
      fires the success toast (F11.E20.5)
- [ ] `/clients/[id]` shows the 6 stats grid, allergy/cashback alerts
      where applicable
- [ ] WhatsApp button on the profile opens a `wa.me` link in a new tab
- [ ] `/sales/new` 4-step wizard: pick a client → pick products → pay →
      submit. The new sale shows up in `/sales` immediately
- [ ] `/campaigns/new` 3-step wizard creates a campaign in DRAFT status

## Heavier flows

- [ ] `/clients/import` — upload `e2e/_fixtures/contacts-50.xlsx` (when
      committed); the import report shows imported / total counts
- [ ] `/clients/qr` renders the QR for the tenant slug
- [ ] `/cadastro/<slug>` (public) accepts a self-registration POST
- [ ] `/nps/<token>` (public) records a score response
- [ ] `/promo/new` renders an SVG card

## Performance

- [ ] First-load JS for `/` <= 300 KB (see Network tab)
- [ ] Lighthouse Performance >= 90 (see `docs/PERFORMANCE.md`)
- [ ] Lighthouse Accessibility >= 90 (delivered by F11.E20.5)
- [ ] Sentry shows no ingest errors for the first 100 requests
- [ ] `/api/vitals` payloads visible in the access log

## Background jobs

- [ ] BullMQ outbox lag (`/api/health` `outboxLag` field) < 60s
- [ ] Worker container logs show no DLQ inserts in the first 5 minutes
- [ ] Manual trigger: `clients.flagInactive` mutation succeeds
- [ ] Manual trigger: `sales.flagExpiringCashbacks` mutation succeeds

## Database integrity

- [ ] `prisma migrate status` reports no pending migrations
- [ ] `pg_isready` against the prod cluster returns 0
- [ ] RLS policies still active: `SELECT * FROM pg_policies WHERE
    schemaname='public'` shows the F1.E02 baseline plus any later
      additions

## Rollback ready

- [ ] Pre-deploy DB snapshot exists at `backups/wbc_<ts>.sql.gz`
- [ ] Last known-good tag (e.g. `v2.0.0-fase-10`) still pulls clean
- [ ] On-call has the runbook URL pinned

If any required item fails, follow `docs/DEPLOY.md` § 6 (Rollback).
