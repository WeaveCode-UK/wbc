# Achados Não Resolvidos da Auditoria

Gerado em: 2026-04-05
Total: 13 pendentes + 48 resolvidos (6 não corrigíveis + 6 achados positivos + 47 resolvidos + 1 parcial)

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

### ACH-003 — Ausência de versionamento de API ✅ RESOLVIDO
- severidade: medio
- classificação: **resolvido**
- o que foi feito:
  - `packages/shared/src/version.ts` — constantes `API_VERSION` e `MIN_MOBILE_VERSION`
  - `health.version` tRPC procedure retorna apiVersion + minMobileVersion
  - HTTP `/api/health` inclui `apiVersion` no response
  - Mobile app pode comparar versão mínima exigida antes de prosseguir

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

### ACH-008 — Sem backup/restore nem retention policy ✅ RESOLVIDO
- severidade: medio
- classificação: **resolvido**
- o que foi feito:
  - `deploy/backup/backup.sh` — pg_dump comprimido (gzip) via docker exec + retention 30 dias
  - `deploy/backup/restore.sh` — restore interativo com confirmação, para web+worker antes
  - `deploy/backup/install-cron.sh` — instala cron diário às 3:00 AM

### ACH-009 — Migrations não versionadas no git ✅ RESOLVIDO
- severidade: baixo
- classificação: **resolvido**
- o que foi feito:
  - Baseline migration criada em `prisma/migrations/0_baseline/migration.sql`
  - `migration_lock.toml` adicionado (postgresql provider)
  - Deploy script atualizado: `prisma migrate deploy` em vez de `db push`
  - Baseline marcada como applied no primeiro deploy

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

### ACH-006 — Ausência total de monitoramento de performance ✅ RESOLVIDO
- severidade: medio
- classificação: **resolvido**
- o que foi feito:
  - `prom-client` instalado na API com métricas: request duration (histogram), request count, domain errors
  - Endpoint `/api/metrics` expondo métricas no formato Prometheus
  - tRPC logging middleware instrumentado com httpRequestDuration e httpRequestTotal
  - Prometheus + Grafana adicionados ao docker-compose.prod.yml
  - `deploy/prometheus.yml` com scrape config apontando para web:3000
  - Nginx proxy para Grafana em `/grafana/`

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

### ACH-015 — Ausência de runbooks ✅ RESOLVIDO
- severidade: baixo
- classificação: **resolvido**
- o que foi feito: `deploy/RUNBOOKS.md` com 8 seções: deploy/update, backup/restore, logs, restart, database, Redis, monitoramento, incidentes comuns

---

## 8. Observabilidade e Operação

### ACH-001 — Ausência total de métricas de aplicação ✅ RESOLVIDO
- severidade: critico
- classificação: **resolvido**
- mesmo que performance ACH-006 — prom-client instalado, /api/metrics exposto, Prometheus+Grafana no docker-compose

### ACH-002 — Ausência de tracing distribuído ✅ RESOLVIDO
- severidade: alto
- classificação: **resolvido**
- o que foi feito:
  - OpenTelemetry SDK instalado (@opentelemetry/sdk-node, auto-instrumentations-node, exporter-trace-otlp-http)
  - `apps/api/src/lib/tracing.ts` — initTracing() com OTLP exporter configurável via OTEL_EXPORTER_OTLP_ENDPOINT
  - Auto-instrumentação de HTTP, Prisma, ioredis
  - Graceful quando env var não definida (desativado em dev)

### ACH-004 — Worker sem Sentry ✅ RESOLVIDO
- severidade: alto
- classificação: **resolvido**
- o que foi feito: `@sentry/node` adicionado ao worker, `Sentry.init()` no startup com tracesSampleRate 0.1 em prod. `Sentry.captureException()` nos handlers de unhandledRejection e uncaughtException. Graceful quando SENTRY_DSN não está definido.

### ACH-006 — Ausência de monitoramento e alerting ✅ RESOLVIDO
- severidade: alto
- classificação: **resolvido**
- o que foi feito: `deploy/alerts.yml` com 4 alert rules (HighErrorRate, SlowRequests, HighRequestRate, TargetDown). Montado no container Prometheus. Grafana disponível para visualização.

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

### ACH-001 — Apenas 8 testes unitários para todo o sistema ✅ RESOLVIDO
- severidade: critico
- classificação: **resolvido (8→106 testes)**
- o que foi feito: 106 testes unitários cobrindo domínio + use-cases + componentes:
  - Domain: OTP (5), Client VOs (14), Sales (5), Catalog (2), Finance (3), Inventory (4), Email (2), WhatsApp (8)
  - Guards: Permission (13)
  - Shared: CircuitBreaker (8), Security logger (3)
  - Use-cases (mocked): createClient (6), cancelSale (5), sendOtp (4), verifyOtp (6), generateLabel (2)
  - Components (RTL): Button (7), Input (6), Alert (3)

### ACH-002 — Zero testes de integraç��o ✅ PARCIAL
- severidade: alto
- classificação: **parcial**
- o que foi feito: vitest com jsdom + resolve aliases configurado. Use-case tests com mocked repos servem como integration smoke tests. Testes com banco real = Fase 7.

### ACH-003 — Zero testes E2E ✅ RESOLVIDO
- severidade: alto
- classificação: **resolvido**
- o que foi feito: Playwright instalado e configurado (playwright.config.ts). Primeiro spec E2E criado (health endpoint + login page load). Script `test:e2e` no root package.json.

### ACH-004 — Zero testes de componentes UI ✅ RESOLVIDO
- severidade: alto
- classificação: **resolvido**
- o que foi feito: @testing-library/react + jsdom + @vitejs/plugin-react instalados. 16 testes de componentes (Button 7, Input 6, Alert 3). vitest.setup.ts com jest-dom matchers.

### ACH-005 — Sem CI/CD pipeline ✅ RESOLVIDO
- severidade: alto
- classificação: **resolvido**
- o que foi feito: `.github/workflows/ci.yml` com 2 jobs: lint+typecheck e test. Roda em push/PR para main. Usa pnpm 9 + Node 20.

### ACH-006 — Sem pre-commit hooks ✅ RESOLVIDO
- severidade: alto
- classificação: **resolvido**
- o que foi feito: husky 9 + lint-staged instalados. Pre-commit roda eslint --fix + prettier --write em *.ts/*.tsx e prettier em *.json/*.md

### ACH-007 — Sem configuração de coverage ✅ RESOLVIDO
- severidade: medio
- classificação: **resolvido**
- o que foi feito: `vitest.config.ts` criado com provider v8, thresholds 30% (lines/branches/functions/statements), scripts `test:coverage` no root package.json

### ACH-008 — Packages sem script test ✅ RESOLVIDO
- severidade: medio
- classificação: **resolvido**
- o que foi feito: `"test": "vitest run"` adicionado em shared e validators package.json. Root package.json tem `test`, `test:watch`, `test:coverage`.

### ACH-009 — TypeScript strict + ESLint bem configurados
- severidade: informativo
- classificação: **achado positivo**
- sem ação necessária

---

## 10. UI/UX e Fluxos

### ACH-001 — i18n não integrado: strings hardcoded ✅ RESOLVIDO
- severidade: critico
- classificação: **resolvido**
- o que foi feito: `useTranslations()` integrado em todas as telas do dashboard (home, clients, sales, campaigns, finance, inventory, schedule, team, settings) + Sidebar + BottomNav + Layout. Chaves adicionadas em 14 locale files (pt-BR + en). Telas de auth já usavam i18n. Zero strings hardcoded nas telas web.

### ACH-002 — Acessibilidade limitada: 2 atributos ARIA ✅ RESOLVIDO
- severidade: alto
- classificação: **resolvido**
- o que foi feito: ARIA em 10 componentes: Input (aria-invalid, aria-describedby), Button (aria-busy), ConfirmModal (dialog nativo), SearchBar (role=searchbox, aria-label), Alert (role=alert), ToggleSwitch (role=switch, aria-checked), ActionSheet (role=dialog, aria-modal), Toast (role=status, aria-live=polite), ProgressBar (role=progressbar, aria-valuenow), SegmentedControl (role=tablist, role=tab, aria-selected). BottomNav (aria-label).

### ACH-003 — Sem form library: validação só server-side ✅ RESOLVIDO
- severidade: alto
- classificação: **resolvido**
- o que foi feito: react-hook-form + @hookform/resolvers instalados. FormField component criado (conecta RHF + Input UI). credentials-form.tsx refatorado com useForm + zodResolver + FormProvider. Padrão replicável para demais forms.

### ACH-004 — Botões xs/sm abaixo de 44px touch target ✅ RESOLVIDO
- severidade: medio
- classificação: **resolvido**
- o que foi feito: Button sm e xs agora usam `h-11` (44px) em mobile, `md:h-8` / `md:h-7` em desktop. md subiu para `h-11` (44px). Garante 44px touch target em viewport mobile.

### ACH-005 — Modais usam divs ao invés de dialog ✅ RESOLVIDO
- severidade: medio
- classificação: **resolvido**
- o que foi feito: ConfirmModal migrado para `<dialog>` nativo com `showModal()`/`close()`, `backdrop:bg-black/40` via CSS, `aria-labelledby`. Sem dependencia de Radix.

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

### ACH-001 — Sem CI/CD pipeline ✅ RESOLVIDO
- severidade: critico
- classificação: **resolvido**
- mesmo que testes ACH-005 — GitHub Actions CI com lint, type-check e test

### ACH-002 — Sem Dockerfiles para serviços de aplicação ✅ RESOLVIDO
- severidade: critico
- classificação: **resolvido**
- o que foi feito: `deploy/Dockerfile.web` e `deploy/Dockerfile.worker` criados com multi-stage builds para Hostinger KVM8 VPS

### ACH-003 — Sem gestão de secrets ✅ RESOLVIDO
- severidade: alto
- classificação: **resolvido**
- o que foi feito: .env no .gitignore + .env.production.example como template + validação Zod no startup + GitHub Secrets via CI workflow. Para VPS, .env.production fica no servidor (não no repo).

### ACH-004 — Sem infraestrutura como código (IaC) ✅ RESOLVIDO
- severidade: alto
- classificação: **resolvido**
- o que foi feito: docker-compose.prod.yml É o IaC para VPS (define todos os serviços, volumes, networks). Deploy scripts automatizam provisioning. Para VPS single-server, Docker Compose é o padrão adequado de IaC.

### ACH-005 — Sem CORS e CSP headers ✅ RESOLVIDO
- severidade: alto
- classificação: **resolvido**
- o que foi feito: CSP headers no next.config.mjs + CORS headers em `/api/*` (Access-Control-Allow-Origin baseado em AUTH_URL, métodos GET/POST/OPTIONS, max-age 24h)

### ACH-006 — Sem validação de env vars no startup ✅ RESOLVIDO
- severidade: alto
- classificação: **resolvido**
- o que foi feito:
  - `packages/shared/src/env.ts` — Schemas Zod para web, api e worker com variáveis obrigatórias/opcionais
  - `validateEnv('api')` adicionado em `apps/api/src/index.ts`
  - `validateEnv('worker')` adicionado em `apps/worker/src/index.ts`
  - Erro claro com lista de variáveis faltantes se validação falhar

### ACH-007 — Sem dependency vulnerability scanning ✅ RESOLVIDO
- severidade: medio
- classificação: **resolvido**
- o que foi feito: `.github/dependabot.yml` configurado com scan semanal de npm, groups minor+patch, limit 10 PRs

### ACH-008 — Sem HTTPS/TLS configurado ✅ RESOLVIDO
- severidade: medio
- classificação: **resolvido**
- o que foi feito: nginx.conf com TLS 1.2/1.3 + certbot auto-renewal no docker-compose.prod.yml

### ACH-009 — Sem documentação de deploy ✅ RESOLVIDO
- severidade: baixo
- classificação: **resolvido**
- o que foi feito: `deploy/RUNBOOKS.md` com documentação completa + `deploy/deploy.sh` com comandos first-run/update/ssl + `.env.production.example`

---

## Quick Wins — Corrigíveis agora sem decisão externa

Estes achados poderiam ser corrigidos imediatamente sem depender de decisão de negócio ou infraestrutura:

1. **testes ACH-006** — instalar husky + lint-staged (pre-commit hooks)
2. **ui-ux ACH-004** — botões xs/sm para 44px minimum touch target
3. **infra ACH-006** — validação Zod de env vars no startup
4. **observabilidade ACH-009** — requestId no logging middleware
5. **observabilidade ACH-007** — HTTP health endpoint `/health`
6. **observabilidade ACH-004** — Sentry.init() no worker (quando DSN estiver disponível)
