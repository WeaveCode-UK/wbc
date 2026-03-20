import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/trpc';
import { PrismaStockRepository } from '../../../../packages/business/inventory/adapters/prisma-stock-repository';
import { PrismaBrandOrderRepository } from '../../../../packages/business/inventory/adapters/prisma-brand-order-repository';
import { PrismaSampleRepository } from '../../../../packages/business/inventory/adapters/prisma-sample-repository';
import { listStock, updateStock, adjustStock } from '../../../../packages/business/inventory/use-cases/manage-stock';
import { listOrders, createOrder, receiveOrder, cancelOrder } from '../../../../packages/business/inventory/use-cases/manage-orders';
import { listSamples, createSample, markSampleConverted, getSampleROI } from '../../../../packages/business/inventory/use-cases/manage-samples';
import { paginationSchema, uuidSchema } from '@wbc/validators';

const stockRepo = new PrismaStockRepository();
const orderRepo = new PrismaBrandOrderRepository();
const sampleRepo = new PrismaSampleRepository();

export const inventoryRouter = router({
  listStock: protectedProcedure
    .input(z.object({ lowOnly: z.boolean().optional() }))
    .query(async ({ ctx, input }) => {
      return listStock(ctx.tenant.tenantId, input.lowOnly, stockRepo);
    }),

  updateStock: protectedProcedure
    .input(z.object({ productId: uuidSchema, quantity: z.number().int().min(0) }))
    .mutation(async ({ ctx, input }) => {
      return updateStock(ctx.tenant.tenantId, input.productId, input.quantity, stockRepo);
    }),

  adjustStock: protectedProcedure
    .input(z.object({ productId: uuidSchema, adjustment: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      return adjustStock(ctx.tenant.tenantId, input.productId, input.adjustment, stockRepo);
    }),

  listOrders: protectedProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return listOrders(ctx.tenant.tenantId, input.status, orderRepo);
    }),

  createOrder: protectedProcedure
    .input(z.object({
      brandId: uuidSchema,
      items: z.array(z.object({ productName: z.string(), quantity: z.number().int().positive(), unitCost: z.number().positive() })),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return createOrder(ctx.tenant.tenantId, input.brandId, input.items, input.notes, orderRepo);
    }),

  receiveOrder: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      return receiveOrder(ctx.tenant.tenantId, input.id, orderRepo);
    }),

  cancelOrder: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      return cancelOrder(ctx.tenant.tenantId, input.id, orderRepo);
    }),

  listSamples: protectedProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input }) => {
      return listSamples(ctx.tenant.tenantId, input.page, input.limit, sampleRepo);
    }),

  createSample: protectedProcedure
    .input(z.object({ productId: uuidSchema, clientId: z.string().uuid().optional(), quantity: z.number().int().positive(), cost: z.number().positive() }))
    .mutation(async ({ ctx, input }) => {
      return createSample(ctx.tenant.tenantId, input.productId, input.clientId, input.quantity, input.cost, sampleRepo);
    }),

  markSampleConverted: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      return markSampleConverted(ctx.tenant.tenantId, input.id, sampleRepo);
    }),

  getSampleROI: protectedProcedure.query(async ({ ctx }) => {
    return getSampleROI(ctx.tenant.tenantId, sampleRepo);
  }),
});
