import { prisma } from '../index';
import type { DomainEvent } from '@wbc/shared';
import type { OutboxPort } from '@wbc/shared/src/events/outbox-service';

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
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: { id: true, type: true, tenantId: true, payload: true },
    });
  }

  async claimPending(limit: number) {
    // Atomically claim PENDING events → PROCESSING to prevent duplicate dispatch
    // Respects nextRetryAt for exponential backoff
    const now = new Date();
    const pending = await prisma.outboxEvent.findMany({
      where: {
        status: 'PENDING',
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: { id: true },
    });
    if (pending.length === 0) return [];

    const ids = pending.map((e) => e.id);
    await prisma.outboxEvent.updateMany({
      where: { id: { in: ids }, status: 'PENDING' },
      data: { status: 'PROCESSING' },
    });

    return prisma.outboxEvent.findMany({
      where: { id: { in: ids }, status: 'PROCESSING' },
      select: { id: true, type: true, tenantId: true, payload: true },
    });
  }

  async markProcessed(id: string): Promise<void> {
    await prisma.outboxEvent.update({
      where: { id },
      data: { status: 'PROCESSED', processedAt: new Date() },
    });
  }

  async markFailed(id: string): Promise<void> {
    const event = await prisma.outboxEvent.findUnique({ where: { id }, select: { attempts: true } });
    const attempts = (event?.attempts ?? 0) + 1;
    const MAX_ATTEMPTS = 5;

    if (attempts >= MAX_ATTEMPTS) {
      // Move to FAILED permanently — DLQ processor will pick it up
      await prisma.outboxEvent.update({
        where: { id },
        data: { status: 'FAILED', attempts },
      });
    } else {
      // Exponential backoff: 10s, 40s, 90s, 160s
      const backoffMs = Math.pow(attempts, 2) * 10_000;
      await prisma.outboxEvent.update({
        where: { id },
        data: {
          status: 'PENDING',
          attempts,
          nextRetryAt: new Date(Date.now() + backoffMs),
        },
      });
    }
  }
}
