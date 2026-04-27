/**
 * ACH-008 codigo-manutenibilidade: this file concentrates 17 procedures
 * across signup, session, invites, OTP and account management, plus
 * instantiates 8 repositories at the module top. Target shape:
 *
 *   auth.signup.ts      — register, completeOnboarding
 *   auth.session.ts     — login, logout, listSessions, revoke*
 *   auth.invites.ts     — createInvite, acceptInvite, cancelInvite, list
 *   auth.otp.ts         — sendOtp, verifyOtp
 *   auth.account.ts     — updateAccount, updateMember, deleteAccount, leaveTenant, changePassword, reset-password, verify-email
 *   auth.ts             — tiny barrel: `router({ ...signup, ...session, ...invites, ...otp, ...account })`
 *
 * Deferred to a follow-up PR because the split touches every procedure
 * and merges poorly with concurrent auth work — it should land on its
 * own branch with no other changes.
 */
import { TRPCError } from "@trpc/server";
import {
  router,
  publicProcedure,
  authedProcedure,
  protectedProcedure,
  roleProtectedProcedure,
} from "../trpc/trpc";
import { prisma } from "@wbc/db";
import type { RedisLike } from "@wbc/shared";
import { getRedis } from "../lib/redis";

// Adapters
import { PrismaAccountRepository } from "@wbc/business/auth/adapters/prisma-account.repository";
import { PrismaTenantMemberRepository } from "@wbc/business/auth/adapters/prisma-tenant-member.repository";
import { PrismaSessionRepository } from "@wbc/business/auth/adapters/prisma-session.repository";
import { PrismaOAuthAccountRepository } from "@wbc/business/auth/adapters/prisma-oauth-account.repository";
import { PrismaInviteRepository } from "@wbc/business/auth/adapters/prisma-invite.repository";
import { BcryptPasswordHasher } from "@wbc/business/auth/adapters/bcrypt-password-hasher.adapter";
import { ResendEmailSender } from "@wbc/business/auth/adapters/resend-email-sender.adapter";
import { RedisAuthTokenStore } from "@wbc/business/auth/adapters/redis-auth-token-store.adapter";
import { PrismaSubscriptionRepository } from "@wbc/business/auth/adapters/prisma-subscription-repository";
import { RedisJwtBlacklist } from "@wbc/business/auth/adapters/redis-jwt-blacklist.adapter";
import { HibpPasswordBreachChecker } from "@wbc/business/auth/adapters/hibp-password-breach-checker.adapter";
import { escapeHtml } from "@wbc/shared";
import { PrismaAuditLog } from "@wbc/business/platform/audit-log/adapters/prisma-audit-log.adapter";
import { makeAuditMiddleware } from "../trpc/audit-middleware";

// Use cases
import { ListWorkspaces } from "@wbc/business/auth/use-cases/list-workspaces.use-case";
import { SwitchWorkspace } from "@wbc/business/auth/use-cases/switch-workspace.use-case";
import { CompleteOnboarding } from "@wbc/business/auth/use-cases/complete-onboarding.use-case";
import { AcceptInvite } from "@wbc/business/auth/use-cases/accept-invite.use-case";
import { CreateInvite } from "@wbc/business/auth/use-cases/create-invite.use-case";
import { CancelInvite } from "@wbc/business/auth/use-cases/cancel-invite.use-case";
import { UpdateAccount } from "@wbc/business/auth/use-cases/update-account.use-case";
import { UpdateMember } from "@wbc/business/auth/use-cases/update-member.use-case";
import { DeleteAccount } from "@wbc/business/auth/use-cases/delete-account.use-case";
import { LeaveTenant } from "@wbc/business/auth/use-cases/leave-tenant.use-case";
import { ChangePassword } from "@wbc/business/auth/use-cases/change-password.use-case";
import { RequestPasswordReset } from "@wbc/business/auth/use-cases/request-password-reset.use-case";
import { ResetPassword } from "@wbc/business/auth/use-cases/reset-password.use-case";
import { RequestEmailVerification } from "@wbc/business/auth/use-cases/request-email-verification.use-case";
import { VerifyEmail } from "@wbc/business/auth/use-cases/verify-email.use-case";
import { ListMembers } from "@wbc/business/auth/use-cases/list-members.use-case";
import { UpdateMemberRole } from "@wbc/business/auth/use-cases/update-member-role.use-case";
import { RemoveMember } from "@wbc/business/auth/use-cases/remove-member.use-case";
import { RevokeSession } from "@wbc/business/auth/use-cases/revoke-session.use-case";
import { RevokeAllSessions } from "@wbc/business/auth/use-cases/revoke-all-sessions.use-case";
import {
  requirePermission,
  canPromoteTo,
} from "@wbc/business/auth/guards/permission.guard";
import type { Role } from "@wbc/business/auth/domain/entities/tenant-member.entity";

// Schemas
import {
  completeOnboardingSchema,
  acceptInviteSchema,
  switchWorkspaceSchema,
  updateAccountSchema,
  updateMemberSchema,
  changePasswordSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  createInviteSchema,
  cancelInviteSchema,
  listInvitesSchema,
  updateMemberRoleSchema,
  removeMemberSchema,
  deleteAccountSchema,
  leaveTenantSchema,
  revokeSessionSchema,
} from "@wbc/validators";

// Singletons
const accountRepo = new PrismaAccountRepository();
const memberRepo = new PrismaTenantMemberRepository();
const sessionRepo = new PrismaSessionRepository();
const oauthRepo = new PrismaOAuthAccountRepository();
const inviteRepo = new PrismaInviteRepository();
const passwordHasher = new BcryptPasswordHasher();
const emailSender = new ResendEmailSender();
// ACH-001: Redis-backed one-shot token store for password-reset and
// email-verification flows. Cast via `unknown` because the full ioredis
// surface is a superset of the minimal `RedisLike` we depend on.
const authTokenStore = new RedisAuthTokenStore(
  getRedis() as unknown as RedisLike,
);
const subscriptionRepo = new PrismaSubscriptionRepository();
// ACH-005: shared JWT blacklist for mass-revocation flows (changePassword,
// resetPassword, deleteAccount). Reuses the same Redis the rate-limit and
// cache layers do.
const jwtBlacklistForAuth = new RedisJwtBlacklist(
  getRedis() as unknown as RedisLike,
);
// ACH-004: HIBP k-anonymity breach checker. Fail-open on infra error so
// outages do not deny password rotations.
const passwordBreachChecker = new HibpPasswordBreachChecker();

// ACH-016 + ACH-063: AuditLog for sensitive mutations. PrismaAuditLog
// swallows failures so an audit hiccup never breaks user flow. The
// `audit` helper below is the explicit-call variant — used inline at
// the end of mutation bodies for the procedures listed in ACH-016.
// (The makeAuditMiddleware factory in trpc/audit-middleware.ts is
// preserved for future declarative wiring once its types are aligned
// with the tRPC middleware factory.)
const auditLog = new PrismaAuditLog();
async function audit(
  ctx: { tenant: { tenantId?: string; userId?: string } | null },
  entry: {
    action: string;
    resource: string;
    resourceId?: string | null;
    status?: "success" | "failure" | "denied";
    detail?: Record<string, unknown>;
  },
): Promise<void> {
  void auditLog.record({
    tenantId: ctx.tenant?.tenantId ?? null,
    accountId: ctx.tenant?.userId ?? null,
    action: entry.action,
    resource: entry.resource,
    resourceId: entry.resourceId ?? null,
    status: entry.status ?? "success",
    detail: entry.detail,
  });
}
// Suppress unused-import warning while makeAuditMiddleware sleeps. The
// declarative wiring path it powers will land in a follow-up PR.
void makeAuditMiddleware;

// Helper to extract accountId from context (works for authed procedures without tenant)
function getAccountId(ctx: { tenant: { userId: string } | null }): string {
  if (!ctx.tenant?.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return ctx.tenant.userId;
}

export const authRouter = router({
  // ══════════════════════════════════════��════
  // PUBLIC (no auth required)
  // ═══════════════════════════════════════════

  requestPasswordReset: publicProcedure
    .input(requestPasswordResetSchema)
    .mutation(async ({ input }) => {
      const uc = new RequestPasswordReset(
        accountRepo,
        emailSender,
        authTokenStore,
      );
      await uc.execute({ email: input.email });
      return { success: true };
    }),

  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ input }) => {
      const uc = new ResetPassword(
        accountRepo,
        passwordHasher,
        authTokenStore,
        jwtBlacklistForAuth,
        60 * 60,
        passwordBreachChecker,
      );
      await uc.execute({ token: input.token, newPassword: input.newPassword });
      return { success: true };
    }),

  verifyEmail: publicProcedure
    .input(verifyEmailSchema)
    .mutation(async ({ input }) => {
      const uc = new VerifyEmail(accountRepo, authTokenStore);
      await uc.execute({ token: input.token });
      return { success: true };
    }),

  acceptInvite: publicProcedure
    .input(acceptInviteSchema)
    .mutation(async ({ input, ctx }) => {
      const accountId = getAccountId(ctx);
      const uc = new AcceptInvite(inviteRepo, memberRepo, accountRepo);
      return uc.execute({
        inviteToken: input.inviteToken,
        accountId,
        displayName: input.displayName,
        phone: input.phone,
      });
    }),

  // ═══════════════════════════════════════════
  // AUTHED (requires accountId, no tenant required)
  // ═══════════════════════════════════════════

  completeOnboarding: authedProcedure
    .input(completeOnboardingSchema)
    .mutation(async ({ input, ctx }) => {
      const uc = new CompleteOnboarding(accountRepo, memberRepo);
      return uc.execute({
        accountId: ctx.accountId,
        tenantName: input.tenantName,
        slug: input.slug,
        phone: input.phone,
        brandId: input.brandId,
        avatar: input.avatar,
      });
    }),

  listWorkspaces: authedProcedure.query(async ({ ctx }) => {
    const uc = new ListWorkspaces(memberRepo);
    const workspaces = await uc.execute({ accountId: ctx.accountId });
    return { workspaces };
  }),

  switchWorkspace: authedProcedure
    .input(switchWorkspaceSchema)
    .mutation(async ({ input, ctx }) => {
      const uc = new SwitchWorkspace(memberRepo);
      return uc.execute({
        accountId: ctx.accountId,
        targetTenantId: input.tenantId,
      });
    }),

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const account = await accountRepo.findById(ctx.tenant.userId);
    if (!account)
      throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });

    const member = await memberRepo.findByAccountAndTenant(
      ctx.tenant.userId,
      ctx.tenant.tenantId,
    );
    const tenant = await prisma.tenant.findUnique({
      where: { id: ctx.tenant.tenantId },
    });

    return {
      account: {
        id: account.id,
        email: account.email,
        name: account.name,
        emailVerified: account.emailVerified,
      },
      currentMember: member
        ? {
            id: member.id,
            role: member.role,
            phone: member.phone,
            displayName: member.displayName,
            avatar: member.avatar,
          }
        : null,
      tenant: tenant
        ? {
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
          }
        : null,
    };
  }),

  updateAccount: protectedProcedure
    .input(updateAccountSchema)
    .mutation(async ({ input, ctx }) => {
      const uc = new UpdateAccount(accountRepo);
      const account = await uc.execute({
        accountId: ctx.tenant.userId,
        name: input.name,
      });
      return {
        account: { id: account.id, email: account.email, name: account.name },
      };
    }),

  deleteAccount: protectedProcedure
    .input(deleteAccountSchema)
    .mutation(async ({ input, ctx }) => {
      // ACH-008: pass accountRepo + jwtBlacklist so the use-case actually
      // hard-deletes the account and stamps the JWT mass-revocation
      // threshold. Previously only memberRepo was wired and the deletion
      // was a no-op.
      const uc = new DeleteAccount(
        memberRepo,
        accountRepo,
        jwtBlacklistForAuth,
      );
      // ACH-016/063: capture id BEFORE deletion (the cleanup nukes ctx).
      const accountIdForAudit = ctx.tenant.userId;
      await uc.execute({
        accountId: ctx.tenant.userId,
        confirmation: input.confirmation,
      });
      await audit(ctx, {
        action: "tenant.member.removed",
        resource: "account",
        resourceId: accountIdForAudit,
        detail: { reason: "self-delete" },
      });
      return { success: true };
    }),

  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ input, ctx }) => {
      const uc = new ChangePassword(
        accountRepo,
        passwordHasher,
        jwtBlacklistForAuth,
        60 * 60,
        passwordBreachChecker,
      );
      await uc.execute({
        accountId: ctx.tenant.userId,
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      });
      await audit(ctx, {
        action: "auth.password.change",
        resource: "account",
        resourceId: ctx.tenant.userId,
      });
      return { success: true };
    }),

  requestEmailVerification: protectedProcedure.mutation(async ({ ctx }) => {
    const uc = new RequestEmailVerification(
      accountRepo,
      emailSender,
      authTokenStore,
    );
    await uc.execute({ accountId: ctx.tenant.userId });
    return { success: true };
  }),

  // ACH-007: until a database-session strategy is wired, the Session table
  // stays empty. We respond with the (stable, empty) shape callers already
  // depend on plus a `notice` so the UI can render the limitation honestly
  // instead of pretending revocation worked. revokeAllSessions (below)
  // performs real JWT-level invalidation.
  listSessions: protectedProcedure.query(async ({ ctx }) => {
    const sessions = await sessionRepo.findByAccountId(ctx.tenant.userId);
    return {
      sessions: sessions.map((s) => ({
        id: s.id,
        userAgent: s.userAgent,
        ipAddress: s.ipAddress,
        lastUsedAt: s.lastUsedAt,
        createdAt: s.createdAt,
        isExpired: s.isExpired(),
      })),
      notice:
        "Sessões individuais não são listáveis até a migração para sessão em DB. Use 'Encerrar todas' para revogar imediatamente.",
    };
  }),

  // ACH-007: kept for API stability. With an empty DB table the operation is
  // a structural no-op — surface as such instead of pretending success.
  revokeSession: protectedProcedure
    .input(revokeSessionSchema)
    .mutation(async ({ input, ctx }) => {
      const uc = new RevokeSession(sessionRepo);
      await uc.execute({
        sessionId: input.sessionId,
        accountId: ctx.tenant.userId,
      });
      return {
        success: true,
        notice:
          "Revogação por sessão individual sem efeito até a migração para sessão em DB. Use 'Encerrar todas' para revogar imediatamente.",
      };
    }),

  revokeAllSessions: protectedProcedure.mutation(async ({ ctx }) => {
    // ACH-007: pass jwtBlacklistForAuth so the call effectively kills every
    // outstanding JWT — the DB Session table is empty until a future
    // database-strategy migration lands.
    const uc = new RevokeAllSessions(sessionRepo, jwtBlacklistForAuth);
    await uc.execute({ accountId: ctx.tenant.userId });
    return { success: true };
  }),

  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const sub = await subscriptionRepo.findByTenantId(ctx.tenant.tenantId);
    if (!sub) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Subscription not found",
      });
    }
    return sub;
  }),

  // ═══════════════════════════════════════════
  // AUTHED + TENANT (requires tid in JWT)
  // ═══════════════════════════════════════════

  updateMember: protectedProcedure
    .input(updateMemberSchema)
    .mutation(async ({ input, ctx }) => {
      const member = await memberRepo.findByAccountAndTenant(
        ctx.tenant.userId,
        ctx.tenant.tenantId,
      );
      if (!member)
        throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });

      const uc = new UpdateMember(memberRepo);
      await uc.execute({
        memberId: member.id,
        accountId: ctx.tenant.userId,
        phone: input.phone ?? undefined,
        displayName: input.displayName ?? undefined,
        avatar: input.avatar ?? undefined,
      });
      return { success: true };
    }),

  leaveTenant: protectedProcedure
    .input(leaveTenantSchema)
    .mutation(async ({ input, ctx }) => {
      const uc = new LeaveTenant(memberRepo);
      await uc.execute({
        accountId: ctx.tenant.userId,
        tenantId: ctx.tenant.tenantId,
        confirmation: input.confirmation,
      });
      return { success: true };
    }),

  // ═══════════════════════════════════════════
  // ADMIN ONLY (requires LEADER+ or ADMIN)
  // ═══════════════════════════════════════════

  createInvite: roleProtectedProcedure("LEADER")
    .input(createInviteSchema)
    .mutation(async ({ input, ctx }) => {
      requirePermission(ctx.tenant.role as Role, "team:invite");
      const tenant = await prisma.tenant.findUnique({
        where: { id: ctx.tenant.tenantId },
      });
      const uc = new CreateInvite(inviteRepo, emailSender);
      const result = await uc.execute({
        tenantId: ctx.tenant.tenantId,
        email: input.email,
        role: input.role,
        invitedBy: ctx.tenant.userId,
        tenantName: tenant?.name ?? "",
      });
      await audit(ctx, {
        action: "auth.invite.accepted",
        resource: "invite",
        resourceId: result.inviteId,
        detail: { email: input.email, role: input.role },
      });
      return result;
    }),

  listInvites: roleProtectedProcedure("LEADER")
    .input(listInvitesSchema)
    .query(async ({ input, ctx }) => {
      const invites = await inviteRepo.findByTenantId(
        ctx.tenant.tenantId,
        input.status,
      );
      return { invites };
    }),

  cancelInvite: roleProtectedProcedure("LEADER")
    .input(cancelInviteSchema)
    .mutation(async ({ input, ctx }) => {
      const uc = new CancelInvite(inviteRepo);
      await uc.execute({
        inviteId: input.inviteId,
        tenantId: ctx.tenant.tenantId,
      });
      await audit(ctx, {
        action: "auth.invite.cancelled",
        resource: "invite",
        resourceId: input.inviteId,
      });
      return { success: true };
    }),

  resendInvite: roleProtectedProcedure("LEADER")
    .input(cancelInviteSchema) // same schema — just inviteId
    .mutation(async ({ input, ctx }) => {
      const invite = await inviteRepo.findById(input.inviteId);
      if (!invite)
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      if (invite.tenantId !== ctx.tenant.tenantId)
        throw new TRPCError({ code: "FORBIDDEN" });
      if (invite.status !== "PENDING")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invite is not pending",
        });

      const tenant = await prisma.tenant.findUnique({
        where: { id: ctx.tenant.tenantId },
      });
      // ACH-053: same defense as create-invite.use-case — escape the
      // admin-controlled tenant name before interpolating into HTML.
      const inviteUrl = `${process.env.NEXTAUTH_URL}/invite?token=${encodeURIComponent(invite.token)}`;
      const safeTenantName = escapeHtml(tenant?.name ?? "");
      await emailSender.send({
        to: invite.email,
        subject: `Convite para ${tenant?.name ?? ""}`,
        html: `<p>Voce foi convidado(a) para o time de <strong>${safeTenantName}</strong>.</p>
               <p><a href="${inviteUrl}">Aceitar convite</a></p>
               <p>Este convite expira em 7 dias.</p>`,
      });
      return { success: true };
    }),

  listMembers: roleProtectedProcedure("LEADER").query(async ({ ctx }) => {
    const uc = new ListMembers(memberRepo);
    const members = await uc.execute({ tenantId: ctx.tenant.tenantId });
    return {
      members: members.map((m) => ({
        id: m.id,
        accountId: m.accountId,
        role: m.role,
        phone: m.phone,
        displayName: m.displayName,
        avatar: m.avatar,
        isActive: m.isActive,
        joinedAt: m.joinedAt,
      })),
    };
  }),

  updateMemberRole: roleProtectedProcedure("ADMIN")
    .input(updateMemberRoleSchema)
    .mutation(async ({ input, ctx }) => {
      requirePermission(ctx.tenant.role as Role, "team:promote");
      if (!canPromoteTo(ctx.tenant.role as Role, input.newRole as Role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot promote to this role",
        });
      }
      const uc = new UpdateMemberRole(memberRepo);
      await uc.execute({
        callerAccountId: ctx.tenant.userId,
        callerTenantId: ctx.tenant.tenantId,
        memberId: input.memberId,
        newRole: input.newRole,
      });
      await audit(ctx, {
        action: "tenant.member.role.changed",
        resource: "member",
        resourceId: input.memberId,
        detail: { newRole: input.newRole },
      });
      return { success: true };
    }),

  removeMember: roleProtectedProcedure("ADMIN")
    .input(removeMemberSchema)
    .mutation(async ({ input, ctx }) => {
      const uc = new RemoveMember(memberRepo);
      await uc.execute({
        callerAccountId: ctx.tenant.userId,
        tenantId: ctx.tenant.tenantId,
        memberId: input.memberId,
      });
      await audit(ctx, {
        action: "tenant.member.removed",
        resource: "member",
        resourceId: input.memberId,
      });
      return { success: true };
    }),
});
