import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TRPCContext } from "./context";
import type { Role } from "@wbc/shared";
import { runWithTenant, logSecurityEvent, redactId } from "@wbc/shared";
import {
  applyPublicRateLimit,
  applyProtectedRateLimit,
  applyTenantBudgetLimit,
} from "./rate-limit-middleware";
import { mapDomainErrorToTRPC } from "./error-handler";
import { Sentry } from "../lib/sentry";
import {
  extractAuthedContext,
  extractTenantContext,
} from "../middleware/auth.middleware";
import { createLogger } from "../lib/logger";
import { httpRequestDuration, httpRequestTotal } from "../lib/metrics";

const apiLogger = createLogger("api");

// ACH-032: only `production` strips the domain-error class name; dev and
// test runs keep it so we can debug locally. Outside production, the field
// is a tiny convenience for the developer console — in production it is
// the difference between leaking that an account is locked vs. not, or
// that a credential was wrong vs. unknown email (cf. AccountLockedError
// vs InvalidCredentialsError, both deliberately share the same user-facing
// message — exposing the class name reverses that protection).
const STRIP_DOMAIN_ERROR_NAME = process.env.NODE_ENV === "production";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    if (STRIP_DOMAIN_ERROR_NAME) {
      return shape;
    }
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
  httpRequestDuration.observe({ path, type, status: "ok" }, durationSec);
  httpRequestTotal.inc({ path, type, status: "ok" });
  // ACH-035: never log raw account/tenant UUIDs — they are PII handles.
  // redactId hashes to an 8-char prefix (sha256[:8]) which is stable across
  // calls (correlation works) but unrecoverable without the original value.
  apiLogger.info(
    {
      requestId: ctx.requestId,
      userId: redactId(ctx.tenant?.userId),
      tenantId: redactId(ctx.tenant?.tenantId),
      path,
      type,
      durationMs,
    },
    `${type} ${path}`,
  );
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

const baseProcedure = t.procedure
  .use(loggingMiddleware)
  .use(domainErrorMiddleware);

// Level 1: Public — no auth required
export const publicProcedure = baseProcedure.use(
  async ({ path, ctx, next }) => {
    // Prefer client IP for anonymous traffic so all unauthenticated callers
    // don't share a single bucket (ACH-018). Fall back to userId / 'anonymous'
    // when neither is available.
    const identifier = ctx.tenant?.userId ?? ctx.ipAddress ?? "anonymous";
    await applyPublicRateLimit(path, identifier);
    return next();
  },
);

// Level 2: Authed — requires accountId (sub in JWT), no tenant required
export const authedProcedure = baseProcedure.use(
  async ({ path, ctx, next }) => {
    if (!ctx.tenant) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }
    const authed = extractAuthedContext({ sub: ctx.tenant.userId });
    await applyProtectedRateLimit(path, authed.accountId, authed.accountId);
    return next({ ctx: { ...ctx, accountId: authed.accountId } });
  },
);

// Level 3: Tenant — requires accountId + tenantId + role + plan
export const tenantProcedure = baseProcedure.use(
  async ({ path, ctx, next }) => {
    if (!ctx.tenant) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }
    const tenant = ctx.tenant;
    const tenantCtx = extractTenantContext({
      sub: tenant.userId,
      tid: tenant.tenantId,
      mid: tenant.userId, // memberId from JWT
      role: tenant.role,
      plan: tenant.plan,
    });
    // HG1 — order matters: cheap tenant-budget bucket first (single
    // Redis key, no path component) so a tenant blowing through its
    // ceiling doesn't even reach the per-user/path check. The per-user
    // limit then catches single-seat abuse within the tenant's budget.
    await applyTenantBudgetLimit(tenantCtx.tenantId, tenantCtx.plan);
    await applyProtectedRateLimit(
      path,
      tenantCtx.tenantId,
      tenantCtx.accountId,
    );
    return runWithTenant(tenant, () =>
      next({ ctx: { tenant, accountId: tenantCtx.accountId, tenantCtx } }),
    );
  },
);

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
        event: "rbac.forbidden",
        userId: ctx.tenant.userId,
        tenantId: ctx.tenant.tenantId,
        success: false,
        detail: `role ${ctx.tenant.role} < required ${minimumRole}`,
      });
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Insufficient permissions",
      });
    }
    return next();
  });
}
