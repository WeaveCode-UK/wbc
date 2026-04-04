import { prisma } from '@wbc/db';
import type { QuickReplyRepository, ScheduledMessageRepository, PostSaleFlowRepository } from '../ports/messaging-repository';

export class PrismaQuickReplyRepository implements QuickReplyRepository {
  async list(tenantId: string) {
    return prisma.quickReply.findMany({ where: { tenantId }, orderBy: { label: 'asc' } });
  }

  async create(tenantId: string, label: string, text: string) {
    return prisma.quickReply.create({ data: { tenantId, label, text } });
  }

  async delete(tenantId: string, id: string) {
    await prisma.quickReply.delete({ where: { id } });
  }
}

export class PrismaScheduledMessageRepository implements ScheduledMessageRepository {
  async create(tenantId: string, data: { clientId: string; message: string; sendAt: Date; type: string }) {
    return prisma.scheduledMessage.create({
      data: { tenantId, clientId: data.clientId, message: data.message, sendAt: data.sendAt, type: data.type as 'WELCOME' | 'BILLING_REMINDER' | 'CASHBACK_EXPIRING' | 'BIRTHDAY' | 'REACTIVATION' | 'POST_SALE' },
    });
  }

  async findClient(tenantId: string, clientId: string) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, tenantId },
      select: { name: true, phone: true },
    });
    return client;
  }
}

export class PrismaPostSaleFlowRepository implements PostSaleFlowRepository {
  async deletePendingByClient(clientId: string) {
    await prisma.postSaleFlow.deleteMany({ where: { clientId, status: 'PENDING' } });
  }

  async createMany(flows: Array<{ saleId: string; clientId: string; stage: string; messageVariant: number; scheduledAt: Date; status: string }>) {
    await prisma.postSaleFlow.createMany({
      data: flows.map((f) => ({
        saleId: f.saleId,
        clientId: f.clientId,
        stage: f.stage as 'TWO_DAYS' | 'TWO_WEEKS' | 'TWO_MONTHS',
        messageVariant: f.messageVariant,
        scheduledAt: f.scheduledAt,
        status: f.status as 'PENDING',
      })),
    });
  }

  async findPending(limit: number) {
    const now = new Date();
    return prisma.postSaleFlow.findMany({
      where: { status: 'PENDING', scheduledAt: { lte: now } },
      take: limit,
    });
  }

  async markSent(id: string) {
    await prisma.postSaleFlow.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date() },
    });
  }
}
