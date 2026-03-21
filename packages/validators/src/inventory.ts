import { z } from 'zod';
import { paginationSchema, uuidSchema } from './common';

export const listStockSchema = z.object({ lowOnly: z.boolean().optional() });
export const updateStockSchema = z.object({ productId: uuidSchema, quantity: z.number().int().min(0) });
export const adjustStockSchema = z.object({ productId: uuidSchema, adjustment: z.number().int() });
export const listOrdersSchema = z.object({ status: z.string().optional() });
export const createOrderSchema = z.object({ brandId: uuidSchema, items: z.array(z.object({ productName: z.string(), quantity: z.number().int().positive(), unitCost: z.number().positive() })), notes: z.string().optional() });
export const receiveOrderSchema = z.object({ id: uuidSchema });
export const cancelOrderSchema = z.object({ id: uuidSchema });
export const listSamplesSchema = paginationSchema;
export const createSampleSchema = z.object({ productId: uuidSchema, clientId: z.string().uuid().optional(), quantity: z.number().int().positive(), cost: z.number().positive() });
export const markSampleConvertedSchema = z.object({ id: uuidSchema });
