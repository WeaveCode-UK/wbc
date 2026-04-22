import { subscribe, EVENTS, withIdempotentHandler } from "@wbc/shared";
import { ProcessedEventRepository } from "@wbc/db";
import { PrismaStockRepository } from "./prisma-stock-repository";
import { decrementStockForSale } from "../use-cases/manage-stock";

const stockRepo = new PrismaStockRepository();
const processedEvents = new ProcessedEventRepository();

const HANDLER_NAME = "inventory.sale-confirmed";

// ACH-002 confiabilidade-resiliencia: pilot wiring of handler-side
// idempotency. The outbox guarantees at-least-once delivery, so a
// retry after a partial crash would decrement stock twice. Claiming
// `(event.id, HANDLER_NAME)` in processed_events first makes the
// second delivery a no-op.
export function registerInventoryEventHandlers(): void {
  subscribe(EVENTS.SALE_CONFIRMED, async (event) => {
    await withIdempotentHandler(
      { eventId: event.id, handlerName: HANDLER_NAME },
      processedEvents,
      async () => {
        const payload = event.payload as {
          tenantId: string;
          items: Array<{ productId: string; quantity: number }>;
        };
        await decrementStockForSale(payload.tenantId, payload.items, stockRepo);
      },
    );
  });
}
