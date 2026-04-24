# WBC Platform

<!-- ACH-017 documentacao-runbooks: badges são placeholders; os URLs reais dependem do GitHub Actions habilitado com permissões de leitura pública. Atualizar quando disponível. -->

[![CI](https://github.com/WeaveCode-UK/wbc/actions/workflows/ci.yml/badge.svg)](https://github.com/WeaveCode-UK/wbc/actions/workflows/ci.yml)
[![Docker Images](https://github.com/WeaveCode-UK/wbc/actions/workflows/docker-images.yml/badge.svg)](https://github.com/WeaveCode-UK/wbc/actions/workflows/docker-images.yml)
[![License](https://img.shields.io/badge/license-proprietary-lightgrey)](./LICENSE)

**WBC Platform** (Wave Beauty Consultant) é o CRM vertical multi-tenant da **WeaveCode Ltd (UK)** para consultoras de beleza no Brasil.

Monorepo TypeScript com arquitetura hexagonal, comunicação entre módulos via eventos assíncronos (BullMQ + outbox pattern), multi-tenant por `tenantId`, i18n completo (pt-BR / en).

## Stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind + shadcn/ui.
- **Mobile:** React Native 0.81 via Expo.
- **Landing:** SSG em Next.js.
- **Backend:** Node.js 20.18, tRPC 11, Prisma + PostgreSQL.
- **Workers:** BullMQ + Redis.
- **Orquestração:** Turborepo + pnpm workspaces.
- **Observabilidade:** Prometheus + Grafana + Alertmanager + Sentry.
- **Auth:** next-auth (credentials + OTP via WhatsApp).

## Quickstart

### Pré-requisitos

- Node.js `>=20.18.1` (ver `.nvmrc`).
- pnpm `9.15.4`.
- Docker + Docker Compose (Postgres + Redis).

### Setup

```bash
# 1. Instalar deps (o postinstall roda `husky` para instalar git hooks)
pnpm install

# 2. Subir Postgres + Redis locais
docker compose up -d postgres redis

# 3. Gerar Prisma client e rodar migrations
pnpm db:generate
pnpm db:migrate

# 4. (Opcional) Seed de dados
pnpm db:seed

# 5. Subir web + api + worker em paralelo
pnpm dev
```

O `apps/web` fica em `http://localhost:3000`. Veja `docs/DEVELOPMENT.md` para fluxo de trabalho local e dicas (parar stack fora do expediente, cron opcional em VPS).

### Scripts úteis

| Script               | Propósito                                                            |
| -------------------- | -------------------------------------------------------------------- |
| `pnpm dev`           | Sobe web + api + worker via Turborepo.                               |
| `pnpm build`         | Build de produção de todos os workspaces.                            |
| `pnpm lint`          | ESLint em todos os workspaces.                                       |
| `pnpm type-check`    | `tsc --noEmit` em todos os workspaces.                               |
| `pnpm test`          | Vitest (unit).                                                       |
| `pnpm test:e2e`      | Playwright (end-to-end).                                             |
| `pnpm arch:check`    | Dependency-cruiser enforcing ADR-001 (hexagonal).                    |
| `pnpm license:check` | Allowlist de licenças (MIT/Apache/BSD/ISC; ver `docs/LICENSING.md`). |
| `pnpm db:generate`   | Gera Prisma client em todos os workspaces que dependem.              |
| `pnpm db:migrate`    | Migração Prisma em dev.                                              |
| `pnpm format`        | Prettier em todo o repo.                                             |

## Documentação

### Decisões e arquitetura

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — camadas (domain, adapters, use-cases), módulos, apps.
- [`docs/architecture/events.md`](docs/architecture/events.md) — outbox, schemas, idempotency.
- [`docs/architecture/flows.md`](docs/architecture/flows.md) — diagramas de sequência dos fluxos críticos.
- [`docs/GLOSSARY.md`](docs/GLOSSARY.md) — termos internos (outbox, tenant, DLQ, ACH, ADR…).
- [`docs/adr/`](docs/adr/) — 8 Architecture Decision Records.

### Operações

- [`docs/OPERATIONS.md`](docs/OPERATIONS.md) — **índice central de runbooks** (ver aqui em incidente).
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deploy prod/staging, failover, DR overview.
- [`docs/DR-BACKUP-POLICY.md`](docs/DR-BACKUP-POLICY.md) — RPO/RTO, política de backup off-site.
- [`docs/runbooks/`](docs/runbooks/) — runbooks por incidente (outbox-lag, DLQ, worker scaling…).
- [`docs/DATA_RETENTION_POLICY.md`](docs/DATA_RETENTION_POLICY.md) — LGPD + custo de storage.

### Governança

- [`CONTRIBUTING.md`](CONTRIBUTING.md) — commits, PRs, branches, política de review.
- [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) — Contributor Covenant 2.1.
- [`SECURITY.md`](SECURITY.md) — canal de divulgação, SLA, safe-harbor.
- [`CHANGELOG.md`](CHANGELOG.md) — histórico de releases.
- [`docs/PRICING.md`](docs/PRICING.md) — planos, COGS, unit economics (interno).

### Orquestração autônoma (específico do projeto)

- [`begin/WBC_ORCHESTRATOR.md`](begin/WBC_ORCHESTRATOR.md) — ponto de entrada da execução autônoma por IA.
- [`begin/WBC_REGRAS_INVIOLAVEIS.md`](begin/WBC_REGRAS_INVIOLAVEIS.md) — contrato de execução.
- [`begin/WBC_FASES_E_EPICOS.md`](begin/WBC_FASES_E_EPICOS.md) — roadmap de 7 fases.

### Auditoria

O diretório [`Auditoria/`](Auditoria/) contém o histórico de auditorias técnicas por domínio (15 domínios oficiais — segurança, arquitetura, apis, etc.). Cada run tem metadata, achados e relatório final arquivados. Correções ficam em `runs/<id>/correcao/`.

## Fluxo de desenvolvimento

1. **Branch** a partir de `main`: `feat/<short-name>`, `fix/<short-name>`, `chore/<short-name>`, `docs/<short-name>`.
2. **Commits** no formato Conventional Commits em inglês (`feat: add …`, `fix: correct …`, `chore: update …`).
3. **PR** com descrição clara, checklist de testes, link para a issue ou ADR se aplicável.
4. **Review** obrigatório do CODEOWNERS (veja `.github/CODEOWNERS`).
5. **Merge** após CI verde (lint, type-check, test, secret-scan, license-scan, security-audit, lockfile-integrity).

Detalhes em [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Licença

Proprietário, © WeaveCode Ltd (UK). Reprodução ou distribuição sem autorização expressa é vedada.

---

_Última revisão: 2026-04-24 · Próxima revisão esperada: 2026-07-24_
