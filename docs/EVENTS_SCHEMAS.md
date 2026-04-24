# Events — catálogo e schemas

> Criado pelo follow-up pós-auditoria 2026-04-24 (cross-ref `apis-integracoes/ACH-014`). Complementa `docs/architecture/event-schemas.md` (mais técnico) com um **catálogo humano-legível** de todos os eventos do outbox.

## 1. Tipo de evento

Nome segue o padrão `module.action` (ex.: `sale.confirmed`). Breaking change requer nome novo: `module.action.v2`. Política completa em `docs/VERSIONING.md` seção 4.

Todos os tipos vivem em `packages/shared/src/events/domain-event.ts` (`EVENTS` const). Schemas Zod em `packages/shared/src/events/schemas.ts`.

## 2. Catálogo por módulo

### Auth / Tenant

| Type                  | Publicado por          | Consumido por                      | Payload mínimo                 |
| --------------------- | ---------------------- | ---------------------------------- | ------------------------------ |
| `tenant.created`      | `apps/web` signup flow | `apps/worker` onboarding processor | `{tenantId, ownerEmail}`       |
| `tenant.plan_changed` | `apps/web` admin       | analytics, messaging               | `{tenantId, oldPlan, newPlan}` |
| `tenant.deactivated`  | `apps/web` admin       | workers (cleanup jobs)             | `{tenantId, reason}`           |

### Clients

| Type                            | Publicado por              | Consumido por            | Payload mínimo                        |
| ------------------------------- | -------------------------- | ------------------------ | ------------------------------------- |
| `client.created`                | `clients.use-cases.create` | analytics                | `{tenantId, clientId}`                |
| `client.updated`                | `clients.use-cases.update` | —                        | `{tenantId, clientId, changedFields}` |
| `client.imported`               | import CSV                 | analytics                | `{tenantId, batchId, count}`          |
| `client.tagged`                 | tag mutation               | analytics                | `{tenantId, clientId, tagIds}`        |
| `client.classification_changed` | analytics recálculo        | messaging (post-sale)    | `{tenantId, clientId, from, to}`      |
| `client.going_inactive`         | analytics job              | messaging (reengagement) | `{tenantId, clientId, lastSeenAt}`    |

### Sales

| Type                  | Publicado por             | Consumido por                                           | Payload mínimo                              |
| --------------------- | ------------------------- | ------------------------------------------------------- | ------------------------------------------- |
| `sale.created`        | `sales.use-cases.create`  | —                                                       | `{tenantId, saleId, clientId}`              |
| `sale.confirmed`      | `sales.use-cases.confirm` | messaging (thank-you), inventory (decrement), analytics | `{tenantId, saleId, totalCents, clientId?}` |
| `sale.delivered`      | logistics update          | messaging (post-sale stage)                             | `{tenantId, saleId}`                        |
| `sale.cancelled`      | `sales.use-cases.cancel`  | inventory (restock), analytics                          | `{tenantId, saleId, reason}`                |
| `sale.status_changed` | genérico                  | —                                                       | `{tenantId, saleId, from, to}`              |

### Pagamentos

| Type                    | Publicado por                    | Consumido por                | Payload mínimo                    |
| ----------------------- | -------------------------------- | ---------------------------- | --------------------------------- |
| `payment.received`      | webhook MP                       | sales (marca paga), cashback | `{tenantId, saleId, amountCents}` |
| `payment.overdue`       | payment watcher                  | messaging (reminder)         | `{tenantId, saleId, daysOverdue}` |
| `payment.pix_generated` | `finance.use-cases.generate-pix` | messaging                    | `{tenantId, saleId, txnId}`       |

### Cashback

| Type                 | Publicado por            | Consumido por       | Payload mínimo                                 |
| -------------------- | ------------------------ | ------------------- | ---------------------------------------------- |
| `cashback.generated` | sale confirmed handler   | messaging (welcome) | `{tenantId, clientId, amountCents}`            |
| `cashback.expiring`  | cashback watcher (daily) | messaging           | `{tenantId, clientId, amountCents, expiresAt}` |
| `cashback.used`      | sales checkout           | analytics           | `{tenantId, clientId, saleId}`                 |

### Campaigns

| Type                         | Publicado por                | Consumido por           | Payload mínimo                                  |
| ---------------------------- | ---------------------------- | ----------------------- | ----------------------------------------------- |
| `campaign.created`           | `campaigns.use-cases.create` | —                       | `{tenantId, campaignId}`                        |
| `campaign.dispatched`        | launch button                | worker (fan-out BullMQ) | `{tenantId, campaignId, recipientCount}`        |
| `campaign.completed`         | worker (última msg enviada)  | analytics               | `{tenantId, campaignId, sentCount, errorCount}` |
| `campaign.recipient_replied` | WA webhook                   | analytics, reengagement | `{tenantId, campaignId, clientId}`              |

### Messaging

| Type                       | Publicado por    | Consumido por                                   | Payload mínimo                        |
| -------------------------- | ---------------- | ----------------------------------------------- | ------------------------------------- |
| `message.sent`             | whatsapp adapter | campaigns (CampaignRecipient.sentAt), analytics | `{tenantId, messageId, to, category}` |
| `message.failed`           | whatsapp adapter | DLQ alert                                       | `{tenantId, messageId, reason}`       |
| `postsale.stage_completed` | post-sale worker | analytics                                       | `{tenantId, saleId, stage}`           |

### Inventory

| Type                   | Publicado por          | Consumido por                | Payload mínimo                      |
| ---------------------- | ---------------------- | ---------------------------- | ----------------------------------- |
| `stock.low`            | inventory watcher      | messaging (alert consultora) | `{tenantId, productId, currentQty}` |
| `stock.depleted`       | sale confirmed handler | messaging (urgent)           | `{tenantId, productId}`             |
| `brand_order.received` | brand receive flow     | analytics                    | `{tenantId, brandOrderId}`          |

### Schedule

| Type                   | Publicado por             | Consumido por | Payload mínimo                     |
| ---------------------- | ------------------------- | ------------- | ---------------------------------- |
| `reminder.triggered`   | schedule cron             | messaging     | `{tenantId, reminderId, clientId}` |
| `appointment.upcoming` | schedule cron (24h antes) | messaging     | `{tenantId, appointmentId}`        |

### Team

| Type                 | Publicado por      | Consumido por  | Payload mínimo                   |
| -------------------- | ------------------ | -------------- | -------------------------------- |
| `team.member_added`  | invite accept flow | auth audit log | `{tenantId, accountId, role}`    |
| `team.task_created`  | team module        | messaging      | `{tenantId, taskId, assigneeId}` |
| `team.task_approved` | team module        | analytics      | `{tenantId, taskId}`             |

### AI

| Type                 | Publicado por    | Consumido por           | Payload mínimo                       |
| -------------------- | ---------------- | ----------------------- | ------------------------------------ |
| `ai.generation_used` | deepseek adapter | analytics, finops       | `{tenantId, promptHash, tokensUsed}` |
| `ai.limit_reached`   | deepseek adapter | messaging (upgrade CTA) | `{tenantId, limit, usage}`           |

### Logistics

| Type                 | Publicado por      | Consumido por  | Payload mínimo                     |
| -------------------- | ------------------ | -------------- | ---------------------------------- |
| `delivery.shipped`   | logistics tracking | messaging      | `{tenantId, saleId, trackingCode}` |
| `delivery.delivered` | logistics webhook  | sales (status) | `{tenantId, saleId}`               |

### FinOps (post-audit — custos-finops)

| Type                     | Publicado por      | Consumido por                    | Payload mínimo                                                                               |
| ------------------------ | ------------------ | -------------------------------- | -------------------------------------------------------------------------------------------- |
| `finops.ai_cost_warning` | CostBudgetService  | alertmanager route               | `{tenantId, provider, period, thresholdPct, accumulatedUsd, budgetUsd}`                      |
| `finops.ai_cost_blocked` | CostBudgetService  | alertmanager (critical)          | `{tenantId, provider, period, accumulatedUsd, budgetUsd}`                                    |
| `finops.message_billed`  | MessageBillingPort | whatsapp-cost-aggregation worker | `{tenantId, messageId, toPhoneRedacted, category, costUsd, sentAt, conversationAlreadyOpen}` |

## 3. Garantias

Todos os eventos herdam as seguintes garantias do outbox (ADR-003):

- **At-least-once delivery** — handler pode ser chamado ≥ 1x para o mesmo event.
- **Ordering dentro do mesmo tenant** — outbox SELECT ordena por `createdAt`; workers consomem em ordem (modulo concorrência).
- **Idempotência no consumer** — `ProcessedEvent.idempotencyKey` UNIQUE impede side-effect duplicado.
- **Transação atomic com o estado** — eventos são gravados no outbox dentro da mesma transação da mutation.

## 4. Política de payload

- `tenantId` **sempre presente** (isolamento multi-tenant).
- PII **nunca em plaintext** — phones/emails redigidos ou hashed (ver `packages/shared/src/redaction.ts`).
- Timestamps em ISO 8601 UTC (Zod `.datetime()`).
- IDs em UUIDv4 (Zod `.uuid()`).
- Money em **cents como integer** (`totalCents: number` — nunca `totalBRL: 12.34`).
- Enums com valores explícitos (nunca `number`).

## 5. Ciclo de vida de um evento

```
(1) Producer: INSERT OutboxEvent (status=PENDING) dentro da transação
(2) Worker poll: SELECT ... FOR UPDATE SKIP LOCKED
(3) Handler:
    - INSERT ProcessedEvent(idempotencyKey) -- UNIQUE guard
    - se primeira: executar side-effect
    - se duplicada: skip
(4) UPDATE OutboxEvent SET status=PROCESSED
```

Falha no passo 3 (5xx do provider externo, ex.):

```
(4') RetryPolicy exponential backoff; attempts++
(5) Após max attempts: status=DLQ
(6) docs/runbooks/dlq-replay.md gerencia recuperação
```

## 6. Adicionando novo evento

Checklist quando criar `module.action`:

- [ ] Adicionar constante em `EVENTS` (`packages/shared/src/events/domain-event.ts`).
- [ ] Seed do schema Zod em `packages/shared/src/events/schemas.ts`.
- [ ] Adicionar linha no catálogo acima (seção 2).
- [ ] Documentar consumidores (quem vai lidar? handler existe?).
- [ ] Se muda contrato existente: seguir `docs/VERSIONING.md` seção 4.
- [ ] Teste unitário validando payload contra schema.

## Referências

- Implementação: `packages/shared/src/events/`.
- Fluxos: `docs/architecture/flows.md`.
- Outbox: `docs/architecture/events.md` + ADR-003.
- Política de versionamento: `docs/VERSIONING.md`.

---

_Última revisão: 2026-04-24 · Próxima revisão esperada: 2026-07-24_
