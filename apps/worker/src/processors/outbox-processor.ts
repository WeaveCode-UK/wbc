import { PrismaOutboxRepository } from "@wbc/db";
import {
  dispatch,
  logIfInvalidEventPayload,
  withTenant,
  type EventType,
} from "@wbc/shared";
import { logger } from "../lib/logger";

const outboxRepo = new PrismaOutboxRepository();
const BATCH_SIZE = 50;

export async function processOutbox(): Promise<void> {
  const events = await outboxRepo.claimPending(BATCH_SIZE);

  for (const event of events) {
    try {
      // ACH-011 apis-integracoes: re-validate on the consumer side. Schemas
      // drift between deploys (new field at publish, older worker reading
      // it) — we want that drift in logs, not a cryptic runtime cast error
      // downstream. Warn-only during the migration; see schemas.ts.
      logIfInvalidEventPayload(event.type as EventType, event.payload);

      await withTenant(event.tenantId, async () => {
        await dispatch({
          id: event.id,
          type: event.type,
          tenantId: event.tenantId,
          payload: event.payload,
        });
      });
      await outboxRepo.markProcessed(event.id);
      logger.info(
        { eventId: event.id, type: event.type, tenantId: event.tenantId },
        "Outbox event processed",
      );
    } catch (error) {
      logger.error(
        { eventId: event.id, type: event.type, error },
        "Failed to process outbox event",
      );
      await outboxRepo.markFailed(event.id);
    }
  }
}
