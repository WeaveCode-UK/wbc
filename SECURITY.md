# Security policy — WBC Platform

WeaveCode Ltd takes security of the WBC Platform seriously. This document
describes how to report vulnerabilities, the supported versions, and
operational policies that the platform relies on.

## Reporting a vulnerability

Please email **security@weavecode.co.uk** with a description, reproduction
steps, and the impact you observed. Do not open a public GitHub issue.

We will acknowledge within 2 working days and provide a remediation timeline
within 5 working days.

## Supported versions

Only the `main` branch and tagged releases since `v1.0.0` receive security
fixes. Older tags are best-effort.

## Operational policies (referenced by audits)

| Policy                                                                       | Owner            | Source of truth                                                         |
| ---------------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------- |
| Secret rotation: every 90 days                                               | Platform team    | Secret Manager (see ACH-016)                                            |
| AUTH_SECRET strength: ≥32 chars, no weak patterns                            | Enforced in code | `packages/shared/src/env.ts`                                            |
| TOTP encryption key (`TOTP_ENCRYPTION_KEY`): rotated yearly                  | Platform team    | `.env.production` / Secret Manager                                      |
| JWT lifetime: 15 minutes                                                     | Enforced in code | `apps/web/src/lib/auth.config.ts` (`SESSION_MAX_AGE_SECONDS`)           |
| Login lockout: 5 failures / 15 min                                           | Enforced in code | `RedisLoginAttemptTracker.DEFAULT_LOCKOUT_POLICY`                       |
| Postgres role separation: `wbc_app` / `wbc_migrations` / `wbc_readonly`      | DBA / deploy     | `packages/db/prisma/scripts/setup-roles.sql` (ACH-025)                  |
| Branch protection on `main`: required reviews ≥1, signed commits, CODEOWNERS | GitHub admin     | `CONTRIBUTING.md` (ACH-017)                                             |
| Secret scanning: gitleaks pre-commit + CI; GitHub native push protection     | Platform team    | `.gitleaks.toml`, GitHub settings (ACH-015)                             |
| Sentry / log redaction: PII never sent to third parties in clear             | Enforced in code | `packages/shared/src/{redaction,sentry-redaction}.ts` (ACH-019/020/021) |
| Audit log retention: 12 months minimum                                       | Platform team    | `audit_logs` table (ACH-024) — exporter to be implemented               |

## Pending — Secret Manager adoption (ACH-016)

The platform currently relies on `.env.production` for credential storage.
The roadmap calls for migrating to a managed secret store
(AWS Secrets Manager / GCP Secret Manager / Doppler) with rotation hooks.
This is tracked in the audit run `2026-04-18_22-06-18` correction report
under the "Não Corrigíveis" section because it requires infra provisioning
and a vendor decision outside the agent's scope.
