# Scaling & Deploy (ACH-025/022 performance-escalabilidade)

## Current state

`docker-compose.prod.yml` runs `web` and `worker` each as a single
container (no `deploy.replicas`). A crash takes the service offline
until the container restart policy kicks in; no blue/green, no HPA.

## Near-term (docker compose scale)

For low traffic, `docker compose up --scale web=2 --scale worker=2`
plus nginx upstream load-balancing:

```nginx
upstream web {
    server web:3000;
    # Compose DNS resolves all replicas; nginx picks round-robin.
}
```

This fits the current single-host deploy. Redis + Postgres HA
(ACH-011/012) still need to land for the scale-out to be meaningful.

## Medium-term (Kubernetes)

Stub manifests at `deploy/k8s/` (seeded alongside this doc). Target
shape:

- Deployment `web` (2 replicas, HPA on CPU ≥ 70%)
- Deployment `worker` (2 replicas, HPA on queue depth ≥ 100 via
  KEDA + `wbc_queue_waiting_total` metric)
- PodDisruptionBudget minAvailable=1 per deployment
- Service → Ingress → Cloudflare / CloudFront as CDN (ACH-022)

## CDN (ACH-022)

`next.config.mjs` now reads `CDN_URL`. Set it to e.g.
`https://cdn.seudominio.com.br` when you point a CDN at
`_next/static/*`. Web + worker accept the env var transparently.

Cache rules:

- `_next/static/*` — long-lived (`Cache-Control: public, max-age=31536000, immutable`)
- Static assets in `/public` — hashed filenames only (same long TTL)
- HTML — short TTL (`s-maxage=60, stale-while-revalidate=3600`) with
  Cloudflare-compatible Vary headers

## Follow-up

- Fill in the k8s manifests (currently stubs; real values depend on
  the cluster flavour).
- KEDA scaler config once BullMQ metrics are exposed to Prometheus.
- DR runbook: simulate loss of one worker replica during a campaign
  dispatch; confirm other replica catches up.
