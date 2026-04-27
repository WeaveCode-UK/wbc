// ACH-006 confiabilidade-resiliencia: admin router. Primeiro caso de uso
// é replay de DLQ; ampliar conforme demanda operacional.

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { PrismaOutboxRepository } from "@wbc/db";
import { router, roleProtectedProcedure } from "../trpc/trpc";
import type { RedisLike } from "@wbc/shared";
import { getRedis } from "../lib/redis";
import { RedisJwtBlacklist } from "@wbc/business/auth/adapters/redis-jwt-blacklist.adapter";
import { PrismaAuditLog } from "@wbc/business/platform/audit-log/adapters/prisma-audit-log.adapter";

const outboxRepo = new PrismaOutboxRepository();

const adminProcedure = roleProtectedProcedure("ADMIN");

// ACH-066: shared blacklist for admin-driven incident response.
const incidentJwtBlacklist = new RedisJwtBlacklist(
  getRedis() as unknown as RedisLike,
);

const REVOKE_TTL_SECONDS = 60 * 60;

// ACH-016/063: persist sensitive admin actions for forensic review.
const auditLog = new PrismaAuditLog();

export const adminRouter = router({
  dlq: router({
    list: adminProcedure
      .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }))
      .query(async ({ input }) => {
        const rows = await outboxRepo.listDLQ(input.limit);
        // ACH-036: DLQ rows carry the original event payload, which for
        // domain events like CLIENT_CREATED / SALE_CREATED includes PII.
        // Strip payloads from the list view; admins fetch the full record
        // by id when actually replaying via `dlq.replay`.
        const redacted = rows.map((row: Record<string, unknown>) => {
          const { payload: _payload, ...rest } = row as {
            payload?: unknown;
          } & Record<string, unknown>;
          return { ...rest, payloadRedacted: true as const };
        });
        return { items: redacted, count: redacted.length };
      }),

    replay: adminProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        const ok = await outboxRepo.replayFromDLQ(input.id);
        if (!ok) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Outbox event ${input.id} not found in DLQ`,
          });
        }
        // ACH-016/063: replay rewrites event flow — audit-worthy.
        void auditLog.record({
          tenantId: ctx.tenant.tenantId,
          accountId: ctx.tenant.userId,
          action: "admin.dlq.replayed",
          resource: "outbox.dlq",
          resourceId: input.id,
          status: "success",
        });
        return { replayed: true, id: input.id };
      }),
  }),

  // ACH-066: incident-response mass session revocation. Per-tenant cuts
  // every active member of one workspace; global is the break-glass that
  // logs the entire platform out at once. Both are gated by ADMIN role,
  // and the global one demands a literal confirmation string so it cannot
  // fire from a misclick.
  sessions: router({
    revokeAllForTenant: adminProcedure
      .input(z.object({ tenantId: z.string().uuid() }))
      .mutation(async ({ input, ctx }) => {
        const nowUnix = Math.floor(Date.now() / 1000);
        await incidentJwtBlacklist.revokeAllForTenant({
          tenantId: input.tenantId,
          revokedBeforeUnix: nowUnix,
          ttlSeconds: REVOKE_TTL_SECONDS,
        });
        void auditLog.record({
          tenantId: ctx.tenant.tenantId,
          accountId: ctx.tenant.userId,
          action: "auth.session.revoked",
          resource: "tenant",
          resourceId: input.tenantId,
          status: "success",
          detail: { scope: "tenant", at: nowUnix },
        });
        return { revoked: true, tenantId: input.tenantId, at: nowUnix };
      }),

    revokeAllGlobal: adminProcedure
      .input(
        z.object({
          confirmation: z.literal("REVOKE-ALL-SESSIONS"),
        }),
      )
      .mutation(async ({ ctx }) => {
        const nowUnix = Math.floor(Date.now() / 1000);
        await incidentJwtBlacklist.revokeAllGlobal({
          revokedBeforeUnix: nowUnix,
          ttlSeconds: REVOKE_TTL_SECONDS,
        });
        void auditLog.record({
          tenantId: ctx.tenant.tenantId,
          accountId: ctx.tenant.userId,
          action: "auth.session.revoked",
          resource: "platform",
          resourceId: null,
          status: "success",
          detail: { scope: "global", at: nowUnix },
        });
        return { revoked: true, scope: "global" as const, at: nowUnix };
      }),
  }),
});
