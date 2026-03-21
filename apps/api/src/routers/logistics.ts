import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/trpc';
import { PrismaDeliveryRepository } from '../../../../packages/business/logistics/adapters/prisma-delivery-repository';
import { listDeliveries, getTodayRoute } from '../../../../packages/business/logistics/use-cases/list-deliveries';
import { createDelivery } from '../../../../packages/business/logistics/use-cases/create-delivery';
import { updateDeliveryStatus } from '../../../../packages/business/logistics/use-cases/update-delivery-status';
import { generateShippingLabel } from '../../../../packages/business/logistics/use-cases/generate-label';
import { uuidSchema } from '@wbc/validators';

const deliveryRepo = new PrismaDeliveryRepository();

export const logisticsRouter = router({
  listDeliveries: protectedProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ ctx, input }) => { return listDeliveries(deliveryRepo, ctx.tenant.tenantId, input.status ? { status: input.status as 'CONFIRMED' | 'SEPARATED' | 'SHIPPED' | 'DELIVERED' } : undefined); }),
  createDelivery: protectedProcedure
    .input(z.object({ saleId: uuidSchema, clientId: uuidSchema, method: z.enum(['PICKUP', 'DELIVERY', 'SHIPPING']), address: z.string().optional() }))
    .mutation(async ({ ctx, input }) => { return createDelivery(deliveryRepo, { tenantId: ctx.tenant.tenantId, saleId: input.saleId, clientId: input.clientId, clientName: '', clientPhone: '', method: input.method, address: input.address }); }),
  updateStatus: protectedProcedure
    .input(z.object({ id: uuidSchema, status: z.enum(['CONFIRMED', 'SEPARATED', 'SHIPPED', 'DELIVERED']), trackingCode: z.string().optional() }))
    .mutation(async ({ ctx, input }) => { return updateDeliveryStatus(deliveryRepo, ctx.tenant.tenantId, input.id, input.status, input.trackingCode); }),
  getDayRoute: protectedProcedure.query(async ({ ctx }) => { return getTodayRoute(deliveryRepo, ctx.tenant.tenantId); }),
  generateLabel: protectedProcedure
    .input(z.object({ deliveryId: uuidSchema }))
    .query(async ({ ctx, input }) => {
      const delivery = await deliveryRepo.findById(ctx.tenant.tenantId, input.deliveryId);
      if (!delivery) return null;
      return generateShippingLabel(delivery);
    }),
});
