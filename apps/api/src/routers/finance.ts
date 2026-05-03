import { z } from "zod";
import {
  router,
  protectedProcedure,
  roleProtectedProcedure,
} from "../trpc/trpc";
import { createDeleteProcedure } from "../trpc/crud-helpers";
import { idempotent } from "../trpc/idempotency-middleware";
import { PrismaExpenseRepository } from "../../../../packages/business/finance/adapters/prisma-expense-repository";
import { PrismaFinanceRepository } from "../../../../packages/business/finance/adapters/prisma-finance-repository";
import {
  listExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../../../../packages/business/finance/use-cases/manage-expenses";
import { getFinanceDashboard } from "../../../../packages/business/finance/use-cases/get-dashboard";
import {
  getMargin,
  getGoalReverse,
  getCAC,
} from "../../../../packages/business/finance/use-cases/calculators";
import { paginationSchema, uuidSchema } from "@wbc/validators";
import { requirePermission } from "@wbc/business/auth/guards/permission.guard";
import type { Role } from "@wbc/business/auth/domain/entities/tenant-member.entity";
import {
  connectMercadoPago,
  disconnectMercadoPago,
  getMercadoPagoStatus,
  MercadoPagoOAuthNotConfiguredError,
} from "@wbc/business/finance/use-cases/connect-mercadopago";
import { TRPCError } from "@trpc/server";

const expenseRepo = new PrismaExpenseRepository();
const financeRepo = new PrismaFinanceRepository();

// ACH-011: write-side and billing-side procedures escalate to DIRECTOR/ADMIN.
// Read-side (dashboard, calculators, getCAC) stays at protectedProcedure
// because numbers are tenant-scoped data the whole team needs.
const directorOrAbove = roleProtectedProcedure("DIRECTOR");
const adminOnly = roleProtectedProcedure("ADMIN");

export const financeRouter = router({
  getDashboard: protectedProcedure
    .input(z.object({ period: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return getFinanceDashboard(
        ctx.tenant.tenantId,
        input.period,
        financeRepo,
      );
    }),

  listExpenses: protectedProcedure
    .input(
      z.object({
        ...paginationSchema.shape,
        category: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return listExpenses(
        ctx.tenant.tenantId,
        { category: input.category, page: input.page, limit: input.limit },
        expenseRepo,
      );
    }),

  // ACH-011: expense write-path is DIRECTOR+. CONSULTANT could otherwise
  // inject arbitrary expense lines into the tenant's books.
  createExpense: directorOrAbove
    .input(
      z.object({
        idempotencyKey: z.string().uuid().optional(),
        description: z.string().min(1),
        amount: z.number().positive(),
        category: z.string().optional(),
        date: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { idempotencyKey, ...expenseInput } = input;
      return idempotent(idempotencyKey, () =>
        createExpense(
          { tenantId: ctx.tenant.tenantId, ...expenseInput },
          expenseRepo,
        ),
      );
    }),

  updateExpense: directorOrAbove
    .input(
      z.object({
        id: uuidSchema,
        description: z.string().optional(),
        amount: z.number().positive().optional(),
        category: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return updateExpense(ctx.tenant.tenantId, id, data, expenseRepo);
    }),

  deleteExpense: createDeleteProcedure((tenantId, id) =>
    deleteExpense(tenantId, id, expenseRepo),
  ),

  calculateMargin: protectedProcedure
    .input(
      z.object({
        costPrice: z.number().positive(),
        salePrice: z.number().positive(),
      }),
    )
    .query(async ({ input }) => {
      return getMargin(input.costPrice, input.salePrice);
    }),

  calculateGoalReverse: protectedProcedure
    .input(z.object({ targetIncome: z.number().positive() }))
    .query(async ({ input }) => {
      return getGoalReverse(input.targetIncome, 30); // default 30% margin
    }),

  getCAC: protectedProcedure
    .input(z.object({ clientId: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      return getCAC(ctx.tenant.tenantId, input.clientId, financeRepo);
    }),

  // ACH-011: billing/payment integrations are ADMIN-only AND require the
  // dedicated `tenant:billing` permission. Two gates so a future ADMIN role
  // remap cannot silently expose this surface.
  //
  // Bloco 10 do plano: stub substituído por OAuth real. Pré-req para
  // funcionar: MERCADOPAGO_CLIENT_ID e MERCADOPAGO_CLIENT_SECRET no .env
  // do operador-mãe + redirect URI registrada no painel MP.
  connectMercadoPago: adminOnly
    .input(
      z.object({
        authCode: z.string().min(1),
        redirectUri: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requirePermission(ctx.tenant.role as Role, "tenant:billing");
      try {
        const result = await connectMercadoPago(
          ctx.tenant.tenantId,
          input.authCode,
          input.redirectUri,
        );
        return { success: true, ...result };
      } catch (error) {
        if (error instanceof MercadoPagoOAuthNotConfiguredError) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: error.message,
          });
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error ? error.message : "mercadopago_oauth_failed",
        });
      }
    }),

  disconnectMercadoPago: adminOnly.mutation(async ({ ctx }) => {
    requirePermission(ctx.tenant.role as Role, "tenant:billing");
    await disconnectMercadoPago(ctx.tenant.tenantId);
    return { success: true };
  }),

  getMercadoPagoStatus: protectedProcedure.query(async ({ ctx }) => {
    return getMercadoPagoStatus(ctx.tenant.tenantId);
  }),
});
