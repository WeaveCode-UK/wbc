import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { TRPCContext } from './context';
import { runWithTenant } from '@wbc/shared';
import { applyPublicRateLimit, applyProtectedRateLimit } from './rate-limit-middleware';

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;

export const publicProcedure = t.procedure.use(async ({ path, ctx, next }) => {
  const identifier = ctx.tenant?.userId ?? 'anonymous';
  await applyPublicRateLimit(path, identifier);
  return next();
});

// Protected procedure — requires authenticated tenant and runs within tenant context
export const protectedProcedure = t.procedure.use(async ({ path, ctx, next }) => {
  if (!ctx.tenant) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  const tenant = ctx.tenant;
  await applyProtectedRateLimit(path, tenant.tenantId, tenant.userId);
  return runWithTenant(tenant, () => next({ ctx: { tenant } }));
});
