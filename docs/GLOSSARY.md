# Glossário — WBC Platform

> Criado pelo ACH-010 da auditoria `documentacao-runbooks/runs/2026-04-19_21-26-25`. Fonte única para termos internos. Se um termo aparece no código ou em um doc mais de 2x, ele deveria estar aqui.

Ordem alfabética.

## ABC — Classificação de clientes

Método para segmentar clientes em A (mais lucrativos/engajados), B (médios) e C (marginais). Recalculado por worker analytics periodicamente. Módulo: `packages/business/analytics` + `packages/business/clients`.

## ACH — Achado de auditoria

Identificador sequencial (`ACH-001`, `ACH-012`, etc.) de um item registrado numa run de auditoria técnica. Cada domínio em `Auditoria/` tem sua própria numeração. Achados têm severidade (`critico` / `alto` / `medio` / `baixo` / `informativo`) e status (`aberto` → `confirmado` → `resolvido`). Ver `Auditoria/_framework/convencoes.md`.

## ADR — Architecture Decision Record

Documento curto (~1 página) em `docs/adr/NNN-titulo.md` registrando uma decisão arquitetural: contexto, alternativas consideradas, decisão, consequências. Status: `proposed` / `accepted` / `superseded`. Lista: `docs/adr/`.

## AsyncLocalStorage — Contexto de tenant

API Node.js usada para propagar `tenantId` implicitamente em toda a stack de execução (tRPC → use-case → adapter Prisma) sem ter que passar por parâmetro explícito. Wrapper em `packages/shared/src/context/tenant-context.ts`. Usado pelo middleware Prisma para automaticamente injetar `WHERE tenantId = ...`.

## BullMQ

Biblioteca de filas baseada em Redis. Usada em `apps/worker` para processar jobs assíncronos (envio de WhatsApp, campanhas, lembretes, analytics). Cada fila tem nome `wbc:<algo>` (ex.: `wbc:messaging`, `wbc:campaigns`). ADR-003.

## CAC — Custo de Aquisição de Cliente

Termo de unit economics em `docs/PRICING.md`. (Ainda) não instrumentado; calculado manualmente por marketing.

## Circuit breaker

Padrão de resiliência: após N falhas consecutivas numa dependência externa, o circuit "abre" e falha rápido (em vez de sobrecarregar o serviço quebrado). Implementação: `packages/shared/src/circuit-breaker.ts`. Usado em adapters de WA, DeepSeek, Resend. ADR-007.

## CODEOWNERS

Arquivo `.github/CODEOWNERS` que define quem deve revisar PRs tocando caminhos específicos. Aplicação enforçada via branch protection de `main`.

## Composition root

Local único onde o grafo de dependências é montado — no WBC é `apps/api/src/composition-root.ts` (parcial — ACH-003 codigo-manutenibilidade). Instancia adapters, injeta nos use-cases, devolve handlers tRPC prontos.

## COGS — Cost of Goods Sold

Custo variável por unidade vendida (no nosso caso, por tenant ativo). Descrito em `docs/PRICING.md` seção 3.

## CostBudgetService (pendente)

Serviço que controla o gasto mensal em USD por tenant × provider (DeepSeek/WhatsApp/Sentry). Interface seed em `packages/business/finops/ports/cost-budget-service.ts`; adapter real pendente (ACH-001 custos-finops).

## DLQ — Dead Letter Queue

Fila onde eventos outbox vão parar após esgotar tentativas de processamento. Status `status='DLQ'` em `OutboxEvent`. Replay manual via `docs/runbooks/dlq-replay.md`. Métrica: `wbc_dlq_events_total`.

## Hexagonal — Ports & Adapters

Padrão arquitetural onde o domínio (`domain/`) é puro e se comunica com o mundo externo por interfaces (`ports/`) implementadas por adapters (`adapters/`) — ex.: `ports/whatsapp-port.ts` implementado por `adapters/whatsapp-n2-adapter.ts`. ADR-001. Enforçado por `dependency-cruiser` no CI.

## Idempotência

Propriedade de uma operação que, quando reexecutada com os mesmos inputs, produz o mesmo resultado sem efeitos adicionais. Crítica no worker: handler usa `ProcessedEvent.idempotencyKey` (UNIQUE) para garantir que um evento não seja aplicado 2x. Cross-ref: `docs/architecture/api-idempotency.md`.

## Kill-switch

Feature flag de emergência que desliga uma integração paga (DeepSeek/WhatsApp/Sentry) em caso de cost spike. Constantes em `packages/shared/src/feature-flags.ts` (`KILL_SWITCH.*`). Runbook: `docs/FEATURE-FLAGS-FOLLOWUP.md#emergency-kill-switches`.

## LGPD

Lei Geral de Proteção de Dados (Brasil). Regula tratamento de PII — usado na justificativa de `docs/DATA_RETENTION_POLICY.md` e nos ACHs de `compliance-privacidade`.

## Lockfile integrity

Sha256 de `pnpm-lock.yaml` committado em `docs/integrity/lockfile.sha256`. Job CI `lockfile-integrity` compara; divergência quebra o build (ACH-009 supply-chain-dependencias).

## OTB — _termo não oficial, evitar._

Historicamente usado em alguns comentários referindo a "out-of-band" (ex.: notificações OTB). Preferir "async" ou "via outbox".

## Outbox pattern

Padrão transacional: `INSERT OutboxEvent` dentro da MESMA transação que grava o estado do negócio. Worker faz polling depois para publicar em BullMQ / providers externos. Garante **at-least-once delivery** mesmo em crash do worker. ADR-003. Impl: `packages/shared/src/events/outbox-service.ts` + `packages/db/src/outbox/prisma-outbox-repository.ts`.

## PII — Personally Identifiable Information

Dado que identifica um indivíduo (nome, telefone, CPF, email). Redação obrigatória em logs/Sentry via `packages/shared/src/redaction.ts` e `sentry-redaction.ts`. Cross-ref: `seguranca/ACH-008`, `compliance-privacidade`.

## RLS — Row-Level Security

Mecanismo Postgres que filtra rows baseado em role/context. WBC **não usa** RLS em produção (ADR-002 escolheu middleware Prisma + `tenantId`-obrigatório), mas testes de RLS existem como guarda (`docs/architecture/rls-testing.md`).

## RPO / RTO

Recovery Point Objective (quanto dado podemos perder) / Recovery Time Objective (quanto tempo para voltar). WBC: RPO ≤ 1h, RTO ≤ 4h. Fonte: `docs/DR-BACKUP-POLICY.md`. Validação via drill em `docs/runbooks/dr.md`.

## Run (auditoria)

Execução isolada de uma auditoria num domínio. Identificada por `YYYY-MM-DD_HH-mm-ss`. Cada run vive em `Auditoria/<dominio>/runs/<run_id>/`. Correções ficam em `runs/<run_id>/correcao/`. Ver `Auditoria/_framework/lifecycle.md`.

## SBOM — Software Bill of Materials

Inventário assinado de dependências do projeto. Gerado pelo job CI `docker-images.yml` via Syft (CycloneDX). Assinado com cosign keyless. ACH-005 supply-chain-dependencias.

## Tenant

Unidade de isolamento lógico — no WBC, uma consultora (ou equipe). Todo recurso tem `tenantId` UUID. Cross-tenant é **proibido** (enforçado por middleware Prisma). ADR-002.

## tRPC

Framework para APIs type-safe TypeScript end-to-end. Rotas em `apps/web/src/app/api/trpc/` (hoje — considera-se split para `apps/api` no futuro). Cliente no mobile consome via tipos compartilhados em `@wbc/shared`.

## Turborepo

Orquestrador de build para monorepo. Cacheia `lint`, `type-check`, `test`, `build` por workspace. Remote cache opcional via `TURBO_TOKEN` (ACH-009 custos-finops).

## WA — WhatsApp

Abreviação usada em código e docs. Sempre refere a Meta WhatsApp Cloud API (a Business API direta, não o app consumidor). Adapter: `packages/business/messaging/adapters/whatsapp-n2-adapter.ts`.

---

_Última revisão: 2026-04-24 · Próxima revisão esperada: 2026-07-24_
