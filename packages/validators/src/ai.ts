import { z } from 'zod';

export const generateCampaignTextSchema = z.object({ objective: z.string().min(1) });
export const generateBillingMessageSchema = z.object({ clientName: z.string(), amount: z.number(), dueDate: z.string() });
export const generateReactivationSchema = z.object({ clientName: z.string(), lastPurchaseDate: z.string() });
export const correctTextSchema = z.object({ text: z.string().min(1) });
