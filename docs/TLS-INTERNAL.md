# TLS for internal datastores (ACH-029, ACH-030)

The WBC platform runs Postgres and Redis behind the same Docker bridge as
the application containers. The bridge is private to the host, but the
audit findings ACH-029 / ACH-030 flagged that traffic between containers
travels in clear text — the bridge is not a security boundary if the host
itself is compromised, and the policy that governs it is invisible to
LGPD compliance reviewers.

This document declares the **target state** and the **rollout plan**.
Production deploys must follow it; the connection-string knobs are
already plumbed through `packages/shared/src/env.ts`.

## Target state

| Datastore | URL scheme    | Required parameters                    |
| --------- | ------------- | -------------------------------------- |
| Postgres  | `postgresql:` | `?sslmode=verify-full&sslrootcert=...` |
| Redis     | `rediss:`     | (TLS implied by scheme)                |

The connection strings live in:

- `DATABASE_URL` — used by `packages/db/src/index.ts` (Prisma client) and
  by `prisma migrate`.
- `REDIS_URL` — used by `apps/api/src/lib/redis.ts`,
  `apps/web/src/lib/auth.config.ts`, BullMQ workers, rate-limit middleware,
  cache and tenant-scoped Redis wrappers.

## Rollout plan

1. **Generate certificates** — Postgres uses a self-signed CA per
   environment, mounted into the container at `/var/lib/postgresql/ca.crt`.
   Redis uses the same convention at `/etc/redis/tls/`.
2. **Add `ssl=on` to postgresql.conf**, point `ssl_cert_file` and
   `ssl_key_file` at the mounted certs. Restart Postgres.
3. **Add `tls-port 6379`, `port 0`** in `redis.conf` (TLS-only) and point
   `tls-cert-file`, `tls-key-file`, `tls-ca-cert-file` at the mounts.
   Restart Redis.
4. **Update `DATABASE_URL`** in `.env.production` to append
   `?sslmode=verify-full&sslrootcert=/var/lib/postgresql/ca.crt`.
5. **Update `REDIS_URL`** in `.env.production` to use the `rediss://`
   scheme.
6. **Update `docker-compose.yml`** to mount the cert dir into both
   containers and pin the schemes.
7. **Verify** with `psql "$DATABASE_URL" -c '\\conninfo'` and
   `redis-cli -u "$REDIS_URL" --tls ping`.

## Certificate rotation

- Self-signed CA expires every 2 years.
- Server cert expires every 1 year — rotated via Ansible playbook
  `ops/rotate-internal-tls.yml` (planned).
- Application picks up the new cert on container restart; no app code
  changes needed.

## Why we keep self-signed (vs Let's Encrypt)

- Certificates are issued for hostnames that resolve only inside the
  Docker bridge; LE's HTTP-01 / DNS-01 challenges don't reach them.
- Postgres and Redis don't speak ACME natively.
- The trust boundary is per-environment — each environment ships its own
  CA with the production image.
