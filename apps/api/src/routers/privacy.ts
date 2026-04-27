import { z } from "zod";
import { router, tenantProcedure, roleProtectedProcedure } from "../trpc/trpc";
import { createLogger } from "../lib/logger";
import { requirePermission } from "@wbc/business/auth/guards/permission.guard";
import type { Role } from "@wbc/business/auth/domain/entities/tenant-member.entity";

const logger = createLogger("privacy");

// ACH-011: data-subject mutations now require DIRECTOR+ AND the dedicated
// `tenant:export` permission so a CONSULTANT cannot fire LGPD exports or
// erasure for the whole tenant. accessLog stays at tenant-procedure (every
// member can ask "who looked at my data?").
const directorOrAbove = roleProtectedProcedure("DIRECTOR");

// ACH-001 compliance-privacidade: stubs for the four LGPD/GDPR data-subject
// rights. Each procedure enforces tenant scoping (tenantProcedure) and will
// require OTP + AuditLog writes before going live — see
// docs/PRIVACY-ENDPOINTS.md.
//
// All four currently respond with `{ status: 'not_implemented' }` so callers
// discover the endpoint exists but cannot rely on it until the follow-up
// ACHs (ACH-011 anonymize, ACH-020 AuditLog, ACH-003 ConsentLog) are in place.

export const privacyRouter = router({
  /**
   * GET user's own data — export in a structured archive (JSON per domain).
   * Returns a signed URL when persistence is implemented.
   */
  exportMyData: directorOrAbove
    .input(z.object({ format: z.enum(["json", "zip"]).default("zip") }))
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx.tenant.role as Role, "tenant:export");
      logger.warn(
        { tenantId: ctx.tenant.tenantId, format: input.format },
        "ACH-001 stub: privacy.exportMyData invoked — requires implementation",
      );
      return {
        status: "not_implemented" as const,
        message:
          "Stub — aguardando implementação de aggregator + OTP (ACH-001 follow-up).",
      };
    }),

  /**
   * Correct a specific field on a resource owned by the caller.
   */
  correctField: directorOrAbove
    .input(
      z.object({
        resource: z.enum(["Account", "Client"]),
        resourceId: z.string().min(1),
        field: z.string().min(1),
        newValue: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // ACH-034: never log `input` — newValue may be PII (phone, e-mail,
      // CPF). Whitelist the structural metadata; the actual value is the
      // sensitive bit and stays out of the log line.
      logger.warn(
        {
          tenantId: ctx.tenant.tenantId,
          resource: input.resource,
          field: input.field,
        },
        "ACH-001 stub: privacy.correctField invoked — requires implementation",
      );
      return {
        status: "not_implemented" as const,
        message:
          "Stub — aguardando whitelist de campos corrigíveis + AuditLog (ACH-001 follow-up).",
      };
    }),

  /**
   * Request deletion / anonymization of all data associated with the caller.
   */
  requestDeletion: directorOrAbove
    .input(z.object({ confirmation: z.literal("ERASE_MY_DATA") }))
    .mutation(async ({ ctx }) => {
      requirePermission(ctx.tenant.role as Role, "tenant:export");
      logger.warn(
        { tenantId: ctx.tenant.tenantId },
        "ACH-001 stub: privacy.requestDeletion invoked — requires implementation",
      );
      return {
        status: "not_implemented" as const,
        message:
          "Stub — aguardando anonymizeAccount worker + OTP (ACH-001 + ACH-011 follow-up).",
      };
    }),

  /**
   * Access log — return who accessed the caller's data and when.
   */
  accessLog: tenantProcedure
    .input(
      z.object({
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
        limit: z.number().int().min(1).max(1000).default(100),
      }),
    )
    .query(async ({ ctx, input }) => {
      logger.warn(
        { tenantId: ctx.tenant.tenantId, input },
        "ACH-001 stub: privacy.accessLog invoked — requires implementation",
      );
      return {
        status: "not_implemented" as const,
        entries: [] as Array<{
          timestamp: string;
          actor: string;
          action: string;
          resource: string;
        }>,
        message:
          "Stub — aguardando tabela AuditLog popular (ACH-020 follow-up).",
      };
    }),
});
