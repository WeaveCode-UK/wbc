# Deploy runbook (F11.E22)

End-to-end procedure to ship the WBC Platform to staging and production.
Pairs with `deploy/RUNBOOKS.md` (operational shortcuts) and
`docs/PERFORMANCE.md` (performance gates the build must clear).

## 0. Pre-deploy gates

Run from the repo root:

```bash
pnpm type-check        # all 8 packages green
pnpm test              # vitest suite green (138+ tests)
pnpm test:e2e          # Playwright golden paths (skips on test.fixme are OK)
pnpm --filter @wbc/web build
```

Tag the green commit so the deploy is referenceable:

```bash
git tag -a v3.0.0-fase-11-rc1 -m "F11 release candidate 1"
git push origin v3.0.0-fase-11-rc1
```

## 1. Environment variables

Two files live outside the repo. Copy from `.env.production.example` and
fill in real values.

```bash
deploy/staging.env       # not committed — see infra wiki
deploy/production.env    # not committed — see infra wiki
```

The minimum required keys (see `.env.production.example` for the full
inventory):

| Key                          | Source                            |
| ---------------------------- | --------------------------------- |
| `DATABASE_URL`               | RDS / managed Postgres            |
| `REDIS_URL`                  | ElastiCache / managed Redis       |
| `AUTH_SECRET`                | `openssl rand -base64 48`         |
| `AUTH_URL`                   | `https://staging.wbc.com.br` etc. |
| `RESEND_API_KEY`             | resend.com dashboard              |
| `MERCADOPAGO_ACCESS_TOKEN`   | Mercado Pago app                  |
| `MERCADOPAGO_WEBHOOK_SECRET` | Mercado Pago webhook config       |
| `WHATSAPP_API_TOKEN`         | Meta WhatsApp Business            |
| `WHATSAPP_PHONE_NUMBER_ID`   | same                              |
| `WHATSAPP_APP_SECRET`        | same                              |
| `SENTRY_DSN`                 | Sentry project                    |
| `CDN_URL`                    | Cloudflare / S3+CloudFront URL    |

## 2. Staging deploy

```bash
# SSH into the staging box, cd into the app dir
ssh deploy@staging.wbc.com.br
cd /srv/wbc

# Pull the tagged commit
git fetch --tags
git checkout v3.0.0-fase-11-rc1

# Migrate, build, restart
./deploy/deploy.sh update
```

`deploy.sh update` already runs:

1. `git pull` (skipped above because we checked a tag)
2. `pnpm install --frozen-lockfile`
3. `pnpm prisma migrate deploy`
4. `pnpm build` for web, api, worker
5. `docker compose -f docker-compose.prod.yml up -d --build`

## 3. Smoke test against staging

After `deploy.sh update` finishes, run the smoke checklist
(`docs/SMOKE_CHECKLIST.md`). All of it must pass before promoting to
production.

The Playwright golden paths can be re-pointed at staging for an automated
sweep:

```bash
PLAYWRIGHT_BASE_URL=https://staging.wbc.com.br pnpm test:e2e
```

## 4. Promote to production

Only after staging smoke is fully green. Production is the same
procedure with the production env file and DNS:

```bash
ssh deploy@wbc.com.br
cd /srv/wbc
git fetch --tags
git checkout v3.0.0-fase-11-rc1   # promote the same tag
./deploy/deploy.sh update
```

## 5. Tag the release

After production smoke passes, promote the rc tag to a stable tag:

```bash
git tag -a v3.0.0-fase-11 -m "F11 — gap closure to MVP"
git push origin v3.0.0-fase-11
```

Update `prompts/STATE.json` and the `CHANGELOG.md` (F11.E23).

## 6. Rollback

If production smoke fails, roll back to the previous green tag:

```bash
ssh deploy@wbc.com.br
cd /srv/wbc
git checkout v2.0.0-fase-10        # last known-good
./deploy/deploy.sh update
```

The Prisma migrations applied during the failed deploy are forward-only;
**always** snapshot the DB before the deploy:

```bash
./deploy/backup/backup.sh
```

If a forward-only migration broke something at the DB level, restore from
the snapshot (`./deploy/backup/restore.sh backups/wbc_<ts>.sql.gz`) before
flipping the app back. Document the incident in `docs/incidents/`.

## 7. Post-deploy

- [ ] Sentry: confirm no flood of errors in the first 5 minutes.
- [ ] Grafana board `api-latency`: p95 < 500ms.
- [ ] `/api/health` returns 200 with `outboxLag` < 60s.
- [ ] `/api/vitals` is receiving payloads (RUM working).
- [ ] Open a smoke session as a real user (Renata) and click through
      `/`, `/clients`, `/sales/new`, `/campaigns`, `/finance`.
- [ ] If staging→prod gap was > 1 day, re-run the F11.E20.5 polish smoke.
