import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { TRPCContext } from './context';
import type { Role } from '@wbc/shared';
import { runWithTenant, logSecurityEvent } from '@wbc/shared';
import { applyPublicRateLimit, applyProtectedRateLimit } from './rate-limit-middleware';
import { mapDomainErrorToTRPC } from './error-handler';
import { Sentry } from '../lib/sentry';
import {
  extractAuthedContext,
  extractTenantContext,
} from '../middleware/auth.middleware';
import { createLogger } from '../lib/logger';
import { httpRequestDuration, httpRequestTotal } from '../lib/metrics';

const apiLogger = createLogger('api');

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

const loggingMiddleware = t.middleware(async ({ path, type, ctx, next }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;
  const durationSec = durationMs / 1000;
  httpRequestDuration.observe({ path, type, status: 'ok' }, durationSec);
  httpRequestTotal.inc({ path, type, status: 'ok' });
  apiLogger.info({
    requestId: ctx.requestId,
    userId: ctx.tenant?.userId,
    tenantId: ctx.tenant?.tenantId,
    path,
    type,
    durationMs,
  }, `${type} ${path}`);
  return result;
});

const domainErrorMiddleware = t.middleware(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    Sentry.captureException(error);
    const mapped = mapDomainErrorToTRPC(error);
    if (mapped) throw mapped;
    throw error;
  }
});

const baseProcedure = t.procedure.use(loggingMiddleware).use(domainErrorMiddleware);

// Level 1: Public — no auth required
export const publicProcedure = baseProcedure.use(async ({ path, ctx, next }) => {
  const identifier = ctx.tenant?.userId ?? 'anonymous';
  await applyPublicRateLimit(path, identifier);
  return next();
});

// Level 2: Authed — requires accountId (sub in JWT), no tenant required
export const authedProcedure = baseProcedure.use(async ({ path, ctx, next }) => {
  if (!ctx.tenant) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  const authed = extractAuthedContext({ sub: ctx.tenant.userId });
  await applyProtectedRateLimit(path, authed.accountId, authed.accountId);
  return next({ ctx: { ...ctx, accountId: authed.accountId } });
});

// Level 3: Tenant — requires accountId + tenantId + role + plan
export const tenantProcedure = baseProcedure.use(async ({ path, ctx, next }) => {
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
      logSecurityEvent({
        event: 'rbac.forbidden',
        userId: ctx.tenant.userId,
        tenantId: ctx.tenant.tenantId,
        success: false,
        detail: `role ${ctx.tenant.role} < required ${minimumRole}`,
      });
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Insufficient permissions' });
    }
    return next();
  });
}
