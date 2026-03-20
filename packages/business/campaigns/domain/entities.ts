export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'CANCELLED';
export type RecipientStatus = 'PENDING' | 'SENT' | 'RECEIVED' | 'VIEWED' | 'REPLIED' | 'FAILED';

export interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  message: string;
  audioUrl: string | null;
  attachments: unknown;
  status: CampaignStatus;
  scheduledAt: Date | null;
  statsReceived: number;
  statsViewed: number;
  statsReplied: number;
  statsSales: number;
  shareOnFeed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  clientId: string;
  status: RecipientStatus;
  sentAt: Date | null;
}
