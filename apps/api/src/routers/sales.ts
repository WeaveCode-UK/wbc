import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/trpc';
import { PrismaSaleRepository } from '../../../../packages/business/sales/adapters/prisma-sale-repository';
import { PrismaPaymentRepository } from '../../../../packages/business/sales/adapters/prisma-payment-repository';
import { PrismaCashbackRepository } from '../../../../packages/business/sales/adapters/prisma-cashback-repository';
import { createSale } from '../../../../packages/business/sales/use-cases/create-sale';
import { confirmSale } from '../../../../packages/business/sales/use-cases/confirm-sale';
import { cancelSale } from '../../../../packages/business/sales/use-cases/cancel-sale';
import { listSales } from '../../../../packages/business/sales/use-cases/list-sales';
import { getSaleById } from '../../../../packages/business/sales/use-cases/get-sale-by-id';
import { updateSaleStatus } from '../../../../packages/business/sales/use-cases/update-sale-status';
import { listPayments, markPaid, getAccountsReceivable } from '../../../../packages/business/sales/use-cases/manage-payments';
import { getCashbackBalance } from '../../../../packages/business/sales/use-cases/manage-cashback';
import { createReturn } from '../../../../packages/business/sales/use-cases/create-return';
import { paginationSchema, uuidSchema } from '@wbc/validators';

const saleRepo = new PrismaSaleRepository();
const paymentRepo = new PrismaPaymentRepository();
const cashbackRepo = new PrismaCashbackRepository();

export const salesRouter = router({
  list: protectedProcedure
    .input(z.object({ ...paginationSchema.shape, status: z.string().optional(), clientId: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      return listSales(ctx.tenant.tenantId, { status: input.status, clientId: input.clientId, page: input.page, limit: input.limit }, saleRepo);
    }),

  getById: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .query(async ({ ctx, input }) => {
      return getSaleById(ctx.tenant.tenantId, input.id, saleRepo);
    }),

  create: protectedProcedure
    .input(z.object({
      clientId: z.string().uuid(),
      items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().positive(), unitPrice: z.number().positive() })),
      paymentMethod: z.string().optional(),
      discount: z.number().min(0).optional(),
      cashbackUsed: z.number().min(0).optional(),
      campaignId: z.string().uuid().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return createSale({ ...input, tenantId: ctx.tenant.tenantId }, saleRepo);
    }),

  confirm: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      return confirmSale(ctx.tenant.tenantId, input.id, saleRepo, cashbackRepo);
    }),

  cancel: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      return cancelSale(ctx.tenant.tenantId, input.id, saleRepo);
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: uuidSchema, status: z.enum(['CONFIRMED', 'SEPARATED', 'SHIPPED', 'DELIVERED', 'CANCELLED']) }))
    .mutation(async ({ ctx, input }) => {
      return updateSaleStatus(ctx.tenant.tenantId, input.id, input.status, saleRepo);
    }),

  listPayments: protectedProcedure
    .input(z.object({ saleId: uuidSchema }))
    .query(async ({ input }) => {
      return listPayments(input.saleId, paymentRepo);
    }),

  markPaid: protectedProcedure
    .input(z.object({ paymentId: uuidSchema }))
    .mutation(async ({ input }) => {
      return markPaid(input.paymentId, paymentRepo);
    }),

  getCashbackBalance: protectedProcedure
    .input(z.object({ clientId: uuidSchema }))
    .query(async ({ ctx, input }) => {
      return getCashbackBalance(ctx.tenant.tenantId, input.clientId, cashbackRepo);
    }),

  createReturn: protectedProcedure
    .input(z.object({ saleId: uuidSchema, reason: z.string().min(1), refundAmount: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      return createReturn({ tenantId: ctx.tenant.tenantId, ...input }, saleRepo);
    }),

  getAccountsReceivable: protectedProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return getAccountsReceivable(ctx.tenant.tenantId, input, paymentRepo);
    }),
});
