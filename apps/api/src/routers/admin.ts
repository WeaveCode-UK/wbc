// ACH-006 confiabilidade-resiliencia: admin router. Primeiro caso de uso
// é replay de DLQ; ampliar conforme demanda operacional.

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { PrismaOutboxRepository } from "@wbc/db";
import { router, roleProtectedProcedure } from "../trpc/trpc";
import type { RedisLike } from "@wbc/shared";
import { getRedis } from "../lib/redis";
import { RedisJwtBlacklist } from "@wbc/business/auth/adapters/redis-jwt-blacklist.adapter";

const outboxRepo = new PrismaOutboxRepository();

const adminProcedure = roleProtectedProcedure("ADMIN");

// ACH-066: shared blacklist for admin-driven incident response.
const incidentJwtBlacklist = new RedisJwtBlacklist(
  getRedis() as unknown as RedisLike,
);

const REVOKE_TTL_SECONDS = 60 * 60;

export const adminRouter = router({
  dlq: router({
    list: adminProcedure
      .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }))
      .query(async ({ input }) => {
        const rows = await outboxRepo.listDLQ(input.limit);
        return { items: rows, count: rows.length };
      }),

    replay: adminProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ input }) => {
        const ok = await outboxRepo.replayFromDLQ(input.id);
        if (!ok) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Outbox event ${input.id} not found in DLQ`,
          });
        }
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
      .mutation(async ({ input }) => {
        const nowUnix = Math.floor(Date.now() / 1000);
        await incidentJwtBlacklist.revokeAllForTenant({
          tenantId: input.tenantId,
          revokedBeforeUnix: nowUnix,
          ttlSeconds: REVOKE_TTL_SECONDS,
        });
        return { revoked: true, tenantId: input.tenantId, at: nowUnix };
      }),

    revokeAllGlobal: adminProcedure
      .input(
        z.object({
          confirmation: z.literal("REVOKE-ALL-SESSIONS"),
        }),
      )
      .mutation(async () => {
        const nowUnix = Math.floor(Date.now() / 1000);
        await incidentJwtBlacklist.revokeAllGlobal({
          revokedBeforeUnix: nowUnix,
          ttlSeconds: REVOKE_TTL_SECONDS,
        });
        return { revoked: true, scope: "global" as const, at: nowUnix };
      }),
  }),
});
