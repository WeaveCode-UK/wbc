# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Versionamento: [SemVer](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added

- `docs/DEVELOPMENT.md` com quickstart local e política de auto-shutdown (ACH-014 custos-finops).
- `docs/PRICING.md`, `docs/DR-BACKUP-POLICY.md`, `docs/FINOPS-{KILL-SWITCH,PLAN-LIMITS,WHATSAPP-BILLING,COST-RECONCILIATION,OBSERVABILITY}.md`, `docs/DEEPSEEK-FALLBACK.md` (correção custos-finops run 2026-04-19_21-19-13).
- `docs/OVERRIDES.md`, `docs/AUTH-NEXTAUTH-BETA.md`, `docs/SECURITY-HUSKY.md`, `docs/LICENSING.md`, `docs/integrity/README.md`, `docs/migrations/next-intl-v4.md` (correção supply-chain-dependencias run 2026-04-19_21-11-51).
- `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1).
- `docs/GLOSSARY.md`, `docs/OPERATIONS.md`, `docs/architecture/flows.md`, `docs/DOCUMENTATION-ROADMAP.md` e runbooks em `docs/runbooks/` (correção documentacao-runbooks run 2026-04-19_21-26-25).
- `packages/business/finops/` seed (domain + ports) para `CostBudgetService` e `CostSnapshot` (parcial ACH-001/010 custos-finops).
- `packages/business/messaging/ports/message-billing.ts` seed (parcial ACH-003 custos-finops).
- `packages/shared/src/sentry-noise-filter.ts` com `filterCostNoise()` para descartar 404/timeouts/aborts antes de enviar ao Sentry (ACH-005 custos-finops).
- Grupo de alertas `wbc-finops-alerts` em `deploy/alerts.yml` (placeholders até métricas existirem — ACH-004 custos-finops).
- Jobs CI `security-audit`, `license-scan`, `lockfile-integrity`, `peer-deps-report` (ACH-003/007/009/016 supply-chain-dependencias).
- cosign keyless + SLSA build provenance + SBOM attestation no workflow `docker-images.yml` (ACH-005 supply-chain-dependencias).
- Kill-switch constants `KILL_SWITCH.{DEEPSEEK,WHATSAPP,SENTRY,AI_GENERATIONS}` em `packages/shared/src/feature-flags.ts` (ACH-012 custos-finops).
- `cleanupFailedOutboxEvents` em `apps/worker/src/processors/outbox-cleanup.ts` — outbox FAILED agora também é purgado (ACH-007 custos-finops).

### Changed

- README expandido com quickstart, stack, scripts, links (ACH-002 documentacao-runbooks).
- SECURITY.md estendido com PGP, safe-harbor, timeline de disclosure (ACH-001 documentacao-runbooks).
- CONTRIBUTING.md estendido com developer guide (commits, PRs, comment policy) (ACH-003/011/014/016 documentacao-runbooks).
- Sentry tracesSampleRate default 0.3 → 0.1 em prod; `replaysOnErrorSampleRate` 1.0 → 0.3 (ACH-005 custos-finops).
- Docker base images + docker-compose.prod.yml agora com `@sha256:…` pinning (ACH-004 supply-chain-dependencias).
- `.nvmrc` passou de `20` (floating) para `20.18.1` (ACH-014 supply-chain-dependencias).
- `pnpm.overrides` inclui `protobufjs >=7.5.5`, `picomatch >=4.0.3`, `vite ^8.0.10` para mitigar CVEs (ACH-001/010/011 supply-chain-dependencias).
- `.github/dependabot.yml` cobre docker + docker-compose + github-actions; grupo separado para major bumps (ACH-006 supply-chain-dependencias).
- CI workflow ganhou `paths-ignore` para docs/markdown/Auditoria, Turborepo cache via `actions/cache@v4` e env `TURBO_TOKEN/TURBO_TEAM` opt-in (ACH-009/013 custos-finops).

### Removed

- Stubs de tipos redundantes: `@types/bcryptjs` e `@types/ioredis` (ACH-013 supply-chain-dependencias; bcryptjs/ioredis já distribuem tipos).

### Security

- Override de `protobufjs@7.5.4` (RCE crítica via OpenTelemetry) — agora resolve para `protobufjs@8.0.1` (ACH-001 supply-chain-dependencias).
- Override de `picomatch 2.x/3.x` (glob injection CVE) — agora ≥ 4.0.3 (ACH-010 supply-chain-dependencias).
- Override de `vite` (path traversal em sourcemaps em ≤ 8.0.4) — agora ≥ 8.0.10 (ACH-011 supply-chain-dependencias).

---

## [1.0.0] — sem release pública ainda

O WBC Platform está em fase de build orquestrada (ver `begin/WBC_ORCHESTRATOR.md`). A primeira versão pública (`v1.0.0`) será marcada quando todas as 7 fases do roadmap fechem e a auditoria de segurança final aprovar o go-live. Até lá, `main` é considerado `0.x.y` e breaking changes podem ocorrer sem bump de major.

---

## Como manter este arquivo

- Cada PR relevante inclui uma linha em `[Unreleased]` sob a seção apropriada (`Added` / `Changed` / `Fixed` / `Removed` / `Security` / `Deprecated`).
- No momento de um release tag, move-se `[Unreleased]` para `[X.Y.Z] — YYYY-MM-DD` e limpa `[Unreleased]`.
- Referencie o achado (`ACH-###`) ou PR quando útil para rastreabilidade.

---

_Última revisão: 2026-04-24 · Próxima revisão esperada: a cada release_
