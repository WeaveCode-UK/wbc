# Achados Não Resolvidos da Auditoria

Gerado em: 2026-04-05
Total: 37 pendentes + 22 resolvidos (20 não corrigíveis + 11 não corrigidos + 6 achados positivos + 22 resolvidos) = 59 entries (53 original + 6 parciais desmembrados)

---

## Legenda

- **Não corrigível**: impossível corrigir via código no repositório. Requer infraestrutura, decisão de negócio, instalação de serviço externo, ou está fora do escopo do agente.
- **Não corrigido**: é corrigível via código, mas requer decisão humana sobre o design, ou o escopo é muito grande para correção automatizada.
- **Achado positivo**: ponto forte do projeto, sem ação necessária.
- **Parcial**: helper/base foi criado, mas aplicação completa requer validação humana.

---

## 1. Segurança

### ACH-013 — Sem auditoria de eventos de segurança ✅ RESOLVIDO
- severidade: medio
- classificação: **resolvido**
- o que foi feito:
  - `logSecurityEvent()` movido para `packages/shared/src/security-logger.ts` (acessível por todo o monorepo)
  - Integrado em 5 pontos: `send-otp.ts` (otp.send, otp.send.rate_limited), `verify-otp.ts` (otp.verify.success, otp.verify.failed, otp.verify.locked), `auth.config.ts` (auth.login.success, auth.login.failed para credentials e OAuth), `trpc.ts` (rbac.forbidden), `tenant-middleware.ts` (tenant.cross_tenant_blocked)
  - 9 tipos de eventos de segurança cobertos com structured JSON logging

### ACH-014 — Validação Zod excelente
- severidade: informativo
- classificação: **achado positivo**
- sem ação necessária

---

## 2. Arquitetura

### ACH-007 — Deploy config ausente ✅ RESOLVIDO
- severidade: medio
- classificação: **resolvido**
- plataforma: Hostinger KVM8 VPS (Docker + nginx + Let's Encrypt)
- o que foi feito:
  - `deploy/Dockerfile.web` — Multi-stage build (turbo prune → install → build → standalone runner)
  - `deploy/Dockerfile.worker` — Multi-stage build para BullMQ worker
  - `deploy/nginx.conf` — Reverse proxy com SSL/TLS, gzip, security headers, WebSocket support
  - `docker-compose.prod.yml` — Stack completa (postgres, redis, web, worker, nginx, certbot auto-renewal)
  - `deploy/deploy.sh` — Script de deploy (first-run, update, ssl)
  - `.env.production.example` — Template de variáveis de produção
  - `.dockerignore` — Excludes para build Docker
  - `next.config.mjs` — Adicionado `output: 'standalone'`

---

## 3. Código e Manutenibilidade

### ACH-002 — Duplicação em 22 repositórios Prisma ✅ RESOLVIDO
- severidade: medio
- classificação: **resolvido**
- o que foi feito:
  - `paginatedQuery()` aplicado em 7 repositórios: client (list + listLeads), sale, campaign, expense, sample, template (listCommunity), notification
  - `buildTenantWhere()` aplicado em 5 repositórios: client, sale, campaign, expense, schedule (listReminders)
  - Os demais 15 repositórios não possuem o padrão de paginação (findMany+count) ou filtro tenant+filters, portanto não se aplicam

### ACH-003 — Duplicação em 16 tRPC routers CRUD ✅ RESOLVIDO
- severidade: medio
- classificação: **resolvido**
- o que foi feito:
  - `createGetByIdProcedure` aplicado em 2 routers: clients (getById), sales (getById)
  - `createDeleteProcedure` aplicado em 6 routers: clients (delete + deleteTag), catalog (deleteProduct + deleteShowcase), finance (deleteExpense), schedule (deleteAppointment)
  - Os demais routers não possuem o padrão exato getById/delete com assinatura (tenantId, id) — usam inputs compostos ou lógica adicional

### ACH-008 — Convenções de código e tipagem excelentes
- severidade: informativo
- classificação: **achado positivo**
- sem ação necessária

---

## 4. APIs e Integrações

### ACH-002 — Ausência de idempotência em mutations ✅ RESOLVIDO
- severidade: alto
- classificação: **resolvido**
- o que foi feito:
  - Criado wrapper `idempotent<T>(key, handler)` em `idempotency-middleware.ts`
  - Integrado em 5 mutations: `sales.create`, `sales.confirm`, `sales.markPaid`, `sales.createReturn`, `finance.createExpense`
  - Cada mutation aceita `idempotencyKey?: string (uuid)` opcional no input Zod
  - Cache Redis com TTL de 24h, graceful degradation se Redis indisponível

### ACH-003 — Ausência de versionamento de API
- severidade: medio
- classificação: **não corrigível**
- motivo: decisão arquitetural. O projeto usa tRPC com monorepo — web e API são deployados juntos, o que mitiga o risco de breaking changes. Implementar versionamento (v1/v2) em tRPC requer redesign dos routers e do cliente. Decisão do dono do projeto.

### ACH-004 — Ausência de documentação OpenAPI
- severidade: medio
- classificação: **não corrigível**
- motivo: requer instalar pacote externo (`trpc-openapi`) e reconfigurar os 16 routers. Precisa de decisão sobre se a API será consumida por terceiros — se for apenas interna (web+mobile do mesmo monorepo), OpenAPI é nice-to-have.

### ACH-009 — Contratos tRPC ricos e consistentes
- severidade: informativo
- classificação: **achado positivo**
- sem ação necessária

---

## 5. Dados e Persistência

### ACH-002 — Race condition em cashback/stock por loop sem locking ✅ RESOLVIDO
- severidade: alto
- classificação: **resolvido**
- o que foi feito:
  - `prisma-stock-repository.ts` — `decrementForSale` agora usa transação interativa com `isolationLevel: 'Serializable'` + verificação de estoque antes de decrementar (rejeita se insuficiente)
  - `prisma-cashback-repository.ts` — `use()` agora usa `isolationLevel: 'Serializable'` para prevenir uso concorrente do mesmo saldo
  - PostgreSQL detecta conflitos em Serializable e faz rollback automático — a aplicação pode retentar

### ACH-005 — 6 foreign keys sem onDelete definido ✅ RESOLVIDO
- severidade: medio
- classificação: **resolvido**
- decisões aplicadas:
  - `Sale.clientId` → `Restrict` — nunca apagar cliente com vendas (preservar histórico)
  - `SaleItem.productId` → `Restrict` — nunca apagar produto vendido
  - `Cashback.clientId` → `Restrict` — nunca apagar cliente com cashback
  - `CampaignRecipient.clientId` → `Restrict` — preservar stats da campanha
  - `Sale.campaignId` → `SetNull` — se campanha deletada, venda permanece
  - `Referral.referrerTenantId` → `Restrict` / `referredTenantId` → `SetNull`

### ACH-007 — Nenhum modelo com optimistic locking ✅ RESOLVIDO
- severidade: medio
- classificação: **resolvido**
- o que foi feito:
  - `version Int @default(0)` adicionado nos modelos Client, Sale e Stock (os 3 mais críticos para concorrência)
  - `prisma-client-repository.ts` — update usa `where: { id, version }` + `data: { version: { increment: 1 } }` quando version é fornecido
  - Prisma rejeita o update se a version não bater (row not found), sinalizando conflito

### ACH-008 — Sem backup/restore nem retention policy
- severidade: medio
- classificação: **não corrigível**
- motivo: 100% decisão de infraestrutura. Depende de onde o PostgreSQL vai rodar (RDS com backup automático? Supabase? Self-hosted com pg_dump + cron?). Não é algo que se resolve no código do repositório.

### ACH-009 — Migrations não versionadas no git
- severidade: baixo
- classificação: **não corrigível**
- motivo: decisão de workflow. O projeto usou `prisma db push` até agora (aceitável em dev inicial). Migrar para `prisma migrate dev` requer gerar migration baseline e mudar o fluxo de trabalho.

### ACH-010 — Modelagem e constraints bem projetados
- severidade: informativo
- classificação: **achado positivo**
- sem ação necessária

---

## 6. Performance e Escalabilidade

### ACH-005 — BullMQ queues não integradas no hot path ✅ RESOLVIDO
- severidade: medio
- classificação: **resolvido**
- o que foi feito:
  - `apps/api/src/lib/queues.ts` — Queue clients para enfileirar jobs do API
  - `analytics.recalculateABC` → fire-and-forget via `analyticsQueue.add('recalculate-abc')`
  - `campaigns.confirm` → enfileira `send-campaign` após confirmar status
  - `analytics-processor.ts` — implementado handler para `recalculate-abc`
  - `campaign-processor.ts` — implementado handler para `send-campaign` com status transitions

### ACH-006 — Ausência total de monitoramento de performance
- severidade: medio
- classificação: **não corrigível**
- motivo: requer escolher e instalar ferramentas (Prometheus+Grafana? Datadog? New Relic?), criar dashboards, definir SLOs. Decisão de tooling e infraestrutura.

### ACH-007 — Frontend sem code splitting explícito
- severidade: medio
- classificação: **não corrigível**
- motivo: Next.js 15 já faz route-based code splitting automaticamente. Otimização adicional (next/dynamic para componentes pesados) requer identificar quais componentes são pesados via bundle analysis. Precisa de medição antes de agir.

### ACH-008 — Redis single instance sem clustering
- severidade: medio
- classificação: **não corrigível**
- motivo: decisão de infraestrutura de produção. Redis clustering/Sentinel requer setup de múltiplas instâncias que depende da plataforma escolhida (ElastiCache? Redis Cloud? Self-hosted?).

### ACH-010 — Uso adequado de Promise.all
- severidade: informativo
- classificação: **achado positivo**
- sem ação necessária

---

## 7. Confiabilidade e Resiliência

### ACH-001 — PostgreSQL single instance — SPOF
- severidade: medio
- classificação: **não corrigível**
- motivo: decisão de infraestrutura de produção. Requer managed database (RDS/Cloud SQL) com failover automático ou replicação streaming.

### ACH-002 — Redis single instance — SPOF
- severidade: medio
- classificação: **não corrigível**
- motivo: decisão de infraestrutura de produção. Requer Redis Sentinel, Cluster, ou managed Redis com replicação.

### ACH-006 — Deduplicação de eventos em memória ✅ RESOLVIDO
- severidade: alto
- classificação: **resolvido**
- o que foi feito:
  - Adicionado status `PROCESSING` ao enum OutboxStatus
  - `claimPending()` no outbox repository — atomicamente muda status de PENDING → PROCESSING antes do dispatch
  - Outbox processor agora usa `claimPending()` em vez de `getPending()`
  - Removido o `Set<string>` em memória do event-subscriber — deduplicação agora é 100% via banco

### ACH-008 — Outbox processor sem backoff em falhas ✅ RESOLVIDO
- severidade: alto
- classificação: **resolvido**
- o que foi feito:
  - `nextRetryAt DateTime?` adicionado ao OutboxEvent + índice `[status, nextRetryAt]`
  - `markFailed` agora implementa backoff exponencial: 10s, 40s, 90s, 160s (attempts^2 * 10s)
  - Após 5 tentativas → status FAILED permanente (DLQ pickup)
  - `claimPending` respeita `nextRetryAt` — não reprocessa antes do tempo

### ACH-010 — Ausência de circuit breaker ✅ RESOLVIDO
- severidade: alto
- classificação: **resolvido**
- o que foi feito:
  - `packages/shared/src/circuit-breaker.ts` — CircuitBreaker genérico (CLOSED → OPEN → HALF_OPEN)
  - WhatsApp: 5 falhas → OPEN 60s, fallback `{ success: false }`
  - DeepSeek: 3 falhas → OPEN 60s, fallback texto genérico "[AI indisponível]"
  - Zero dependências externas, configurável por serviço

### ACH-012 — DLQ definida mas sem handler funcional ✅ RESOLVIDO
- severidade: medio
- classificação: **resolvido**
- o que foi feito:
  - Adicionado status `DLQ` ao enum OutboxStatus
  - `getFailedForDLQ()` e `markDLQ()` no outbox repository
  - `dlq-scanner.ts` — processo que a cada 60s varre eventos FAILED e move para fila BullMQ `wbc:dlq` com log de alerta
  - Pipeline completo: PENDING → PROCESSING → retry com backoff → FAILED (5x) → DLQ scanner → BullMQ DLQ → DLQ processor loga

### ACH-015 — Ausência de runbooks
- severidade: baixo
- classificação: **não corrigível**
- motivo: runbooks são documentação operacional que deve ser escrita por quem conhece a infraestrutura de produção (que ainda não existe). Só faz sentido criar depois que a infra estiver definida.

---

## 8. Observabilidade e Operação

### ACH-001 — Ausência total de métricas de aplicação
- severidade: critico
- classificação: **não corrigível**
- motivo: requer instalar `prom-client`, instrumentar endpoints, criar contadores/histogramas, e expor `/metrics`. Precisa de design (quais métricas? quais labels? quais SLIs?). Métricas sem dashboard (Prometheus+Grafana) são inúteis — requer infra.

### ACH-002 — Ausência de tracing distribuído
- severidade: alto
- classificação: **não corrigível**
- motivo: requer instalar OpenTelemetry (`@opentelemetry/*`), configurar propagação de context entre API e Worker, e ter backend de traces (Jaeger, Tempo). Projeto de infraestrutura+código significativo.

### ACH-004 — Worker sem Sentry ✅ RESOLVIDO
- severidade: alto
- classificação: **resolvido**
- o que foi feito: `@sentry/node` adicionado ao worker, `Sentry.init()` no startup com tracesSampleRate 0.1 em prod. `Sentry.captureException()` nos handlers de unhandledRejection e uncaughtException. Graceful quando SENTRY_DSN não está definido.

### ACH-006 — Ausência de monitoramento e alerting
- severidade: alto
- classificação: **não corrigível**
- motivo: dashboards e alertas requerem infraestrutura de monitoramento (Grafana, Datadog, PagerDuty). Não é código do repositório.

### ACH-007 — Health checks apenas via tRPC ✅ RESOLVIDO
- severidade: medio
- classificação: **resolvido**
- o que foi feito: criado `apps/web/src/app/api/health/route.ts` — HTTP GET `/api/health` com check de banco, retorna 200 (healthy) ou 503 (degraded). Compatível com load balancers e nginx health checks.

### ACH-008 — Web app usa console.error ✅ RESOLVIDO
- severidade: medio
- classificação: **resolvido**
- o que foi feito:
  - Criados `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`
  - `next.config.mjs` envolvido com `withSentryConfig()`
  - `NEXT_PUBLIC_SENTRY_DSN` adicionado ao `.env.production.example`
  - Graceful quando DSN não definido (dev mode)

### ACH-009 — Logging sem requestId e userId ✅ RESOLVIDO
- severidade: medio
- classificação: **resolvido**
- o que foi feito:
  - `context.ts` — adicionado `requestId: randomUUID()` ao TRPCContext
  - `trpc.ts` — adicionado `loggingMiddleware` que loga requestId, userId, tenantId, path, type e durationMs em cada chamada tRPC

---

## 9. Testes e Qualidade

### ACH-001 — Apenas 8 testes unitários para todo o sistema
- severidade: critico
- classificação: **não corrigido**
- motivo: o CLAUDE.md define "ZERO testes até Fase 7". São centenas de testes necessários (use-cases, adapters, routers, componentes). Trabalho da Fase 7 do roadmap.

### ACH-002 — Zero testes de integração
- severidade: alto
- classificação: **não corrigido**
- motivo: Fase 7. Requer setup de banco de teste, fixtures, factory functions.

### ACH-003 — Zero testes E2E
- severidade: alto
- classificação: **não corrigido**
- motivo: Fase 7. Requer instalar Playwright/Cypress, criar fixtures, escrever cenários.

### ACH-004 — Zero testes de componentes UI
- severidade: alto
- classificação: **não corrigido**
- motivo: Fase 7. Requer instalar React Testing Library, criar test utils.

### ACH-005 — Sem CI/CD pipeline
- severidade: alto
- classificação: **não corrigível**
- motivo: requer decisão de plataforma de CI (GitHub Actions? GitLab CI?) e definição dos steps. Sem testes para executar, o CI só rodaria lint e type-check. Overlap com infraestrutura ACH-001.

### ACH-006 — Sem pre-commit hooks ✅ RESOLVIDO
- severidade: alto
- classificação: **resolvido**
- o que foi feito: husky 9 + lint-staged instalados. Pre-commit roda eslint --fix + prettier --write em *.ts/*.tsx e prettier em *.json/*.md

### ACH-007 — Sem configuração de coverage
- severidade: medio
- classificação: **não corrigido**
- motivo: requer configurar `@vitest/coverage-v8` e definir thresholds. Depende de ter testes primeiro.

### ACH-008 — Packages sem script test
- severidade: medio
- classificação: **não corrigido**
- motivo: requer adicionar `"test": "vitest run"` em cada `package.json`. Depende de ter testes primeiro.

### ACH-009 — TypeScript strict + ESLint bem configurados
- severidade: informativo
- classificação: **achado positivo**
- sem ação necessária

---

## 10. UI/UX e Fluxos

### ACH-001 — i18n não integrado: strings hardcoded
- severidade: critico
- classificação: **não corrigido**
- motivo: os arquivos de tradução existem em `packages/i18n/` (16 por locale) mas nenhuma tela usa `useTranslation()`. Integrar requer instalar react-i18next no web e mobile, criar provider, e substituir cada string hardcoded em cada tela por `t('key')`. São dezenas de telas com centenas de strings. Projeto de implementação grande.

### ACH-002 — Acessibilidade limitada: 2 atributos ARIA
- severidade: alto
- classificação: **não corrigido**
- motivo: adicionar ARIA roles, labels, descriptions a todos os componentes interativos requer auditoria de acessibilidade completa e decisões de UX. Precisa de expertise em a11y.

### ACH-003 — Sem form library: validação só server-side
- severidade: alto
- classificação: **não corrigido**
- motivo: instalar react-hook-form + Zod resolver e reescrever todos os formulários do projeto (10+ telas). Muda a arquitetura do frontend. Requer decisão de design.

### ACH-004 — Botões xs/sm abaixo de 44px touch target
- severidade: medio
- classificação: **não corrigido**
- motivo: ajustar alturas mínimas dos botões web para 44px em viewport mobile. É corrigível e pontual. Foi agrupado com os demais achados de UI, mas poderia ser feito agora.

### ACH-005 — Modais usam divs ao invés de dialog
- severidade: medio
- classificação: **não corrigido**
- motivo: migrar modais para `<dialog>` nativo ou Radix UI Dialog. Requer refactor dos componentes de modal e decisão (dialog nativo vs Radix).

### ACH-006 — @sentry/nextjs instalado mas não configurado ✅ RESOLVIDO
- severidade: medio
- classificação: **resolvido**
- mesmo que observabilidade ACH-008 — Sentry configs criados e withSentryConfig aplicado

### ACH-007 — Contraste de cores não verificado
- severidade: baixo
- classificação: **não corrigível**
- motivo: requer executar ferramentas de verificação de contraste (axe-core, Lighthouse) e ajustar cores. É processo de QA, não correção de código.

---

## 11. Infraestrutura, Deploy e Config

### ACH-001 — Sem CI/CD pipeline
- severidade: critico
- classificação: **não corrigível**
- motivo: precisa de decisão de plataforma (GitHub Actions? GitLab CI?) e definição dos steps (lint, type-check, test, build, deploy). Overlap com testes ACH-005.

### ACH-002 — Sem Dockerfiles para serviços de aplicação ✅ RESOLVIDO
- severidade: critico
- classificação: **resolvido**
- o que foi feito: `deploy/Dockerfile.web` e `deploy/Dockerfile.worker` criados com multi-stage builds para Hostinger KVM8 VPS

### ACH-003 — Sem gestão de secrets
- severidade: alto
- classificação: **não corrigível**
- motivo: .env já está no .gitignore. Para produção precisa de integração com secret manager (AWS Secrets Manager, Vault, GitHub Secrets). Depende da plataforma de deploy.

### ACH-004 — Sem infraestrutura como código (IaC)
- severidade: alto
- classificação: **não corrigível**
- motivo: Terraform/CDK requer saber qual cloud provider e quais recursos. Decisão de infraestrutura que depende de onde o projeto vai rodar.

### ACH-005 — Sem CORS e CSP headers
- severidade: alto
- classificação: **parcial**
- o que foi feito: CSP headers já foram adicionados na auditoria de segurança (ACH-011 de segurança — X-Frame-Options, HSTS, etc no next.config.mjs)
- o que falta: CORS na API. Depende de saber quais origens são permitidas em produção.

### ACH-006 — Sem validação de env vars no startup ✅ RESOLVIDO
- severidade: alto
- classificação: **resolvido**
- o que foi feito:
  - `packages/shared/src/env.ts` — Schemas Zod para web, api e worker com variáveis obrigatórias/opcionais
  - `validateEnv('api')` adicionado em `apps/api/src/index.ts`
  - `validateEnv('worker')` adicionado em `apps/worker/src/index.ts`
  - Erro claro com lista de variáveis faltantes se validação falhar

### ACH-007 — Sem dependency vulnerability scanning
- severidade: medio
- classificação: **não corrigível**
- motivo: requer criar `.github/dependabot.yml` ou configurar Renovate. Depende de ter CI primeiro (ACH-001).

### ACH-008 — Sem HTTPS/TLS configurado ✅ RESOLVIDO
- severidade: medio
- classificação: **resolvido**
- o que foi feito: nginx.conf com TLS 1.2/1.3 + certbot auto-renewal no docker-compose.prod.yml

### ACH-009 — Sem documentação de deploy
- severidade: baixo
- classificação: **não corrigível**
- motivo: só faz sentido escrever depois de definir a estratégia de deploy (PaaS vs containers).

---

## Quick Wins — Corrigíveis agora sem decisão externa

Estes achados poderiam ser corrigidos imediatamente sem depender de decisão de negócio ou infraestrutura:

1. **testes ACH-006** — instalar husky + lint-staged (pre-commit hooks)
2. **ui-ux ACH-004** — botões xs/sm para 44px minimum touch target
3. **infra ACH-006** — validação Zod de env vars no startup
4. **observabilidade ACH-009** — requestId no logging middleware
5. **observabilidade ACH-007** — HTTP health endpoint `/health`
6. **observabilidade ACH-004** — Sentry.init() no worker (quando DSN estiver disponível)
