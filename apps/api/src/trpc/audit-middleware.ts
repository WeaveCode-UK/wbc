import type {
  AuditLogPort,
  AuditAction,
} from "@wbc/business/platform/audit-log/ports/audit-log.port";

/**
 * Creates a tRPC middleware factory that records an audit log entry after a
 * mutation completes. Use as:
 *
 *   tenantProcedure
 *     .use(auditedAs({ action: 'tenant.member.role.changed', resource: 'member' }))
 *     .input(...)
 *     .mutation(...)
 *
 * The status is derived from whether the handler threw. Detail is left to
 * the caller — pass anything small enough to stay in the audit row (no
 * request bodies, no PII beyond what `security-logger` already hashes).
 */
export function makeAuditMiddleware(auditLog: AuditLogPort) {
  return function auditedAs(config: {
    action: AuditAction | string;
    resource: string;
    resourceIdFrom?: (input: unknown) => string | undefined;
  }) {
    return async ({
      ctx,
      input,
      next,
    }: {
      ctx: {
        tenant: { tenantId?: string; userId?: string } | null;
        ipAddress?: string;
      };
      input: unknown;
      next: () => Promise<unknown>;
    }) => {
      let status: "success" | "failure" = "success";
      let thrown: unknown = null;
      try {
        return await next();
      } catch (error) {
        status = "failure";
        thrown = error;
        throw error;
      } finally {
        // Audit write is fire-and-forget; PrismaAuditLog swallows errors.
        void auditLog.record({
          tenantId: ctx.tenant?.tenantId ?? null,
          accountId: ctx.tenant?.userId ?? null,
          action: config.action,
          resource: config.resource,
          resourceId: config.resourceIdFrom?.(input) ?? null,
          status,
          ip: ctx.ipAddress ?? null,
          detail: thrown ? { error: (thrown as Error).message } : undefined,
        });
      }
    };
  };
}
