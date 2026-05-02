import { z } from "zod";
import { router, protectedProcedure } from "../trpc/trpc";
import { uuidSchema } from "@wbc/validators";
import { PrismaLoyaltyRepository } from "@wbc/business/loyalty/adapters/prisma-loyalty-repository";
import {
  earnFromSale,
  getLoyaltyBalance,
  getLoyaltyStatement,
  redeemPoints,
} from "@wbc/business/loyalty/use-cases/manage-loyalty";

const loyaltyRepo = new PrismaLoyaltyRepository();

// F11.E08: loyalty router. Earn is exposed as a manual procedure so the
// /clients/[id] page can credit a sale that pre-dated the feature; the
// automatic credit on SALE_CONFIRMED will land via an outbox handler in
// a follow-up so existing sale flow stays untouched here.
export const loyaltyRouter = router({
  getBalance: protectedProcedure
    .input(z.object({ clientId: uuidSchema }))
    .query(async ({ ctx, input }) => {
      return getLoyaltyBalance(
        ctx.tenant.tenantId,
        input.clientId,
        loyaltyRepo,
      );
    }),

  getStatement: protectedProcedure
    .input(
      z.object({
        clientId: uuidSchema,
        limit: z.number().int().min(1).max(500).default(100),
      }),
    )
    .query(async ({ ctx, input }) => {
      return getLoyaltyStatement(
        ctx.tenant.tenantId,
        input.clientId,
        loyaltyRepo,
        input.limit,
      );
    }),

  earnFromSale: protectedProcedure
    .input(
      z.object({
        clientId: uuidSchema,
        saleId: uuidSchema,
        saleTotal: z.number().positive(),
        multiplier: z.number().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return earnFromSale(
        { tenantId: ctx.tenant.tenantId, ...input },
        loyaltyRepo,
      );
    }),

  redeem: protectedProcedure
    .input(
      z.object({
        clientId: uuidSchema,
        points: z.number().int().positive(),
        note: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return redeemPoints(
        { tenantId: ctx.tenant.tenantId, ...input },
        loyaltyRepo,
      );
    }),
});
