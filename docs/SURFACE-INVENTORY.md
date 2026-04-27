# API Surface Inventory — WBC Platform (ACH-002)

This document is the source-of-truth list of every authenticated and
public surface the platform exposes. It is regenerated quarterly during
the audit cadence and ad-hoc whenever a router/route is added.

The intent is to give auditors and new engineers a single page that
answers "what does the WBC platform expose to the network?" without
greping the codebase.

> **Generation script**: a follow-up PR will drop a `pnpm gen:surface`
> task that walks `apps/api/src/routers/*.ts` and `apps/web/src/app/api/`
> to keep this in sync automatically. Until then, treat this as a
> reviewed snapshot — the audit framework cross-checks it against
> `findings.json` per run.

## tRPC routers (apps/api/src/routers)

> **Status**: not exposed via HTTP today (see ACH-010). Once the HTTP
> handler lands, every procedure below becomes externally reachable.

| Router    | Procedures (count) | Procedure level                         |
| --------- | ------------------ | --------------------------------------- |
| auth      | 24                 | mixed (public, authed, protected, role) |
| mfa       | 4                  | authed                                  |
| health    | 2                  | public                                  |
| clients   | 9                  | protected                               |
| catalog   | 7                  | protected (public showcase: 1)          |
| sales     | 12                 | protected                               |
| inventory | 8                  | protected                               |
| finance   | 9                  | protected + DIRECTOR/ADMIN              |
| analytics | 5                  | protected                               |
| messaging | 3                  | protected                               |
| campaigns | 4                  | protected                               |
| ai        | 5                  | protected                               |
| schedule  | 4                  | protected                               |
| team      | 4                  | protected                               |
| logistics | 5                  | protected                               |
| landing   | 3                  | mixed                                   |
| platform  | 6                  | platform-admin                          |
| admin     | 5                  | ADMIN                                   |
| privacy   | 4                  | DIRECTOR + tenant:export                |

Total routers: 19. Total procedures: ~123.

## Next.js route handlers (apps/web/src/app/api)

| Path                      | Method | Auth                 | Notes                                         |
| ------------------------- | ------ | -------------------- | --------------------------------------------- |
| /api/auth/[...nextauth]   | \*     | NextAuth             | session, login, logout, OAuth                 |
| /api/health               | GET    | public               | liveness                                      |
| /api/metrics              | GET    | private (allow-list) | prom-client; gated to internal Prometheus IPs |
| /api/register             | POST   | public               | currently 503 (Auth 2.0 migration)            |
| /api/send-otp             | POST   | public               | currently 503 (deprecated)                    |
| /api/vitals               | POST   | public               | RUM beacon; sanitised log (ACH-033)           |
| /api/webhooks/mercadopago | POST   | HMAC                 | dedup + replay protection (ACH-026)           |
| /api/webhooks/whatsapp    | POST   | HMAC                 | inbound message events                        |

## Public surface (no auth)

- `app.weavecode.co.uk/login`, `/register`, `/reset-password`,
  `/verify-email`, `/invite` — all rate-limited via nginx + tRPC
  middleware.
- `app.weavecode.co.uk/.well-known/security.txt` (ACH-060).
- Catalog showcase by `shareLink` token — CSPRNG 128-bit (ACH-028).
- Landing pages by `slug` (apps/landing).

## Internal-only

- Grafana behind `/grafana/` — admin auth required.
- Prometheus scrape on `apps/api/metrics-server.ts` — IP allow-list at
  the nginx layer.
- BullMQ Bull-Board (when enabled) — admin auth required.

## Update process

1. PR adding a router/route updates this file.
2. Audit run loads this file as a starting point for fase-04 BFLA / BOLA
   sweeps.
3. If a procedure is renamed or removed, the PR removes the line — no
   entries should remain pointing at dead handlers.
