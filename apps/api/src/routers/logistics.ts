import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/trpc';
import { listDeliveries, createDelivery, updateDeliveryStatus, getDayRoute, generateLabel } from '../../../../packages/business/logistics/use-cases/manage-deliveries';
import { uuidSchema } from '@wbc/validators';

export const logisticsRouter = router({
  listDeliveries: protectedProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ ctx, input }) => { return listDeliveries(ctx.tenant.tenantId, input.status); }),
  createDelivery: protectedProcedure
    .input(z.object({ saleId: uuidSchema, clientId: uuidSchema, method: z.enum(['PERSONAL', 'MAIL', 'COURIER', 'PICKUP']), address: z.string().optional(), estimatedDays: z.number().int().optional() }))
    .mutation(async ({ ctx, input }) => { return createDelivery(ctx.tenant.tenantId, input.saleId, input.clientId, input.method, input.address, input.estimatedDays); }),
  updateStatus: protectedProcedure
    .input(z.object({ id: uuidSchema, status: z.enum(['CONFIRMED', 'SEPARATED', 'SHIPPED', 'DELIVERED']), trackingCode: z.string().optional() }))
    .mutation(async ({ ctx, input }) => { return updateDeliveryStatus(ctx.tenant.tenantId, input.id, input.status, input.trackingCode); }),
  getDayRoute: protectedProcedure.query(async ({ ctx }) => { return getDayRoute(ctx.tenant.tenantId); }),
  generateLabel: protectedProcedure
    .input(z.object({ deliveryId: uuidSchema }))
    .query(async ({ input }) => { return generateLabel(input.deliveryId); }),
});
