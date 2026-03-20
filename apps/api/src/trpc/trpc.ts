import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { TRPCContext } from './context';
import { runWithTenant } from '@wbc/shared';

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure — requires authenticated tenant and runs within tenant context
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.tenant) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  const tenant = ctx.tenant;
  return runWithTenant(tenant, () => next({ ctx: { tenant } }));
});
