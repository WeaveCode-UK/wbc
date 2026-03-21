import { z } from 'zod';
import { paginationSchema, uuidSchema } from './common';

export const getFinanceDashboardSchema = z.object({ period: z.string().optional() });
export const listExpensesSchema = paginationSchema.extend({ category: z.string().optional() });
export const createExpenseSchema = z.object({ description: z.string().min(1), amount: z.number().positive(), category: z.string().optional(), date: z.date() });
export const updateExpenseSchema = z.object({ id: uuidSchema, description: z.string().optional(), amount: z.number().positive().optional(), category: z.string().optional() });
export const deleteExpenseSchema = z.object({ id: uuidSchema });
export const calculateMarginSchema = z.object({ costPrice: z.number().positive(), salePrice: z.number().positive() });
export const calculateGoalReverseSchema = z.object({ targetIncome: z.number().positive() });
export const getCACSchema = z.object({ clientId: z.string().uuid().optional() });
export const connectMercadoPagoSchema = z.object({ authCode: z.string() });
