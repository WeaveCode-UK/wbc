import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc/trpc';
import { PrismaSubscriptionRepository } from '../../../../packages/business/auth/adapters/prisma-subscription-repository';

// Auth 2.0: OTP-based sendOtp and register are DEPRECATED.
// This router will be completely replaced in F10.E03.
// Keeping only getSubscription for now.

const subscriptionRepo = new PrismaSubscriptionRepository();

export const authRouter = router({
  sendOtp: publicProcedure
    .input(z.object({ accountId: z.string().uuid() }))
    .mutation(async () => {
      // Temporarily disabled during Auth 2.0 migration
      throw new TRPCError({ code: 'METHOD_NOT_SUPPORTED', message: 'Auth 2.0 migration in progress' });
    }),

  register: publicProcedure
    .input(z.object({
      name: z.string().min(2).max(100),
    }))
    .mutation(async () => {
      // Temporarily disabled during Auth 2.0 migration
      throw new TRPCError({ code: 'METHOD_NOT_SUPPORTED', message: 'Auth 2.0 migration in progress' });
    }),

  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const sub = await subscriptionRepo.findByTenantId(ctx.tenant.tenantId);
    if (!sub) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Subscription not found' });
    }
    return sub;
  }),
});
