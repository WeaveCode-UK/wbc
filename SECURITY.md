# Security policy — WBC Platform

WeaveCode Ltd takes security of the WBC Platform seriously. This document
describes how to report vulnerabilities, the supported versions, and
operational policies that the platform relies on.

## Reporting a vulnerability

Please email **security@weavecode.co.uk** with a description, reproduction
steps, and the impact you observed. Do not open a public GitHub issue.

We will **acknowledge within 2 working days** and provide a **remediation
timeline within 5 working days**. Critical issues (RCE, auth bypass, data
exposure of multiple tenants) are triaged within 24 hours.

### PGP (optional)

For sensitive reports you can encrypt your email to the WeaveCode security
team. The public key is published at:

```
https://weavecode.co.uk/.well-known/security-pgp.asc
```

Fingerprint (short) is available under the same URL. If the URL is
unreachable, send the report unencrypted — we would rather receive it late
than not at all.

## Safe-harbor (responsible disclosure)

We welcome security research conducted in good faith. If you follow this
policy when reporting, WeaveCode Ltd commits to:

- **Not pursue or support legal action** for security research that adheres
  to the rules below.
- **Work with you** to understand and resolve the issue quickly.
- **Credit you publicly** (in release notes or a dedicated hall of fame) if
  you wish.

### Rules for safe-harbor

1. **Make a good-faith effort** to avoid privacy violations, destruction of
   data, and interruption or degradation of the service.
2. **Do not access, modify or download data belonging to other tenants**.
   If you inadvertently encounter PII, stop, erase any copies you made, and
   include that in the report.
3. **Use only your own account** (or one you own the data for) when testing.
4. **Do not run automated scanners** against production without prior
   agreement — they add noise and may trigger rate limits that affect real
   users.
5. **Give us reasonable time to fix** before any public disclosure. Our
   default embargo is **90 days** from acknowledgement; we may request an
   extension for particularly complex issues.

Acting outside these rules is not covered by safe-harbor and may violate
law or our Terms of Service.

## Disclosure timeline

| Step                                     | Timeframe                       |
| ---------------------------------------- | ------------------------------- |
| Acknowledgement                          | ≤ 2 working days                |
| Initial triage with remediation timeline | ≤ 5 working days                |
| Fix released for critical issues         | ≤ 30 days                       |
| Fix released for high issues             | ≤ 60 days                       |
| Fix released for medium/low issues       | best-effort, next release cycle |
| Public disclosure (if agreed)            | ≥ 30 days after fix is live     |

Reporters are included in the release notes and (with consent) a security
acknowledgements page.

## Out of scope

These do NOT qualify as vulnerabilities under this policy:

- Self-XSS that requires the user to paste into DevTools.
- Missing best-practice headers (we'll still fix them, but not as part of
  a disclosure bounty).
- Rate-limit bypasses on non-auth endpoints that require > 1 rps sustained.
- Social-engineering of WeaveCode staff or contractors.
- Denial-of-service through volumetric traffic.
- Clickjacking on pages without sensitive actions.

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
| External pentest cadence: yearly + on major releases                         | Platform team    | Engagement letter on file; reports archived in `Auditoria/_external/`   |
| DAST cadence: nightly OWASP ZAP baseline against staging                     | Platform team    | `.github/workflows/dast.yml` (planned) + `docs/security/dast.md`        |
| Scanner findings triage: gitleaks/Trivy/CodeQL/Semgrep                       | Platform team    | "Scanner triage SLA" below                                              |

## Pentest cadence (ACH-061)

WeaveCode commits to:

- **Annual external pentest** by an independent third party covering the
  WBC web app, tRPC API surface and webhook ingestors. Reports are stored
  under `Auditoria/_external/` in the private security mirror and findings
  are translated into ACH-style entries in the next audit run.
- **Pre-release pentest** for every `vX.0.0` major release before
  promotion to general availability.
- **Quarterly internal red-team exercise** (lighter scope: auth flows,
  RBAC, multi-tenant isolation) executed via the audit framework.

## DAST cadence (ACH-058)

- **Nightly OWASP ZAP baseline scan** against staging from a scheduled
  GitHub Actions workflow (`dast.yml` — to land in the next infra PR).
  Output is archived as a workflow artifact and tracked over time.
- **On-demand Nuclei templates run** before any release that touches the
  webhook handlers or public endpoints.

## Scanner triage SLA (ACH-062)

Findings flowing in from gitleaks (CI + pre-commit), Trivy (image scan in
`docker-images.yml`), CodeQL + Semgrep (`sast.yml` — ACH-057), and
`pnpm audit` are owned by the **Platform team** with the following SLA:

| Severity   | Acknowledge    | Remediate          |
| ---------- | -------------- | ------------------ |
| Critical   | 1 working day  | 7 working days     |
| High       | 3 working days | 30 working days    |
| Medium     | 7 working days | next release cycle |
| Low / Info | best-effort    | quarterly cleanup  |

False-positive suppressions are reviewed quarterly (in the Q3 audit run)
to ensure none have silently become real vulnerabilities under code drift.

## Pending — Secret Manager adoption (ACH-016)

The platform currently relies on `.env.production` for credential storage.
The roadmap calls for migrating to a managed secret store
(AWS Secrets Manager / GCP Secret Manager / Doppler) with rotation hooks.
This is tracked in the audit run `2026-04-18_22-06-18` correction report
under the "Não Corrigíveis" section because it requires infra provisioning
and a vendor decision outside the agent's scope.
