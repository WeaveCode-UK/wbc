# Reliability Follow-up (audit `confiabilidade-resiliencia` run 2026-04-19_07-38-46)

Itens que a correção automatizada **semeou** mas precisam de continuidade humana. Cada seção aponta achado, o que já foi entregue e o que falta.

## ACH-002 — Idempotência por handler (processed_events)

**Entregue:**

- Migration `processed_events` (já vinda de dados-persistencia run 2026-04-18_23-03-36).
- `ProcessedEventRepository.claim()` (DB).
- `withIdempotentHandler()` helper (shared).
- Piloto: `packages/business/inventory/adapters/sale-confirmed-handler.ts` usando o wrapper.

**Falta:**

- Aplicar `withIdempotentHandler` nos demais handlers do outbox:
  - `packages/business/messaging/adapters/whatsapp-webhook-handler.ts`
  - `packages/business/finance/adapters/mercadopago-webhook-handler.ts`
  - Qualquer handler subscrito via `subscribe()` em packages/business/\*_/adapters/_-handler.ts
- Definir convenção para nome do handler (`<bounded-context>.<evento>`); manter consistente com `HANDLER_NAME` em inventory.
- Avaliar mudança para claim dentro da própria `tx` do handler (hoje é fora — ver comentário em `processed-event-repository.ts`).

## ACH-006 — Replay de DLQ

**Entregue:**

- Procedure tRPC `admin.dlq.replay` e `admin.dlq.list` (role ADMIN).
- CLI `scripts/dlq-replay.ts` (via pnpm).
- Log estruturado e métrica `wbc_dlq_events_total{queue}` ao marcar DLQ.

**Falta:**

- Rodar o CLI em staging antes de produção.
- Integrar alerta Prometheus sobre métrica nova (ver ACH-004 do domínio observabilidade-operacao).

## ACH-007 — Backpressure tRPC ↔ outbox

**Entregue:**

- Middleware `outboxBackpressureMiddleware` em `apps/api/src/trpc/outbox-backpressure-middleware.ts`.
- Poll de lag via cache em memória (sem query extra por request).
- Piloto aplicado em `sales.confirmSale` (ACH principal).

**Falta:**

- Expandir para todas as mutations geradoras de evento (campaigns.send, messaging.dispatch, schedule.create, etc.).
- Parametrizar threshold em ENV (hoje default 30000 ms).

## ACH-011 — Round-robin por tenant no claim

**Entregue:**

- Query raw com `DISTINCT ON (tenant_id)` em `claimPending` (variante condicional).

**Falta:**

- Benchmark comparativo versus claim FIFO simples em carga multi-tenant real.
- Conferir interação com índice `(status, createdAt)` vs `(status, tenantId, createdAt)`.

## ACH-013 — Retenção do outbox

**Entregue:**

- ENV `OUTBOX_RETENTION_DAYS` (default 30).
- `docs/RETENTION.md` documentando política.

**Falta:**

- Export para cold storage (S3 ou equivalente) — depende de decisão de infra (ver ACH-013 de infraestrutura-deploy-config quando rodar).

## ACH-014 — Template de adapter externo

**Entregue:**

- Classe base `packages/shared/src/adapters/external-adapter-template.ts` combinando timeout + retry + circuit + fallback.
- `docs/ADAPTERS.md` documentando convenção.

**Falta:**

- Converter stubs (MercadoPago, Resend) quando os contratos estiverem estáveis — decisão de produto.

## ACH-015 — Deadline/budget

**Entregue:**

- Helper `withDeadline(budgetMs, fn)` em `packages/shared/src/resilience/deadline.ts`.
- Piloto em `packages/business/messaging/adapters/whatsapp-n2-adapter.ts` (AbortSignal).

**Falta:**

- Propagar deadline via AsyncLocalStorage para que adapters encadeados respeitem orçamento do request de origem.

## ACH-016 — Load shedding adaptativo

**Entregue:**

- Stub `shouldShed(p95Ms): boolean` em `apps/api/src/trpc/rate-limit-middleware.ts` (desligado por padrão).

**Falta:**

- Coletar p95 do histograma Prometheus exposto por `apps/api/src/lib/metrics.ts` (depende de ACH-001 de observabilidade-operacao).
- Habilitar `shouldShed` via ENV `ADAPTIVE_SHEDDING=1`.

## ACH-017 — Coordenação entre circuit breakers

**Entregue:**

- `docs/runbooks/multi-provider-incident.md` com playbook manual.

**Falta:**

- Agregador central (feature flag ou serviço dedicado) — decisão de arquitetura.
