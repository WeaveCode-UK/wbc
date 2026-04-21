import { Prisma } from "@prisma/client";
import { prisma } from "../index";

// ACH-011 dados-persistencia: repository around the ProcessedEvent
// table. Handler-side dedup is a small surface — one insert, treat P2002
// as "already processed" — so a tiny repository is the right shape.
//
// The insert lives inside the handler's own transaction (passed via the
// optional `tx` parameter). If the handler can't enroll its side-effect
// in a tx (e.g. it's a network call), it should call `markProcessed`
// after the effect lands and accept the small at-most-once → at-least-
// once window that shift creates.

type TxOrPrisma = Prisma.TransactionClient | typeof prisma;

export class ProcessedEventRepository {
  /**
   * Returns `true` if the (eventId, handlerName) pair was freshly
   * inserted, `false` if the handler already processed this event.
   * Never throws on the unique-violation path.
   */
  async claim(
    eventId: string,
    handlerName: string,
    tx: TxOrPrisma = prisma,
  ): Promise<boolean> {
    try {
      await tx.processedEvent.create({
        data: { eventId, handlerName },
      });
      return true;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        return false;
      }
      throw err;
    }
  }
}
