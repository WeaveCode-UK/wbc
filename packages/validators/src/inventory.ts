import { z } from "zod";
import {
  paginationSchema,
  uuidSchema,
  TEXT_SHORT_MAX,
  TEXT_LONG_MAX,
} from "./common";

export const listStockSchema = z.object({ lowOnly: z.boolean().optional() });
export const updateStockSchema = z.object({
  productId: uuidSchema,
  quantity: z.number().int().min(0),
});
// ACH-025 seguranca: bound the adjustment magnitude on the wire so a
// single call can't request a million-unit swing. Direction is kept
// signed to preserve the existing API; large legitimate corrections
// require two calls and are easier to spot in audit logs.
export const adjustStockSchema = z.object({
  productId: uuidSchema,
  adjustment: z
    .number()
    .int()
    .refine((n) => Math.abs(n) <= 100_000, {
      message: "adjustment magnitude must not exceed 100000",
    }),
});
export const listOrdersSchema = z.object({
  status: z.string().max(64).optional(),
});
// ACH-001 apis-integracoes: optional idempotencyKey accepted on the wire.
export const createOrderSchema = z.object({
  idempotencyKey: z.string().min(1).optional(),
  brandId: uuidSchema,
  items: z.array(
    z.object({
      productName: z.string().max(TEXT_SHORT_MAX),
      quantity: z.number().int().positive(),
      unitCost: z.number().positive(),
    }),
  ),
  notes: z.string().max(TEXT_LONG_MAX).optional(),
});
export const receiveOrderSchema = z.object({
  idempotencyKey: z.string().min(1).optional(),
  id: uuidSchema,
});
export const cancelOrderSchema = z.object({ id: uuidSchema });
export const listSamplesSchema = paginationSchema;
export const createSampleSchema = z.object({
  productId: uuidSchema,
  clientId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
  cost: z.number().positive(),
});
export const markSampleConvertedSchema = z.object({ id: uuidSchema });
