import { z } from 'zod';
import { uuidSchema } from './common';

export const listProductsSchema = z.object({ brandId: z.string().uuid().optional(), search: z.string().optional(), category: z.string().optional() });
export const createProductSchema = z.object({ name: z.string().min(1), brandId: z.string().uuid(), price: z.number().positive(), costPrice: z.number().positive().optional(), description: z.string().optional(), photoUrl: z.string().optional(), category: z.string().optional() });
export const updateProductSchema = z.object({ id: uuidSchema, name: z.string().optional(), price: z.number().positive().optional(), isActive: z.boolean().optional() });
export const deleteProductSchema = z.object({ id: uuidSchema });
export const getTopProductsSchema = z.object({ limit: z.number().int().min(1).max(50).default(10) });
export const createShowcaseSchema = z.object({ name: z.string().min(1), clientId: z.string().uuid().optional(), productIds: z.array(z.string().uuid()) });
export const deleteShowcaseSchema = z.object({ id: uuidSchema });
export const getPublicShowcaseSchema = z.object({ shareLink: z.string() });
