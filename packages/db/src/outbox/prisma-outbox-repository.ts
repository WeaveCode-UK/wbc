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
    const pending = await prisma.outboxEvent.findMany({
      where: { status: 'PENDING' },
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
    await prisma.outboxEvent.update({
      where: { id },
      data: {
        status: 'FAILED',
        attempts: { increment: 1 },
      },
    });
  }
}
