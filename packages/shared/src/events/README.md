# Domain events — publishing pattern (ACH-016)

The audit run `codigo-manutenibilidade/2026-04-18_21-45-58` flagged that
inter-module communication happens almost exclusively via direct calls
between use-cases. The outbox infrastructure exists in this package
(`outbox-service.ts`, `event-publisher.ts`) but business modules weren't
using it — which means refactoring one module ripples into N consumers.

This file documents the target pattern so new code follows it and old
code migrates gradually.

## Contract

Every state-changing use-case that is of interest to another module
publishes a single domain event. Events are:

1. **Past tense** and **module-prefixed**: `sale.confirmed`, `client.created`,
   `member.role.changed`. Never `sale.confirm` or `create-client` — event
   names describe facts, not commands.
2. **Idempotent** at consumption — each handler deals with retries using
   the event's `id`.
3. **Tenant-scoped** — `tenantId` is a first-class field, never implicit.

## How to publish (example)

```ts
// packages/business/sales/use-cases/confirm-sale.use-case.ts
import { publishEvent, EVENTS } from "@wbc/shared";
import type { SaleRepository } from "../ports/sale-repository";

export class ConfirmSale {
  constructor(private readonly repo: SaleRepository) {}

  async execute(input: { tenantId: string; saleId: string }): Promise<void> {
    const sale = await this.repo.updateStatus(
      input.tenantId,
      input.saleId,
      "CONFIRMED",
    );

    await publishEvent({
      type: EVENTS.SALE_CONFIRMED,
      tenantId: sale.tenantId,
      payload: {
        saleId: sale.id,
        clientId: sale.clientId,
        total: sale.total,
      },
    });
  }
}
```

## How to consume (example)

```ts
// packages/business/inventory/adapters/sale-confirmed-handler.ts
import { subscribe, EVENTS } from "@wbc/shared";

export function registerInventoryEventHandlers(): void {
  subscribe(EVENTS.SALE_CONFIRMED, async (event) => {
    const { saleId } = event.payload as { saleId: string };
    // ...update stock, write history, whatever
  });
}
```

## Known events (canonical list)

See `packages/shared/src/events/domain-event.ts` for the `EVENTS` constant.
Add entries there before publishing — never pass a raw string.

## Follow-up

- Audit each use-case in `packages/business/*/use-cases` and add a
  `publishEvent()` call at the right step (see the table below, tracked
  as follow-up to ACH-016).
- Add a workspace-wide lint rule that rejects cross-module imports
  between `packages/business/*/use-cases` — they must now go through
  events instead.

| Module    | Event to publish (minimum)                     |
| --------- | ---------------------------------------------- |
| sales     | `sale.confirmed`, `sale.cancelled`             |
| clients   | `client.created`, `client.converted_to_lead`   |
| inventory | `stock.adjusted`, `stock.below_threshold`      |
| catalog   | `product.created`, `product.price_changed`     |
| schedule  | `appointment.created`, `appointment.cancelled` |
| finance   | `payment.received`, `expense.recorded`         |
| messaging | `message.sent`, `message.failed`               |
| campaigns | `campaign.started`, `campaign.ended`           |
