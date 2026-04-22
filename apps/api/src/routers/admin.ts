// ACH-006 confiabilidade-resiliencia: admin router. Primeiro caso de uso
// é replay de DLQ; ampliar conforme demanda operacional.

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { PrismaOutboxRepository } from "@wbc/db";
import { router, roleProtectedProcedure } from "../trpc/trpc";

const outboxRepo = new PrismaOutboxRepository();

const adminProcedure = roleProtectedProcedure("ADMIN");

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
});
