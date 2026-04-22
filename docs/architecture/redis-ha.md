# Redis High Availability (ACH-011 performance-escalabilidade)

## Current state

`docker-compose.prod.yml` runs a single `redis:7-alpine` container.
Outbox / BullMQ / cache all depend on it. A crash or host loss takes
the whole system down — no failover, no replica, jobs in-flight lost.

## Options

### A — Redis Sentinel (recommended near-term)

Three Sentinel nodes monitor one primary + one or two replicas and
promote a replica on primary failure. Stays self-hosted; requires
updating `apps/*/src/lib/redis.ts` to use `ioredis` Sentinel config:

```ts
import Redis from "ioredis";

export const redis = new Redis({
  sentinels: [
    { host: "sentinel-1", port: 26379 },
    { host: "sentinel-2", port: 26379 },
    { host: "sentinel-3", port: 26379 },
  ],
  name: "wbc-master",
  password: process.env.REDIS_PASSWORD,
});
```

Compose-side template at `deploy/docker-compose.sentinel.yml` (stub
seeded alongside this doc).

### B — ElastiCache / Upstash / Railway Redis

Managed Redis with automatic failover. Zero ops work to maintain;
pay per GB. Preferred once the team's deploy target includes a managed
service (AWS / GCP).

## Migration plan (A)

1. Spin up Sentinels + replicas in staging first.
2. Update connection code to use Sentinel mode with `SENTINEL_MODE=1`
   env flag; fallback to standalone for dev.
3. Test failover (stop primary, confirm replica promotes, jobs
   continue).
4. Apply in prod during a low-traffic window.

## Follow-up

- Sentinel compose template (`deploy/docker-compose.sentinel.yml`).
- Replace redis URL in each app with Sentinel config. Centralise in
  `@wbc/shared/redis` so all callers share one factory.
- Document BullMQ quirks under failover (in-flight jobs may duplicate;
  our idempotency keys — ACH-011 dados-persistencia — already handle
  this but add a note to operators).
