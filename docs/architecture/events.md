# Catálogo de Eventos de Domínio

> Criado pelo ACH-004 da auditoria de arquitetura (run `2026-04-18_18-17-50`).
> Fonte canônica das constantes: `packages/shared/src/events/domain-event.ts`.

## Princípio

ADR-003 define que comunicação entre módulos `business/*` é **exclusivamente** por eventos assíncronos via outbox + BullMQ. Este catálogo mapeia cada evento para seus publishers, consumers e fila associada — é a fonte única de rastreabilidade cross-módulo.

Mantido manualmente. Ao adicionar/remover eventos, atualizar aqui no mesmo PR.

## Tabela de eventos

| Evento                          | Publisher     | Consumers                                             | Fila BullMQ | Descrição                      |
| ------------------------------- | ------------- | ----------------------------------------------------- | ----------- | ------------------------------ |
| `tenant.created`                | auth          | —                                                     | —           | Novo tenant criado             |
| `tenant.plan_changed`           | platform      | worker (invalida cache entitlements)                  | —           | Mudança de plano de tenant     |
| `tenant.deactivated`            | platform      | —                                                     | —           | Tenant desativado              |
| `client.created`                | clients       | messaging (auto-message boas-vindas)                  | messaging   | Cliente criado                 |
| `client.updated`                | clients       | —                                                     | —           | Cliente atualizado             |
| `client.imported`               | clients       | —                                                     | —           | Cliente importado em lote      |
| `client.tagged`                 | clients       | —                                                     | —           | Tag comercial aplicada         |
| `client.classification_changed` | analytics     | —                                                     | —           | Mudança de classe ABC          |
| `client.going_inactive`         | analytics     | messaging (reengajamento)                             | messaging   | Cliente virando inativo        |
| `sale.created`                  | sales         | —                                                     | —           | Venda em rascunho              |
| `sale.confirmed`                | sales         | inventory (baixa estoque), messaging (post-sale flow) | messaging   | Venda confirmada               |
| `sale.delivered`                | sales         | —                                                     | —           | Venda entregue                 |
| `sale.cancelled`                | sales         | —                                                     | —           | Venda cancelada                |
| `sale.status_changed`           | sales         | —                                                     | —           | Mudança de status              |
| `payment.received`              | sales/finance | —                                                     | —           | Pagamento recebido             |
| `payment.overdue`               | finance       | schedule (reminder), messaging (notificação)          | messaging   | Pagamento atrasado             |
| `payment.pix_generated`         | sales         | —                                                     | —           | PIX gerado                     |
| `cashback.generated`            | sales         | —                                                     | —           | Cashback gerado após venda     |
| `cashback.expiring`             | sales         | messaging (aviso cliente)                             | messaging   | Cashback prestes a expirar     |
| `cashback.used`                 | sales         | —                                                     | —           | Cashback aplicado              |
| `campaign.created`              | campaigns     | —                                                     | —           | Campanha criada                |
| `campaign.dispatched`           | campaigns     | —                                                     | campaigns   | Campanha despachada para envio |
| `campaign.completed`            | campaigns     | —                                                     | —           | Campanha finalizada            |
| `campaign.recipient_replied`    | messaging     | —                                                     | —           | Resposta recebida              |
| `message.sent`                  | messaging     | —                                                     | —           | Mensagem enviada com sucesso   |
| `message.failed`                | messaging     | DLQ                                                   | dlq         | Mensagem falhou após retries   |
| `postsale.stage_completed`      | messaging     | —                                                     | messaging   | Etapa do post-sale concluída   |
| `stock.low`                     | inventory     | schedule (reminder)                                   | schedule    | Estoque abaixo do mínimo       |
| `stock.depleted`                | inventory     | —                                                     | —           | Estoque esgotado               |
| `brand_order.received`          | inventory     | —                                                     | —           | Pedido de reposição recebido   |
| `reminder.triggered`            | schedule      | messaging (envia lembrete)                            | messaging   | Lembrete disparado             |
| `appointment.upcoming`          | schedule      | messaging (notifica)                                  | messaging   | Agendamento próximo            |
| `delivery.shipped`              | logistics     | —                                                     | —           | Entrega enviada                |
| `delivery.delivered`            | logistics     | —                                                     | —           | Entrega concluída              |
| `team.member_added`             | team          | —                                                     | —           | Membro adicionado              |
| `team.task_created`             | team          | —                                                     | —           | Tarefa criada                  |
| `team.task_approved`            | team          | —                                                     | —           | Tarefa aprovada                |
| `ai.generation_used`            | ai            | —                                                     | —           | Geração de IA usada (consumo)  |
| `ai.limit_reached`              | ai            | —                                                     | —           | Limite de IA atingido          |

**Total:** 38 eventos catalogados.

## Convenções

- **Naming:** `<dominio>.<acao_no_passado>`, minúsculo, separado por ponto.
- **Payload:** tipado em `packages/shared/src/events/domain-event.ts` via tipos `*Payload`.
- **Publisher:** usa `publish<PayloadType>(EVENTS.XYZ, tenantId, payload)` de `@wbc/shared`.
- **Consumer:** usa `subscribe(EVENTS.XYZ, async (event) => { ... })` de `@wbc/shared`.
- **Tenant context:** sempre incluído no envelope (`event.tenantId`).
- **Idempotência:** handlers devem ser idempotentes por `event.id` (at-least-once).
- **Fila BullMQ:** evento usa fila quando o processamento é custoso/paralelo. Eventos sem fila são consumidos inline pelo outbox processor.

## Regras para adicionar evento novo

1. Declarar constante em `packages/shared/src/events/domain-event.ts` (`EVENTS.XYZ`).
2. Declarar tipo de payload (`XYZPayload`).
3. Atualizar esta tabela com publisher, consumers e fila.
4. No publisher: chamar `publish<XYZPayload>(EVENTS.XYZ, tenantId, payload)` dentro de transação Prisma (garante outbox).
5. No consumer: `subscribe(EVENTS.XYZ, handler)` em `use-cases/` do módulo ou em `adapters/` se for handler.
6. Registrar o subscriber em `apps/worker/src/index.ts` (função `registerXxxEventHandlers`).

## Gap conhecido

Eventos marcados como "—" na coluna Consumers podem indicar que:
(a) o consumer existe mas não foi detectado na varredura automática, **ou**
(b) o evento é realmente publicado sem consumer — candidato a remoção ou reavaliação.

A próxima auditoria de `arquitetura` pode gerar um script estático que valida publisher↔consumer automaticamente.

## Links

- `packages/shared/src/events/domain-event.ts` — constantes + tipos de payload
- `packages/shared/src/events/outbox-service.ts` — publisher (writes to outbox)
- `packages/shared/src/events/event-subscriber.ts` — subscribe helper
- `apps/worker/src/processors/outbox-processor.ts` — processa outbox e dispatcha para filas BullMQ
- ADR-003 — Outbox Pattern + BullMQ
- ACH-004 — Auditoria de arquitetura
