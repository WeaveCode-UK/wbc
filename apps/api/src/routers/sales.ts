import { z } from "zod";
import { prisma } from "@wbc/db";
import { router, protectedProcedure } from "../trpc/trpc";
import { createGetByIdProcedure } from "../trpc/crud-helpers";
import { idempotent } from "../trpc/idempotency-middleware";
import { applyOutboxBackpressure } from "../trpc/outbox-backpressure-middleware";
import { PrismaSaleRepository } from "../../../../packages/business/sales/adapters/prisma-sale-repository";
import { PrismaPaymentRepository } from "../../../../packages/business/sales/adapters/prisma-payment-repository";
import { PrismaCashbackRepository } from "../../../../packages/business/sales/adapters/prisma-cashback-repository";
import { PrismaReturnRepository } from "../../../../packages/business/sales/adapters/prisma-return-repository";
import { createSale } from "../../../../packages/business/sales/use-cases/create-sale";
import { confirmSale } from "../../../../packages/business/sales/use-cases/confirm-sale";
import { cancelSale } from "../../../../packages/business/sales/use-cases/cancel-sale";
import { listSales } from "../../../../packages/business/sales/use-cases/list-sales";
import { getSaleById } from "../../../../packages/business/sales/use-cases/get-sale-by-id";
import { updateSaleStatus } from "../../../../packages/business/sales/use-cases/update-sale-status";
import {
  listPayments,
  markPaid,
  getAccountsReceivable,
} from "../../../../packages/business/sales/use-cases/manage-payments";
import { getCashbackBalance } from "../../../../packages/business/sales/use-cases/manage-cashback";
import { flagExpiringCashbacks } from "@wbc/business/sales/use-cases/flag-expiring-cashback";
import { createReturn } from "../../../../packages/business/sales/use-cases/create-return";
import { paginationSchema, uuidSchema } from "@wbc/validators";
import { listOk } from "../trpc/responses";

const saleRepo = new PrismaSaleRepository();
const paymentRepo = new PrismaPaymentRepository();
const cashbackRepo = new PrismaCashbackRepository();
const returnRepo = new PrismaReturnRepository();

export const salesRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        ...paginationSchema.shape,
        status: z.string().optional(),
        clientId: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // ACH-007 apis-integracoes: canonical pagination envelope.
      const result = await listSales(
        ctx.tenant.tenantId,
        {
          status: input.status,
          clientId: input.clientId,
          page: input.page,
          limit: input.limit,
        },
        saleRepo,
      );
      return listOk(result.data, {
        page: input.page,
        limit: input.limit,
        total: result.total,
      });
    }),

  getById: createGetByIdProcedure((tenantId, id) =>
    getSaleById(tenantId, id, saleRepo),
  ),

  create: protectedProcedure
    .input(
      z.object({
        idempotencyKey: z.string().uuid().optional(),
        clientId: z.string().uuid(),
        items: z.array(
          z.object({
            productId: z.string().uuid(),
            quantity: z.number().int().positive(),
            unitPrice: z.number().positive(),
          }),
        ),
        paymentMethod: z.string().optional(),
        discount: z.number().min(0).optional(),
        cashbackUsed: z.number().min(0).optional(),
        campaignId: z.string().uuid().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { idempotencyKey, ...saleInput } = input;
      return idempotent(idempotencyKey, () =>
        createSale(
          { ...saleInput, tenantId: ctx.tenant.tenantId },
          saleRepo,
          cashbackRepo,
        ),
      );
    }),

  confirm: protectedProcedure
    .input(
      z.object({
        idempotencyKey: z.string().uuid().optional(),
        id: uuidSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // ACH-007 confiabilidade-resiliencia: pilot — confirmSale publica
      // SALE_CONFIRMED no outbox. Se o worker está atrasado, rejeitamos
      // cedo para não ampliar a fila. Rollout para demais mutations em
      // docs/RELIABILITY-FOLLOWUP.md.
      applyOutboxBackpressure("sales.confirm");
      return idempotent(input.idempotencyKey, () =>
        confirmSale(ctx.tenant.tenantId, input.id, saleRepo, cashbackRepo),
      );
    }),

  cancel: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      return cancelSale(ctx.tenant.tenantId, input.id, saleRepo);
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: uuidSchema,
        status: z.enum([
          "CONFIRMED",
          "SEPARATED",
          "SHIPPED",
          "DELIVERED",
          "CANCELLED",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return updateSaleStatus(
        ctx.tenant.tenantId,
        input.id,
        input.status,
        saleRepo,
      );
    }),

  listPayments: protectedProcedure
    .input(z.object({ saleId: uuidSchema }))
    .query(async ({ ctx, input }) => {
      return listPayments(ctx.tenant.tenantId, input.saleId, paymentRepo);
    }),

  markPaid: protectedProcedure
    .input(
      z.object({
        idempotencyKey: z.string().uuid().optional(),
        paymentId: uuidSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return idempotent(input.idempotencyKey, () =>
        markPaid(ctx.tenant.tenantId, input.paymentId, paymentRepo),
      );
    }),

  getCashbackBalance: protectedProcedure
    .input(z.object({ clientId: uuidSchema }))
    .query(async ({ ctx, input }) => {
      return getCashbackBalance(
        ctx.tenant.tenantId,
        input.clientId,
        cashbackRepo,
      );
    }),

  createReturn: protectedProcedure
    .input(
      z.object({
        idempotencyKey: z.string().uuid().optional(),
        saleId: uuidSchema,
        reason: z.string().min(1),
        refundAmount: z.number().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { idempotencyKey, ...returnInput } = input;
      return idempotent(idempotencyKey, () =>
        createReturn(
          { tenantId: ctx.tenant.tenantId, ...returnInput },
          saleRepo,
          returnRepo,
        ),
      );
    }),

  getAccountsReceivable: protectedProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return getAccountsReceivable(ctx.tenant.tenantId, input, paymentRepo);
    }),

  // F11.E15: list returns for the /sales/returns page.
  listReturns: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }))
    .query(async ({ ctx, input }) => {
      return returnRepo.listByTenant(ctx.tenant.tenantId, input.limit);
    }),

  // F11.E26: campaign conversion stats. Sums confirmed sales tied to
  // the given campaignId so the campaigns/[id] page can render
  // revenue + conversion%.
  getConversionStats: protectedProcedure
    .input(z.object({ campaignId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const aggregate = await prisma.sale.aggregate({
        where: {
          tenantId: ctx.tenant.tenantId,
          campaignId: input.campaignId,
          status: { in: ["CONFIRMED", "DELIVERED"] },
        },
        _sum: { total: true },
        _count: { _all: true },
      });
      const recipientCount = await prisma.campaignRecipient.count({
        where: { campaignId: input.campaignId },
      });
      const purchased = aggregate._count._all;
      const revenue = Number(aggregate._sum.total ?? 0);
      const conversion = recipientCount > 0 ? purchased / recipientCount : 0;
      return { purchased, revenue, recipientCount, conversion };
    }),

  // F11.E12: scan for cashbacks expiring within `lookaheadDays` and
  // create one notification per client. Manual trigger now; the cron
  // wiring is a follow-up.
  flagExpiringCashbacks: protectedProcedure
    .input(
      z.object({
        lookaheadDays: z.number().int().min(1).max(60).default(7),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return flagExpiringCashbacks(ctx.tenant.tenantId, input.lookaheadDays);
    }),
});
