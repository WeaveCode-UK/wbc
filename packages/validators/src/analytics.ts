import { z } from 'zod';
import { uuidSchema } from './common';

export const getSalesStatsSchema = z.object({ period: z.string().optional() });
export const getProductRankingSchema = z.object({ limit: z.number().int().min(1).max(50).default(10) });
export const getClientEngagementSchema = z.object({ clientId: uuidSchema });
