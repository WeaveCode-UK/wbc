import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { TRPCContext } from './context';
import type { Role } from '@wbc/shared';
import { runWithTenant } from '@wbc/shared';
import { applyPublicRateLimit, applyProtectedRateLimit } from './rate-limit-middleware';
import {
  extractAuthedContext,
  extractTenantContext,
} from '../middleware/auth.middleware';

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;

// Level 1: Public — no auth required
export const publicProcedure = t.procedure.use(async ({ path, ctx, next }) => {
  const identifier = ctx.tenant?.userId ?? 'anonymous';
  await applyPublicRateLimit(path, identifier);
  return next();
});

// Level 2: Authed — requires accountId (sub in JWT), no tenant required
export const authedProcedure = t.procedure.use(async ({ path, ctx, next }) => {
  if (!ctx.tenant) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  const authed = extractAuthedContext({ sub: ctx.tenant.userId });
  await applyProtectedRateLimit(path, authed.accountId, authed.accountId);
  return next({ ctx: { ...ctx, accountId: authed.accountId } });
});

// Level 3: Tenant — requires accountId + tenantId + role + plan
export const tenantProcedure = t.procedure.use(async ({ path, ctx, next }) => {
  if (!ctx.tenant) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  const tenant = ctx.tenant;
  const tenantCtx = extractTenantContext({
    sub: tenant.userId,
    tid: tenant.tenantId,
    mid: tenant.userId, // memberId from JWT
    role: tenant.role,
    plan: tenant.plan,
  });
  await applyProtectedRateLimit(path, tenantCtx.tenantId, tenantCtx.accountId);
  return runWithTenant(tenant, () => next({ ctx: { tenant, accountId: tenantCtx.accountId, tenantCtx } }));
});

// Legacy: protectedProcedure — alias for tenantProcedure for backwards compatibility
export const protectedProcedure = tenantProcedure;

const ROLE_HIERARCHY: Record<Role, number> = {
  CONSULTANT: 0,
  LEADER: 1,
  DIRECTOR: 2,
  ADMIN: 3,
};

export function roleProtectedProcedure(minimumRole: Role) {
  return tenantProcedure.use(({ ctx, next }) => {
    const userLevel = ROLE_HIERARCHY[ctx.tenant.role];
    const requiredLevel = ROLE_HIERARCHY[minimumRole];
    if (userLevel < requiredLevel) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Insufficient permissions' });
    }
    return next();
  });
}
