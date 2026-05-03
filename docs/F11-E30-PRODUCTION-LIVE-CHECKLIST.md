# F11.E30 — Production-live checklist (USER ONLY)

> **Why this is user-only.** The agent cannot reach the production
> Kubernetes cluster, the managed Postgres, the DNS provider, the
> container registry, or the secrets vault. Everything below requires
> credentials that live outside the repo. This document is the
> checklist the human operator (Robson) executes to flip the
> `v3.0.0-fase-11` tag from "build complete" to "production live".
>
> Pairs with `docs/DEPLOY.md` (the long-form procedure) and
> `deploy/RUNBOOKS.md` (operational shortcuts). This file only adds
> the **acceptance gate** the operator signs off on for F11.E30.

## Pre-flight (read-only)

- [ ] `git tag -l v3.0.0-fase-11` returns the tag from F11.E23.
- [ ] `git log v3.0.0-fase-11..HEAD --oneline` lists the F11.E24–E29
      follow-up commits and nothing surprising.
- [ ] `pnpm type-check` from `HEAD` is green.
- [ ] `pnpm test` from `HEAD` is green (138+ tests).
- [ ] `docs/PERFORMANCE.md` has a baseline row dated within the last
      7 days for each of `/`, `/clients`, `/sales/new`, `/campaigns/new`.

## Cut a release candidate

- [ ] `git tag -a v3.0.0-fase-11-rc1 -m "F11 release candidate"`
- [ ] `git push origin v3.0.0-fase-11-rc1`
- [ ] CI pipeline for that tag is green (build + lint + tests).

## Build + push images

- [ ] `IMAGE_TAG=v3.0.0-fase-11-rc1 ./deploy/deploy.sh build`
- [ ] `docker images | grep weavecode/wbc` shows the freshly built
      `web` and `worker` images.
- [ ] `IMAGE_TAG=v3.0.0-fase-11-rc1 ./deploy/deploy.sh push`
      pushes to the registry (`weavecode/wbc-web` and `wbc-worker`).

## Database migrations

- [ ] Backup current production DB
      (`./deploy/backup/snapshot.sh production`).
- [ ] On a staging clone, run the migration: `pnpm --filter @wbc/db
    migrate:deploy`. Watch for errors.
- [ ] Verify the new tables/columns landed:
      `psql $STAGING_DATABASE_URL -c "\dt"`
- [ ] Apply to production: `pnpm --filter @wbc/db migrate:deploy`
      against `$DATABASE_URL`.
- [ ] Run the F11 outbox sanity check (any pending events should drain
      within 30s of the worker boot — see `apps/worker/src/index.ts`
      log line "Outbox processor started").

## Deploy

- [ ] Apply Kubernetes manifests:
      `kubectl apply -k deploy/k8s/overlays/production`
- [ ] Watch rollout: `kubectl rollout status deploy/wbc-web -n wbc`
      then `wbc-worker`. Both must reach Ready before continuing.
- [ ] Probe the health endpoints:
      `curl -fsSL https://api.wbc.weavecode.co.uk/health/live`
      and `/health/ready` — both 200.
- [ ] Worker health: `curl -fsSL
    https://worker.wbc.weavecode.co.uk/health/ready` — 200, with
      `outboxLagMs < 30000`.

## DNS / TLS cutover

- [ ] Update DNS A/AAAA for `app.wbc.weavecode.co.uk` to the new
      ingress.
- [ ] Verify `dig app.wbc.weavecode.co.uk` resolves to the production
      load balancer.
- [ ] Confirm the cert is valid:
      `curl -sI https://app.wbc.weavecode.co.uk/login | head -1` →
      `HTTP/2 200`.

## Smoke test

- [ ] Sign in as the demo consultora.
- [ ] Create a client → confirm the row lands in production DB.
- [ ] Open `/campaigns/[id]` for a real campaign — funnel and
      conversion stats render real numbers (F11.E26).
- [ ] Open `/settings/plan` — subscription details render
      (F11.E26 `platform.getSubscription`).
- [ ] Trigger a sale confirm → outbox publishes `sale.confirmed`,
      worker credits loyalty (`F11.E25 registerLoyaltyHandler`).
- [ ] Mobile app receives an Expo Push token (check logs for
      `[wbc] expo push token: ...`) and a test notification arrives
      end-to-end.

## Observability sanity

- [ ] Sentry: no new high-volume errors in the first 15 minutes.
- [ ] Grafana `WBC API latency` p95 ≤ 500ms.
- [ ] Grafana `Outbox lag` p95 ≤ 30s.
- [ ] Prometheus `outbox_failed_total` not increasing.
- [ ] DLQ depth = 0.

## Post-deploy

- [ ] Run `./scripts/lighthouse-baseline.sh` against
      `https://app.wbc.weavecode.co.uk` and update
      `docs/PERFORMANCE.md` with the production numbers (replacing the
      dev-mode `/login` row).
- [ ] Promote the RC tag:
      `git tag -a v3.0.0-fase-11 -f -m "Production live"`
      `git push --force origin v3.0.0-fase-11` (only if RC1 is the
      one going live; otherwise create v3.0.0-fase-11-rc2 and repeat).
- [ ] Update `prompts/STATE.json`:
      `current_phase: 11, status: PRODUCTION_LIVE,
     prod_tag: v3.0.0-fase-11, deployed_at: <ISO>`.

## Rollback (only if smoke test fails)

- [ ] `kubectl rollout undo deploy/wbc-web -n wbc`
- [ ] `kubectl rollout undo deploy/wbc-worker -n wbc`
- [ ] Restore DB from snapshot taken at "Database migrations" step
      above (`./deploy/dr/restore.sh <snapshot-id>`).
- [ ] Re-point DNS to the prior load balancer (TTL 60s on
      production).

## Sign-off

When every box above is checked and the smoke test passes, F11.E30 is
complete. Update `prompts/STATE.json` to `PRODUCTION_LIVE` and close the
loop on Fase 11.
