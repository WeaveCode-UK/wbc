# Postgres High Availability (ACH-012/013 performance-escalabilidade)

## Current state

`postgres:16-alpine` as a single container in
`docker-compose.prod.yml`. No streaming replication, no read replicas,
no tested failover. Backups (`deploy/backup/`) are the only recovery
path.

## Options

### A — Streaming replication (self-hosted)

Primary + hot standby via `pg_basebackup` + WAL streaming. The
standby can serve read-only queries (analytics dashboards) and take
over on primary failure via `pg_ctl promote` (manual) or Patroni
(automatic).

### B — RDS Multi-AZ / Cloud SQL HA

Managed Postgres with automatic failover. Bigger cost (and hosting
outside Brazil can add LGPD cross-border concerns); trades compute
cost for operational simplicity.

## Prisma connection pool (ACH-013)

When the replica serves reads, set up two Prisma clients — one
pointing at the writer, one at the replica — and route via
`prisma.$extends`. Use the `connection_limit` query param pinned per
service:

```
# API
DATABASE_URL="postgresql://wbc_app:...@postgres-writer:5432/wbc"
DATABASE_REPLICA_URL="postgresql://wbc_readonly:...@postgres-reader:5432/wbc"

# Worker — lower pool because job concurrency is already bounded
DATABASE_URL="postgresql://wbc_app:...@postgres-writer:5432/wbc?connection_limit=3"
```

Capacity sheet (update in `.env.production.example`):

- API: default pool (~2 × vCPU + 1 → ~9 connections per instance)
- Worker: `connection_limit=3` per instance
- Postgres `max_connections`: 100 (stock) → allow ~70 for the app,
  reserve 30 for admin/migration.

## Runbook: manual failover (Option A)

```bash
# On standby:
pg_ctl -D /var/lib/postgresql/data promote
# Update proxy (pgbouncer/haproxy) upstream to point at new primary.
# Old primary, once reachable, rebases as the new standby:
pg_basebackup -D /var/lib/postgresql/data -h new-primary -P -U replicator
```

Publish RTO (≤ 15 min for manual, ≤ 1 min with Patroni) in
`docs/architecture/backup-and-recovery.md`.

## Follow-up

- Decide Option A vs B based on deploy target; the repo docs assume
  A (self-hosted) today.
- Patroni / repmgr for automatic failover if A is chosen.
- Add a CI job that spins up primary + standby, kills the primary,
  asserts reads continue via standby.
- Cross-link from `docs/DEPLOYMENT.md` once implemented.
