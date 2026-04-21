import { Prisma } from "@prisma/client";
import { prisma } from "../index";
import type { DomainEvent } from "@wbc/shared";
import type { OutboxPort } from "@wbc/shared/events";

export class PrismaOutboxRepository implements OutboxPort {
  async save(event: DomainEvent): Promise<void> {
    await prisma.outboxEvent.create({
      data: {
        type: event.type,
        tenantId: event.tenantId,
        payload: event.payload as object,
      },
    });
  }

  async saveBatch(events: DomainEvent[]): Promise<void> {
    await prisma.outboxEvent.createMany({
      data: events.map((e) => ({
        type: e.type,
        tenantId: e.tenantId,
        payload: e.payload as object,
      })),
    });
  }

  async getPending(limit: number) {
    return prisma.outboxEvent.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: { id: true, type: true, tenantId: true, payload: true },
    });
  }

  async claimPending(limit: number) {
    // ACH-002 dados-persistencia: atomic claim via `FOR UPDATE SKIP LOCKED`.
    // The previous implementation (`findMany` → `updateMany`) had a race
    // window: two workers could select the same row in step 1 before
    // either completed step 2, and end up dispatching the same event
    // twice. `FOR UPDATE SKIP LOCKED` has Postgres skip rows another
    // transaction is already holding, so concurrent workers pick up
    // disjoint batches by construction.
    //
    // The RETURNING clause pulls the payload in the same round-trip, so
    // no second findMany is needed.
    const rows = await prisma.$queryRaw<
      Array<{
        id: string;
        type: string;
        tenantId: string;
        payload: Prisma.JsonValue;
      }>
    >`
      UPDATE "OutboxEvent"
      SET "status" = 'PROCESSING'
      WHERE "id" IN (
        SELECT "id" FROM "OutboxEvent"
        WHERE "status" = 'PENDING'
          AND ("nextRetryAt" IS NULL OR "nextRetryAt" <= NOW())
        ORDER BY "createdAt" ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING "id", "type", "tenantId", "payload"
    `;
    return rows;
  }

  async markProcessed(id: string): Promise<void> {
    await prisma.outboxEvent.update({
      where: { id },
      data: { status: "PROCESSED", processedAt: new Date() },
    });
  }

  async markFailed(id: string): Promise<void> {
    const event = await prisma.outboxEvent.findUnique({
      where: { id },
      select: { attempts: true },
    });
    const attempts = (event?.attempts ?? 0) + 1;
    const MAX_ATTEMPTS = 5;

    if (attempts >= MAX_ATTEMPTS) {
      // Move to FAILED permanently — DLQ processor will pick it up
      await prisma.outboxEvent.update({
        where: { id },
        data: { status: "FAILED", attempts },
      });
    } else {
      // Exponential backoff: 10s, 40s, 90s, 160s
      const backoffMs = Math.pow(attempts, 2) * 10_000;
      await prisma.outboxEvent.update({
        where: { id },
        data: {
          status: "PENDING",
          attempts,
          nextRetryAt: new Date(Date.now() + backoffMs),
        },
      });
    }
  }

  async getFailedForDLQ(limit: number) {
    return prisma.outboxEvent.findMany({
      where: { status: "FAILED" },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: {
        id: true,
        type: true,
        tenantId: true,
        payload: true,
        attempts: true,
        createdAt: true,
      },
    });
  }

  async markDLQ(id: string): Promise<void> {
    await prisma.outboxEvent.update({
      where: { id },
      data: { status: "DLQ" },
    });
  }
}
