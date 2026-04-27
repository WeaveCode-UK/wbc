import { z } from "zod";
import {
  paginationSchema,
  uuidSchema,
  TEXT_SHORT_MAX,
  TEXT_LONG_MAX,
} from "./common";

// ACH-018: caps free-text fields. Status filters take TEXT_SHORT (we don't
// expect a status string longer than the longest enum value, but better
// reject pathological input than scan the whole table).
export const listSalesSchema = paginationSchema.extend({
  status: z.string().max(64).optional(),
  clientId: z.string().uuid().optional(),
});
export const getSaleByIdSchema = z.object({ id: uuidSchema });
export const createSaleSchema = z.object({
  clientId: z.string().uuid(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive(),
    }),
  ),
  paymentMethod: z.string().max(TEXT_SHORT_MAX).optional(),
  discount: z.number().min(0).optional(),
  cashbackUsed: z.number().min(0).optional(),
  campaignId: z.string().uuid().optional(),
  notes: z.string().max(TEXT_LONG_MAX).optional(),
});
export const confirmSaleSchema = z.object({ id: uuidSchema });
export const cancelSaleSchema = z.object({ id: uuidSchema });
export const updateSaleStatusSchema = z.object({
  id: uuidSchema,
  status: z.enum([
    "CONFIRMED",
    "SEPARATED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]),
});
export const listPaymentsSchema = z.object({ saleId: uuidSchema });
export const markPaidSchema = z.object({ paymentId: uuidSchema });
export const getCashbackBalanceSchema = z.object({ clientId: uuidSchema });
export const createReturnSchema = z.object({
  saleId: uuidSchema,
  reason: z.string().min(1).max(TEXT_LONG_MAX),
  refundAmount: z.number().positive(),
});
export const getAccountsReceivableSchema = z.object({
  status: z.string().max(64).optional(),
});
