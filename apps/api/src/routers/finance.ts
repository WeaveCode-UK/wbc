import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/trpc';
import { PrismaExpenseRepository } from '../../../../packages/business/finance/adapters/prisma-expense-repository';
import { listExpenses, createExpense, updateExpense, deleteExpense } from '../../../../packages/business/finance/use-cases/manage-expenses';
import { getFinanceDashboard } from '../../../../packages/business/finance/use-cases/get-dashboard';
import { getMargin, getGoalReverse, getCAC } from '../../../../packages/business/finance/use-cases/calculators';
import { paginationSchema, uuidSchema } from '@wbc/validators';

const expenseRepo = new PrismaExpenseRepository();

export const financeRouter = router({
  getDashboard: protectedProcedure
    .input(z.object({ period: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return getFinanceDashboard(ctx.tenant.tenantId, input.period);
    }),

  listExpenses: protectedProcedure
    .input(z.object({ ...paginationSchema.shape, category: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return listExpenses(ctx.tenant.tenantId, { category: input.category, page: input.page, limit: input.limit }, expenseRepo);
    }),

  createExpense: protectedProcedure
    .input(z.object({ description: z.string().min(1), amount: z.number().positive(), category: z.string().optional(), date: z.date() }))
    .mutation(async ({ ctx, input }) => {
      return createExpense({ tenantId: ctx.tenant.tenantId, ...input }, expenseRepo);
    }),

  updateExpense: protectedProcedure
    .input(z.object({ id: uuidSchema, description: z.string().optional(), amount: z.number().positive().optional(), category: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return updateExpense(ctx.tenant.tenantId, id, data, expenseRepo);
    }),

  deleteExpense: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      await deleteExpense(ctx.tenant.tenantId, input.id, expenseRepo);
      return { success: true };
    }),

  calculateMargin: protectedProcedure
    .input(z.object({ costPrice: z.number().positive(), salePrice: z.number().positive() }))
    .query(async ({ input }) => {
      return getMargin(input.costPrice, input.salePrice);
    }),

  calculateGoalReverse: protectedProcedure
    .input(z.object({ targetIncome: z.number().positive() }))
    .query(async ({ input }) => {
      return getGoalReverse(input.targetIncome, 30); // default 30% margin
    }),

  getCAC: protectedProcedure
    .input(z.object({ clientId: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      return getCAC(ctx.tenant.tenantId, input.clientId);
    }),

  // Placeholders for Mercado Pago (Phase 5)
  connectMercadoPago: protectedProcedure
    .input(z.object({ authCode: z.string() }))
    .mutation(async () => {
      return { success: false, message: 'Mercado Pago integration coming in Phase 5' };
    }),

  disconnectMercadoPago: protectedProcedure
    .mutation(async () => {
      return { success: false, message: 'Mercado Pago integration coming in Phase 5' };
    }),
});
