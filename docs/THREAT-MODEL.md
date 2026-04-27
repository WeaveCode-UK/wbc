# Threat Model — WBC Platform (ACH-001)

This document maps STRIDE categories to each component of the WBC
Platform. It is an ADR-style living document — every new component, new
external integration, or new sensitive flow MUST update this file in the
same PR.

The mitigations referenced are pointers to live code or ops docs; this
file does not duplicate them.

## Scope

In-scope components:

- **apps/web** — Next.js (auth-gated UI + tRPC client)
- **apps/api** — tRPC routers (currently not exposed via HTTP — see ACH-010)
- **apps/worker** — BullMQ background jobs (DLQ, post-sale flow, etc.)
- **apps/landing** — public marketing surface
- **apps/mobile** — Expo client (read-mostly)
- **packages/business** — domain layer (auth, finance, sales, etc.)
- **packages/db** — Prisma client + RLS

External dependencies:

- **MercadoPago** — payment webhooks (HMAC-signed)
- **WhatsApp Business API** — outbound messaging + inbound webhook
- **Resend** — transactional email
- **DeepSeek** — LLM (campaign / billing / correction text)
- **Sentry** — error tracking (PII redacted at boundary)

## STRIDE per component

### apps/web (Next.js)

| Category               | Threat                                                 | Mitigation                                                |
| ---------------------- | ------------------------------------------------------ | --------------------------------------------------------- |
| Spoofing               | Stolen JWT cookie → impersonation                      | jti blacklist + per-account `revokedBefore` (ACH-005/008) |
| Tampering              | XSS via user-controlled HTML                           | CSP nonce + Permissions-Policy + escapeHtml in templates  |
| Repudiation            | Mutation without trace                                 | AuditLog wired in sensitive routers (ACH-016/063)         |
| Information disclosure | data.domainError leaking AccountLocked vs InvalidCreds | errorFormatter strips in production (ACH-032)             |
| Denial of service      | Slowloris / volumetric on edge                         | nginx limit_req + limit_conn + 10s timeouts (ACH-070)     |
| Elevation of privilege | CONSULTANT promoting self                              | roleProtectedProcedure(ADMIN) + canPromoteTo              |

### apps/api (tRPC)

| Category    | Threat                              | Mitigation                                             |
| ----------- | ----------------------------------- | ------------------------------------------------------ |
| Spoofing    | Cross-tenant query                  | tenantInjectionMiddleware + RLS (ACH-013/014)          |
| Tampering   | Bypass state machine on Sale.status | isValidSaleTransition (ACH-022)                        |
| Repudiation | Admin action without trace          | auditLog.record on admin.dlq.replay, sessions.revoke\* |
| Info disc.  | Domain class name leak              | errorFormatter prod-strip (ACH-032)                    |
| DoS         | Big notes by authenticated user     | z.string().max() per validator (ACH-018)               |
| EoP         | BFLA on finance/privacy             | DIRECTOR/ADMIN gates + requirePermission (ACH-011)     |

### Webhooks (MercadoPago / WhatsApp)

| Category  | Threat                       | Mitigation                                                        |
| --------- | ---------------------------- | ----------------------------------------------------------------- |
| Spoofing  | Forged webhook               | HMAC verify (`MERCADOPAGO_WEBHOOK_SECRET`, `WHATSAPP_APP_SECRET`) |
| Tampering | Replay of legitimate webhook | Redis dedup `webhook:mp:dedup:<dataId>` 10 min (ACH-026)          |
| DoS       | Flood unsigned probes        | nginx rate-limit `req_webhook` (ACH-047/070)                      |

### Worker (BullMQ)

| Category  | Threat                          | Mitigation                                                 |
| --------- | ------------------------------- | ---------------------------------------------------------- |
| Tampering | Job from compromised producer   | Outbox pattern: only services with DB write-access enqueue |
| Repud.    | Failure flow lost               | DLQ + Slack fanout (ACH-050)                               |
| DoS       | Slow outbound pendurando worker | AbortController em todo fetch outbound (ACH-048/050)       |

### LLM (DeepSeek)

| Category   | Threat            | Mitigation                                                  |
| ---------- | ----------------- | ----------------------------------------------------------- |
| Tampering  | Prompt injection  | system + user role separation + `<input>` markers (ACH-020) |
| Info disc. | Token cost abuse  | aiRepo.checkLimit + clampInput 4 KB                         |
| DoS        | Long-running call | AbortController + circuit breaker                           |

## Reviewer checklist

When the PR introduces a new endpoint, integration or sensitive flow:

1. Which STRIDE categories does it touch?
2. Which mitigations apply? (link to code)
3. Does the AuditLog cover it?
4. Does the CSP / Permissions-Policy still constrain it?
5. Does any new dependency need an SRI entry (`docs/SRI-POLICY.md`)?

The PR description should answer these before requesting review.
