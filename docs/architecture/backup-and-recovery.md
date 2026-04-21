# Backup & Recovery (ACH-018 dados-persistencia)

## Targets

| Objective | Target | Why                                                      |
| --------- | ------ | -------------------------------------------------------- |
| RPO       | ≤ 1 h  | Outbox/events + sales can't tolerate more than ~1 h loss |
| RTO       | ≤ 4 h  | Single-tenant outage budget before SaaS penalty kicks in |

## Current state

- `deploy/backup/backup.sh` — `pg_dump` to a local directory.
- `deploy/backup/install-cron.sh` — schedules the dump daily at 03:00.
- `deploy/backup/restore.sh` — manual restore procedure.

## What's missing (follow-up)

1. **Remote upload** — the dump stays on the same host. The install
   script needs a matching `upload.sh` that pushes to S3 (or GCS, or
   wasabi) with versioning, or a `restic`/`borg` wrapper that handles
   dedup + encryption. Without this, a host loss is a dataset loss.
2. **Monthly restore drill** — checkbox runbook + calendar reminder.
   Pick one monthly date, spin up an ephemeral Postgres, restore the
   most recent dump, run `pnpm --filter @wbc/db prisma migrate deploy`
   to re-confirm schema parity, spot-check 5 random tables for row
   counts matching the dump's metadata.
3. **Point-in-time recovery** — `pg_basebackup` + WAL archiving, for
   RPO closer to 5 min. Out of scope for now; the daily dump covers
   RPO ≤ 24 h baseline, which is below the ≤ 1 h target but better
   than the previous "best effort" state.

## Runbook: monthly restore drill

```bash
# 1. Pick the most recent dump.
LATEST=$(ls -1t /var/backups/wbc/*.dump | head -1)

# 2. Throwaway DB.
docker run -d --name wbc-restore-drill -p 5434:5432 \
  -e POSTGRES_PASSWORD=drill postgres:16

# 3. Restore.
PGPASSWORD=drill pg_restore -h localhost -p 5434 -U postgres \
  --create --dbname=postgres --verbose "$LATEST"

# 4. Sanity.
PGPASSWORD=drill psql -h localhost -p 5434 -U postgres -d wbc \
  -c 'SELECT COUNT(*) FROM tenants;'

# 5. Tear down.
docker rm -f wbc-restore-drill
```

Record the date + result in an ops log. If the restore fails or the
row counts diverge from the source cluster's metadata, open an
incident and halt writes until RCA.

## Follow-up CI

Add a nightly GHA job that:

1. Pulls the most recent dump from the remote store (once upload
   exists).
2. Restores it into a scratch Postgres service.
3. Runs `prisma migrate deploy` to confirm schema matches.
4. Fails the job on any mismatch.

That catches the silent-drift failure mode the achado called out
without needing a human to run the drill by hand.
