# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Versionamento: [SemVer](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added — Fase 11 (Gap Closure to MVP)

**F11.E01–E02 · Foundation**

- tRPC client mounted in `apps/web` via `/api/trpc/[trpc]/route.ts` + `lib/trpc.ts` + `providers/trpc-provider.tsx`. Every UI page can now call procedures end-to-end with full type safety.
- Auth middleware re-enabled via the `auth.config.edge.ts` split (Edge runtime can't import Redis/bcrypt/crypto). CSP nonces, route protection, and onboarding gates are back.

**F11.E03–E06 · Connect existing UI**

- 18 dashboard pages now load real data through tRPC (was `EmptyState` scaffolds): `/`, `/clients`, `/clients/[id]`, `/sales`, `/sales/new`, `/finance`, `/campaigns`, `/campaigns/new`, `/catalog`, `/inventory`, `/schedule`, `/team`, `/landing`, `/settings`, `/settings/theme`.

**F11.E07 · Missing-backend features (3 parts)**

- `clients.bulkUpdate` procedure + UI bulk-action bar (~200-row cap).
- xlsx/csv import flow: client-side parsing via `xlsx` lib, dedup by phone+tenantId, row-level skip reasons. New `/clients/import` page.
- Public self-registration: `clients.selfRegister` (publicProcedure), `apps/landing/cadastro/[slug]` form, QR generator at `/clients/qr`.

**F11.E08 · Loyalty programme**

- New Prisma models `LoyaltyPoints` + `LoyaltyTransaction`. New `packages/business/loyalty/` context. Procedures: `loyalty.getBalance`, `getStatement`, `earnFromSale`, `redeem`. New page `/clients/[id]/loyalty`.

**F11.E09 · Demo mode + progressive onboarding**

- `Tenant.isDemo` + `demoResetAt` columns. `OnboardingProgress` ganha `hasFirstClient/Sale/Campaign` + `unlockedFeatures`.
- Procedures: `platform.getTenantBadge`, `resetDemo`, `getUnlockedFeatures`, `refreshUnlockedFeatures`. DEMO badge in the dashboard topbar; 🔒 hint on `/campaigns` when locked.

**F11.E10 · NPS post-delivery + promo card generator**

- New `NpsSurvey` model. 5 procedures (3 auth, 2 public). Public `/nps/[token]` form. NPS card on `/finance`.
- `platform.generatePromoCard` returns SVG 1080×1080 (4 templates: minimal/bold/festive/elegant). New page `/promo/new`.

**F11.E11 · Partial backend completion (1)**

- WhatsApp N1 deep link: `messaging.generateLink` with 7 PT-BR templates + `<WhatsappButton>` component.
- Campaign remarketing: `campaigns.createRemarketing` clones a campaign filtered by recipient status (NO_RECEIVE/NO_VIEW/NO_RESPONSE).
- Reactivation: `clients.flagInactive` detects clients past avgCycle×1.5.

**F11.E12 · Partial backend completion (2)**

- `sales.flagExpiringCashbacks` aggregates by client.
- 50 system message templates seeded (10 categories × 5 variations).
- AI button on `/campaigns/new` wired to `ai.generateCampaignText`.

**F11.E13 · Partial backend completion (3)**

- `schedule.buildRestockReminders` with real cycle (last 12 sales avg).
- `schedule.buildDateReminders` (birthday + client-anniversary + profession day).
- `logistics.getOrderedRoute` groups deliveries by neighbourhood (heuristic).

**F11.E14–E17 · Missing pages**

- 6 communication pages (`/tags`, `/messaging/quick-replies`, `/messaging/templates`, `/ai`, `/messaging/post-sale`, `/notifications`).
- 3 sales/settings pages (`/sales/returns`, `/settings/referral`, `/settings/plan`).
- 3 operation pages (`/clients/[id]/wishlist`, `/logistics`, `/logistics/route`).
- Public consultora landing (`apps/landing/[slug]`) with ISR + OG metadata.

**F11.E18 · Mobile offline + push**

- `apps/mobile/src/lib/offline-db.ts` — SQLite schema + sync queue.
- `apps/mobile/src/lib/sync.ts` — drain pending mutations on reconnect, last-write-wins.
- `apps/mobile/src/lib/push-notifications.ts` — Expo Push registration.
- New `PushDevice` model + `platform.registerPushToken` / `unregisterPushToken` procedures.

**F11.E19 · Test coverage**

- 5 new vitest suites for E07–E13 use-cases (138 tests passing, 0 failed).
- Two pre-existing test failures fixed (Input `role="alert"`, `generateShareLink` 8-char contract).

**F11.E20 · E2E Playwright**

- 5 golden-path specs in `e2e/golden-*.spec.ts` + shared `_helpers/auth.ts`.

**F11.E20.5 · UX polish (4 critical bugs)**

- Logout button in the dashboard topbar.
- `<AddClientModal>` reusable component wired to `/clients`.
- Wishlist + returns now use product/sale selectors instead of UUID raw inputs.
- Global `ToastProvider` + `useToast` hook for mutation feedback.

**F11.E21 · Performance audit**

- `@next/bundle-analyzer` + `web-vitals` deps. RUM reporter mounted in root layout.
- `FunnelChart` lazy-loaded via `next/dynamic`.
- `docs/PERFORMANCE.md` runbook (targets, bundle analyzer, Lighthouse, RUM).

**F11.E22 · Deploy runbook**

- `docs/DEPLOY.md` (env keys, staging/prod procedure, rollback).
- `docs/SMOKE_CHECKLIST.md` (post-deploy gates).

**F11.E23 · Checkpoint**

- Tag `v3.0.0-fase-11` (when prod smoke passes; see DEPLOY.md).
- `prompts/STATE.json` updated to `current_phase: 11, status: BUILD_COMPLETE`.

### Added (pré-F11)

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
