import { TRPCError } from "@trpc/server";
import { router, authedProcedure } from "../trpc/trpc";
import { prisma } from "@wbc/db";
import { mfaConfirmEnrollmentSchema, mfaDisableSchema } from "@wbc/validators";
import { OtplibTotpService } from "@wbc/business/auth/adapters/otplib-totp-service.adapter";
import {
  BeginTotpEnrollment,
  ConfirmTotpEnrollment,
} from "@wbc/business/auth/use-cases/enable-totp.use-case";
import { DisableTotp } from "@wbc/business/auth/use-cases/disable-totp.use-case";

// ACH-003: MFA/TOTP integration. The crypto / DB plumbing already existed in
// `packages/business/auth/use-cases/{enable,disable,verify}-totp.use-case.ts`
// — this router exposes them so the web app can drive enrolment, status and
// rotation. Login enforcement lives in `apps/web/src/lib/auth.config.ts`.
const totpService = new OtplibTotpService();

export const mfaRouter = router({
  getStatus: authedProcedure.query(async ({ ctx }) => {
    const account = await prisma.account.findUnique({
      where: { id: ctx.accountId },
      select: {
        totpEnabled: true,
        totpActivatedAt: true,
        totpRecoveryCodes: true,
      },
    });
    if (!account) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });
    }
    return {
      enabled: account.totpEnabled,
      activatedAt: account.totpActivatedAt,
      recoveryCodesRemaining: account.totpRecoveryCodes.length,
    };
  }),

  beginEnrollment: authedProcedure.mutation(async ({ ctx }) => {
    const account = await prisma.account.findUnique({
      where: { id: ctx.accountId },
      select: { email: true, totpEnabled: true },
    });
    if (!account) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });
    }
    if (account.totpEnabled) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "TOTP já está habilitado nesta conta. Desabilite antes de iniciar nova matrícula.",
      });
    }
    const uc = new BeginTotpEnrollment(totpService);
    return uc.execute({ accountEmail: account.email });
  }),

  confirmEnrollment: authedProcedure
    .input(mfaConfirmEnrollmentSchema)
    .mutation(async ({ ctx, input }) => {
      const uc = new ConfirmTotpEnrollment(totpService);
      try {
        const out = await uc.execute({
          accountId: ctx.accountId,
          secret: input.secret,
          token: input.token,
        });
        return { recoveryCodes: out.recoveryCodes };
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: (err as Error).message,
        });
      }
    }),

  disable: authedProcedure
    .input(mfaDisableSchema)
    .mutation(async ({ ctx, input }) => {
      const uc = new DisableTotp(totpService);
      try {
        await uc.execute({
          accountId: ctx.accountId,
          currentToken: input.currentToken,
        });
        return { success: true as const };
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: (err as Error).message,
        });
      }
    }),
});
