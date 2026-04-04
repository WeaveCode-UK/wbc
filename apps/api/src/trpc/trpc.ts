import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { TRPCContext } from './context';
import type { Role } from '@wbc/shared';
import { runWithTenant } from '@wbc/shared';
import { applyPublicRateLimit, applyProtectedRateLimit } from './rate-limit-middleware';
import { mapDomainErrorToTRPC } from './error-handler';

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        domainError: error.cause?.constructor.name,
      },
    };
  },
});

export const router = t.router;

const domainErrorMiddleware = t.middleware(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    const mapped = mapDomainErrorToTRPC(error);
    if (mapped) throw mapped;
    throw error;
  }
});

const baseProcedure = t.procedure.use(domainErrorMiddleware);

export const publicProcedure = baseProcedure.use(async ({ path, ctx, next }) => {
  const identifier = ctx.tenant?.userId ?? 'anonymous';
  await applyPublicRateLimit(path, identifier);
  return next();
});

// Protected procedure — requires authenticated tenant and runs within tenant context
export const protectedProcedure = baseProcedure.use(async ({ path, ctx, next }) => {
  if (!ctx.tenant) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  const tenant = ctx.tenant;
  await applyProtectedRateLimit(path, tenant.tenantId, tenant.userId);
  return runWithTenant(tenant, () => next({ ctx: { tenant } }));
});

const ROLE_HIERARCHY: Record<Role, number> = {
  CONSULTANT: 0,
  LEADER: 1,
  DIRECTOR: 2,
  ADMIN: 3,
};

export function roleProtectedProcedure(minimumRole: Role) {
  return protectedProcedure.use(({ ctx, next }) => {
    const userLevel = ROLE_HIERARCHY[ctx.tenant.role];
    const requiredLevel = ROLE_HIERARCHY[minimumRole];
    if (userLevel < requiredLevel) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Insufficient permissions' });
    }
    return next();
  });
}
