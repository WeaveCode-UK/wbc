import type { Campaign, CampaignRecipient } from '../domain/entities';

export interface CampaignRepository {
  findById(tenantId: string, id: string): Promise<Campaign | null>;
  list(tenantId: string, filters: { status?: string; page: number; limit: number }): Promise<{ data: Campaign[]; total: number }>;
  create(data: { tenantId: string; name: string; message: string; audioUrl?: string; attachments?: unknown; recipientIds: string[]; scheduledAt?: Date }): Promise<Campaign>;
  updateStatus(tenantId: string, id: string, status: string): Promise<Campaign>;
  getRecipients(campaignId: string, status?: string): Promise<CampaignRecipient[]>;
  delete(tenantId: string, id: string): Promise<void>;
}
