import { prisma } from "@wbc/db";
import { createLogger } from "@wbc/shared";
import type { AuditEntry, AuditLogPort } from "../ports/audit-log.port";

const logger = createLogger("audit-log");

export class PrismaAuditLog implements AuditLogPort {
  async record(entry: AuditEntry): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: entry.tenantId ?? null,
          accountId: entry.accountId ?? null,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId ?? null,
          status: entry.status,
          ip: entry.ip ?? null,
          userAgent: entry.userAgent ?? null,
          detail: entry.detail ? (entry.detail as object) : undefined,
        },
      });
    } catch (error) {
      // Never let an audit-log failure break the user-facing flow — but log
      // the failure loudly so operators notice the gap.
      logger.error(
        { error, action: entry.action, resource: entry.resource },
        "Audit log write failed",
      );
    }
  }
}
