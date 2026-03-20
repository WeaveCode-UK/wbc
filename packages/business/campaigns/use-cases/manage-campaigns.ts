import type { Campaign } from '../domain/entities';
import type { CampaignRepository } from '../ports/campaign-repository';
import { CampaignNotFoundError, InvalidCampaignStatusError } from '../domain/errors';
import { publish, EVENTS } from '@wbc/shared';

export async function listCampaigns(tenantId: string, filters: { status?: string; page: number; limit: number }, repo: CampaignRepository) {
  return repo.list(tenantId, filters);
}

export async function createCampaign(
  tenantId: string,
  data: { name: string; message: string; audioUrl?: string; attachments?: unknown; recipientIds: string[]; scheduledAt?: Date },
  repo: CampaignRepository,
): Promise<Campaign> {
  return repo.create({ tenantId, ...data });
}

export async function confirmCampaign(tenantId: string, id: string, repo: CampaignRepository): Promise<Campaign> {
  const campaign = await repo.findById(tenantId, id);
  if (!campaign) throw new CampaignNotFoundError(id);
  if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
    throw new InvalidCampaignStatusError(campaign.status, 'SENDING');
  }

  const updated = await repo.updateStatus(tenantId, id, campaign.scheduledAt ? 'SCHEDULED' : 'SENDING');

  await publish(EVENTS.CAMPAIGN_DISPATCHED, tenantId, {
    tenantId,
    campaignId: id,
    recipientCount: 0,
  });

  return updated;
}

export async function cancelCampaign(tenantId: string, id: string, repo: CampaignRepository): Promise<Campaign> {
  const campaign = await repo.findById(tenantId, id);
  if (!campaign) throw new CampaignNotFoundError(id);
  return repo.updateStatus(tenantId, id, 'CANCELLED');
}

export async function getRecipients(campaignId: string, status: string | undefined, repo: CampaignRepository) {
  return repo.getRecipients(campaignId, status);
}
