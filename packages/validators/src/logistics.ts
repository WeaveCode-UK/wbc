import { z } from 'zod';
import { uuidSchema } from './common';

export const listDeliveriesSchema = z.object({ status: z.string().optional() });
export const createDeliverySchema = z.object({ saleId: uuidSchema, clientId: uuidSchema, method: z.enum(['PERSONAL', 'MAIL', 'COURIER', 'PICKUP']), address: z.string().optional(), estimatedDays: z.number().int().optional() });
export const updateDeliveryStatusSchema = z.object({ id: uuidSchema, status: z.enum(['CONFIRMED', 'SEPARATED', 'SHIPPED', 'DELIVERED']), trackingCode: z.string().optional() });
export const generateLabelSchema = z.object({ deliveryId: uuidSchema });
