import { prisma } from '@wbc/db';
import type { CampaignRepository } from '../ports/campaign-repository';
import type { Campaign, CampaignRecipient } from '../domain/entities';

export class PrismaCampaignRepository implements CampaignRepository {
  async findById(tenantId: string, id: string): Promise<Campaign | null> {
    const campaign = await prisma.campaign.findFirst({ where: { id, tenantId } });
    return campaign as Campaign | null;
  }

  async list(tenantId: string, filters: { status?: string; page: number; limit: number }) {
    const where: Record<string, unknown> = { tenantId };
    if (filters.status) where.status = filters.status;
    const [data, total] = await Promise.all([
      prisma.campaign.findMany({ where, skip: (filters.page - 1) * filters.limit, take: filters.limit, orderBy: { createdAt: 'desc' } }),
      prisma.campaign.count({ where }),
    ]);
    return { data: data as Campaign[], total };
  }

  async create(data: { tenantId: string; name: string; message: string; audioUrl?: string; attachments?: unknown; recipientIds: string[]; scheduledAt?: Date }): Promise<Campaign> {
    const campaign = await prisma.campaign.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        message: data.message,
        audioUrl: data.audioUrl,
        attachments: data.attachments as object | undefined,
        scheduledAt: data.scheduledAt,
        recipients: {
          create: data.recipientIds.map((clientId) => ({ clientId })),
        },
      },
    });
    return campaign as Campaign;
  }

  async updateStatus(tenantId: string, id: string, status: string): Promise<Campaign> {
    const campaign = await prisma.campaign.update({
      where: { id },
      data: { status: status as 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'CANCELLED' },
    });
    return campaign as Campaign;
  }

  async getRecipients(campaignId: string, status?: string): Promise<CampaignRecipient[]> {
    const where: Record<string, unknown> = { campaignId };
    if (status) where.status = status;
    const recipients = await prisma.campaignRecipient.findMany({ where });
    return recipients as CampaignRecipient[];
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await prisma.campaign.delete({ where: { id } });
  }
}
