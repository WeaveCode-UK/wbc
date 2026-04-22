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

  // ACH-011 confiabilidade-resiliencia: round-robin por tenant, ativado
  // por env `OUTBOX_CLAIM_STRATEGY=round_robin`. Default preserva FIFO
  // global (comportamento anterior). Com round-robin, uma tenant com
  // 10k eventos não monopoliza o batch — cada iteração pega no máximo
  // um evento por tenant.
  private get claimStrategy(): "fifo" | "round_robin" {
    return process.env.OUTBOX_CLAIM_STRATEGY === "round_robin"
      ? "round_robin"
      : "fifo";
  }

  async claimPending(limit: number) {
    if (this.claimStrategy === "round_robin") {
      return this.claimPendingRoundRobin(limit);
    }
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
    //
    // ACH-008 confiabilidade-resiliencia: combined with dispatch now
    // throwing on handler failure (ACH-001) and handler-side
    // idempotency via processed_events (ACH-002), the previous
    // racy+duplicable combination is closed: two workers can no longer
    // double-dispatch the same event, and even if redelivery happens
    // (crash mid-handler), the handler is a no-op on second run.
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

  private async claimPendingRoundRobin(limit: number) {
    // DISTINCT ON (tenant_id) garante no máximo 1 evento por tenant no
    // batch; tenants que excedam esse limite só aparecem na próxima
    // iteração do outbox-processor.
    //
    // Followup (ver docs/RELIABILITY-FOLLOWUP.md): avaliar índice
    // composto (status, tenantId, createdAt) se benchmark mostrar
    // degradação sob alta cardinalidade de tenants.
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
        SELECT DISTINCT ON ("tenantId") "id" FROM "OutboxEvent"
        WHERE "status" = 'PENDING'
          AND ("nextRetryAt" IS NULL OR "nextRetryAt" <= NOW())
        ORDER BY "tenantId", "createdAt" ASC
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
      // Exponential backoff with jitter (ACH-010 confiabilidade-resiliencia).
      // Base: 10s, 40s, 90s, 160s. Without jitter a burst of failures at
      // the same instant would retry in lockstep (thundering herd),
      // amplifying the incident. Random +/-50% spreads them across a
      // window proportional to the attempt count.
      const base = Math.pow(attempts, 2) * 10_000;
      const backoffMs = base + Math.floor((Math.random() - 0.5) * base);
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

  // ACH-006 confiabilidade-resiliencia: replay de DLQ via tRPC/CLI sem
  // precisar de UPDATE manual. Reset de attempts para permitir retry
  // com backoff normal; volta status para PENDING.
  async replayFromDLQ(id: string): Promise<boolean> {
    const result = await prisma.outboxEvent.updateMany({
      where: { id, status: "DLQ" },
      data: { status: "PENDING", attempts: 0, nextRetryAt: null },
    });
    return result.count > 0;
  }

  async listDLQ(limit = 50) {
    return prisma.outboxEvent.findMany({
      where: { status: "DLQ" },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: {
        id: true,
        type: true,
        tenantId: true,
        attempts: true,
        createdAt: true,
      },
    });
  }
}
