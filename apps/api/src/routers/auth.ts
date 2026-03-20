import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure } from '../trpc/trpc';
import { PrismaOtpRepository } from '../../../../packages/business/auth/adapters/prisma-otp-repository';
import { PrismaTenantRepository } from '../../../../packages/business/auth/adapters/prisma-tenant-repository';
import { PrismaSubscriptionRepository } from '../../../../packages/business/auth/adapters/prisma-subscription-repository';
import { sendOtp } from '../../../../packages/business/auth/use-cases/send-otp';
import { registerTenant } from '../../../../packages/business/auth/use-cases/register-tenant';
import { phoneSchema } from '@wbc/validators';

const otpRepository = new PrismaOtpRepository();
const tenantRepository = new PrismaTenantRepository();
const subscriptionRepo = new PrismaSubscriptionRepository();

export const authRouter = router({
  sendOtp: publicProcedure
    .input(z.object({ phone: phoneSchema }))
    .mutation(async ({ input }) => {
      const result = await sendOtp({ phone: input.phone }, otpRepository);
      return { success: result.success };
    }),

  register: publicProcedure
    .input(z.object({
      name: z.string().min(2).max(100),
      phone: phoneSchema,
    }))
    .mutation(async ({ input }) => {
      const result = await registerTenant(
        { name: input.name, phone: input.phone },
        tenantRepository,
        otpRepository,
      );
      // Send OTP after registration
      await sendOtp({ phone: input.phone }, otpRepository);
      return { tenantId: result.tenantId, slug: result.slug };
    }),

  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const sub = await subscriptionRepo.findByTenantId(ctx.tenant.tenantId);
    if (!sub) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Subscription not found' });
    }
    return sub;
  }),
});
