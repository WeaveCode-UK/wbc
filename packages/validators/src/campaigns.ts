import { z } from 'zod';
import { paginationSchema, uuidSchema } from './common';

export const listCampaignsSchema = paginationSchema.extend({ status: z.string().optional() });
export const createCampaignSchema = z.object({ name: z.string().min(1), message: z.string().min(1), audioUrl: z.string().optional(), recipientIds: z.array(z.string().uuid()), scheduledAt: z.date().optional() });
export const confirmCampaignSchema = z.object({ id: uuidSchema });
export const cancelCampaignSchema = z.object({ id: uuidSchema });
export const getRecipientsSchema = z.object({ id: uuidSchema, status: z.string().optional() });
