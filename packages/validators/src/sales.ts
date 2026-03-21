import { z } from 'zod';
import { paginationSchema, uuidSchema } from './common';

export const listSalesSchema = paginationSchema.extend({ status: z.string().optional(), clientId: z.string().uuid().optional() });
export const getSaleByIdSchema = z.object({ id: uuidSchema });
export const createSaleSchema = z.object({
  clientId: z.string().uuid(),
  items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().positive(), unitPrice: z.number().positive() })),
  paymentMethod: z.string().optional(),
  discount: z.number().min(0).optional(),
  cashbackUsed: z.number().min(0).optional(),
  campaignId: z.string().uuid().optional(),
  notes: z.string().optional(),
});
export const confirmSaleSchema = z.object({ id: uuidSchema });
export const cancelSaleSchema = z.object({ id: uuidSchema });
export const updateSaleStatusSchema = z.object({ id: uuidSchema, status: z.enum(['CONFIRMED', 'SEPARATED', 'SHIPPED', 'DELIVERED', 'CANCELLED']) });
export const listPaymentsSchema = z.object({ saleId: uuidSchema });
export const markPaidSchema = z.object({ paymentId: uuidSchema });
export const getCashbackBalanceSchema = z.object({ clientId: uuidSchema });
export const createReturnSchema = z.object({ saleId: uuidSchema, reason: z.string().min(1), refundAmount: z.number().positive() });
export const getAccountsReceivableSchema = z.object({ status: z.string().optional() });
