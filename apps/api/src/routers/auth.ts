import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure, roleProtectedProcedure } from '../trpc/trpc';
import { prisma } from '@wbc/db';

// Adapters
import { PrismaAccountRepository } from '@wbc/business/auth/adapters/prisma-account.repository';
import { PrismaTenantMemberRepository } from '@wbc/business/auth/adapters/prisma-tenant-member.repository';
import { PrismaSessionRepository } from '@wbc/business/auth/adapters/prisma-session.repository';
import { PrismaOAuthAccountRepository } from '@wbc/business/auth/adapters/prisma-oauth-account.repository';
import { PrismaInviteRepository } from '@wbc/business/auth/adapters/prisma-invite.repository';
import { BcryptPasswordHasher } from '@wbc/business/auth/adapters/bcrypt-password-hasher.adapter';
import { ResendEmailSender } from '@wbc/business/auth/adapters/resend-email-sender.adapter';
import { PrismaSubscriptionRepository } from '@wbc/business/auth/adapters/prisma-subscription-repository';

// Use cases
import { ListWorkspaces } from '@wbc/business/auth/use-cases/list-workspaces.use-case';
import { SwitchWorkspace } from '@wbc/business/auth/use-cases/switch-workspace.use-case';
import { CompleteOnboarding } from '@wbc/business/auth/use-cases/complete-onboarding.use-case';
import { AcceptInvite } from '@wbc/business/auth/use-cases/accept-invite.use-case';
import { CreateInvite } from '@wbc/business/auth/use-cases/create-invite.use-case';
import { CancelInvite } from '@wbc/business/auth/use-cases/cancel-invite.use-case';
import { UpdateAccount } from '@wbc/business/auth/use-cases/update-account.use-case';
import { UpdateMember } from '@wbc/business/auth/use-cases/update-member.use-case';
import { DeleteAccount } from '@wbc/business/auth/use-cases/delete-account.use-case';
import { LeaveTenant } from '@wbc/business/auth/use-cases/leave-tenant.use-case';
import { ChangePassword } from '@wbc/business/auth/use-cases/change-password.use-case';
import { RequestPasswordReset } from '@wbc/business/auth/use-cases/request-password-reset.use-case';
import { ResetPassword } from '@wbc/business/auth/use-cases/reset-password.use-case';
import { RequestEmailVerification } from '@wbc/business/auth/use-cases/request-email-verification.use-case';
import { VerifyEmail } from '@wbc/business/auth/use-cases/verify-email.use-case';
import { ListMembers } from '@wbc/business/auth/use-cases/list-members.use-case';
import { UpdateMemberRole } from '@wbc/business/auth/use-cases/update-member-role.use-case';
import { RemoveMember } from '@wbc/business/auth/use-cases/remove-member.use-case';
import { RevokeSession } from '@wbc/business/auth/use-cases/revoke-session.use-case';
import { RevokeAllSessions } from '@wbc/business/auth/use-cases/revoke-all-sessions.use-case';
import { requirePermission, canPromoteTo } from '@wbc/business/auth/guards/permission.guard';
import type { Role } from '@wbc/business/auth/domain/entities/tenant-member.entity';

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
} from '@wbc/validators';

// Singletons
const accountRepo = new PrismaAccountRepository();
const memberRepo = new PrismaTenantMemberRepository();
const sessionRepo = new PrismaSessionRepository();
const oauthRepo = new PrismaOAuthAccountRepository();
const inviteRepo = new PrismaInviteRepository();
const passwordHasher = new BcryptPasswordHasher();
const emailSender = new ResendEmailSender();
const subscriptionRepo = new PrismaSubscriptionRepository();

// Helper to extract accountId from context (works for authed procedures without tenant)
function getAccountId(ctx: { tenant: { userId: string } | null }): string {
  if (!ctx.tenant?.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
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
      const uc = new RequestPasswordReset(accountRepo, emailSender);
      await uc.execute({ email: input.email });
      return { success: true };
    }),

  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ input }) => {
      const uc = new ResetPassword(accountRepo, passwordHasher);
      await uc.execute({ token: input.token, newPassword: input.newPassword });
      return { success: true };
    }),

  verifyEmail: publicProcedure
    .input(verifyEmailSchema)
    .mutation(async ({ input }) => {
      const uc = new VerifyEmail(accountRepo);
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

  completeOnboarding: protectedProcedure
    .input(completeOnboardingSchema)
    .mutation(async ({ input, ctx }) => {
      const uc = new CompleteOnboarding(accountRepo, memberRepo);
      return uc.execute({
        accountId: ctx.tenant.userId,
        tenantName: input.tenantName,
        slug: input.slug,
        phone: input.phone,
        brandId: input.brandId,
        avatar: input.avatar,
      });
    }),

  listWorkspaces: protectedProcedure
    .query(async ({ ctx }) => {
      const uc = new ListWorkspaces(memberRepo);
      const workspaces = await uc.execute({ accountId: ctx.tenant.userId });
      return { workspaces };
    }),

  switchWorkspace: protectedProcedure
    .input(switchWorkspaceSchema)
    .mutation(async ({ input, ctx }) => {
      const uc = new SwitchWorkspace(memberRepo);
      return uc.execute({
        accountId: ctx.tenant.userId,
        targetTenantId: input.tenantId,
      });
    }),

  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const account = await accountRepo.findById(ctx.tenant.userId);
      if (!account) throw new TRPCError({ code: 'NOT_FOUND', message: 'Account not found' });

      const member = await memberRepo.findByAccountAndTenant(ctx.tenant.userId, ctx.tenant.tenantId);
      const tenant = await prisma.tenant.findUnique({ where: { id: ctx.tenant.tenantId } });

      return {
        account: {
          id: account.id,
          email: account.email,
          name: account.name,
          emailVerified: account.emailVerified,
        },
        currentMember: member ? {
          id: member.id,
          role: member.role,
          phone: member.phone,
          displayName: member.displayName,
          avatar: member.avatar,
        } : null,
        tenant: tenant ? {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        } : null,
      };
    }),

  updateAccount: protectedProcedure
    .input(updateAccountSchema)
    .mutation(async ({ input, ctx }) => {
      const uc = new UpdateAccount(accountRepo);
      const account = await uc.execute({ accountId: ctx.tenant.userId, name: input.name });
      return { account: { id: account.id, email: account.email, name: account.name } };
    }),

  deleteAccount: protectedProcedure
    .input(deleteAccountSchema)
    .mutation(async ({ input, ctx }) => {
      const uc = new DeleteAccount(memberRepo);
      await uc.execute({ accountId: ctx.tenant.userId, confirmation: input.confirmation });
      return { success: true };
    }),

  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ input, ctx }) => {
      const uc = new ChangePassword(accountRepo, passwordHasher);
      await uc.execute({
        accountId: ctx.tenant.userId,
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      });
      return { success: true };
    }),

  requestEmailVerification: protectedProcedure
    .mutation(async ({ ctx }) => {
      const uc = new RequestEmailVerification(accountRepo, emailSender);
      await uc.execute({ accountId: ctx.tenant.userId });
      return { success: true };
    }),

  listSessions: protectedProcedure
    .query(async ({ ctx }) => {
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
      };
    }),

  revokeSession: protectedProcedure
    .input(revokeSessionSchema)
    .mutation(async ({ input, ctx }) => {
      const uc = new RevokeSession(sessionRepo);
      await uc.execute({ sessionId: input.sessionId, accountId: ctx.tenant.userId });
      return { success: true };
    }),

  revokeAllSessions: protectedProcedure
    .mutation(async ({ ctx }) => {
      const uc = new RevokeAllSessions(sessionRepo);
      await uc.execute({ accountId: ctx.tenant.userId });
      return { success: true };
    }),

  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const sub = await subscriptionRepo.findByTenantId(ctx.tenant.tenantId);
    if (!sub) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Subscription not found' });
    }
    return sub;
  }),

  // ═══════════════════════════════════════════
  // AUTHED + TENANT (requires tid in JWT)
  // ═══════════════════════════════════════════

  updateMember: protectedProcedure
    .input(updateMemberSchema)
    .mutation(async ({ input, ctx }) => {
      const member = await memberRepo.findByAccountAndTenant(ctx.tenant.userId, ctx.tenant.tenantId);
      if (!member) throw new TRPCError({ code: 'NOT_FOUND', message: 'Member not found' });

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

  createInvite: roleProtectedProcedure('LEADER')
    .input(createInviteSchema)
    .mutation(async ({ input, ctx }) => {
      requirePermission(ctx.tenant.role as Role, 'team:invite');
      const tenant = await prisma.tenant.findUnique({ where: { id: ctx.tenant.tenantId } });
      const uc = new CreateInvite(inviteRepo, emailSender);
      return uc.execute({
        tenantId: ctx.tenant.tenantId,
        email: input.email,
        role: input.role,
        invitedBy: ctx.tenant.userId,
        tenantName: tenant?.name ?? '',
      });
    }),

  listInvites: roleProtectedProcedure('LEADER')
    .input(listInvitesSchema)
    .query(async ({ input, ctx }) => {
      const invites = await inviteRepo.findByTenantId(ctx.tenant.tenantId, input.status);
      return { invites };
    }),

  cancelInvite: roleProtectedProcedure('LEADER')
    .input(cancelInviteSchema)
    .mutation(async ({ input, ctx }) => {
      const uc = new CancelInvite(inviteRepo);
      await uc.execute({ inviteId: input.inviteId, tenantId: ctx.tenant.tenantId });
      return { success: true };
    }),

  resendInvite: roleProtectedProcedure('LEADER')
    .input(cancelInviteSchema) // same schema — just inviteId
    .mutation(async ({ input, ctx }) => {
      const invite = await inviteRepo.findById(input.inviteId);
      if (!invite) throw new TRPCError({ code: 'NOT_FOUND', message: 'Invite not found' });
      if (invite.tenantId !== ctx.tenant.tenantId) throw new TRPCError({ code: 'FORBIDDEN' });
      if (invite.status !== 'PENDING') throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invite is not pending' });

      const tenant = await prisma.tenant.findUnique({ where: { id: ctx.tenant.tenantId } });
      const inviteUrl = `${process.env.NEXTAUTH_URL}/invite?token=${invite.token}`;
      await emailSender.send({
        to: invite.email,
        subject: `Convite para ${tenant?.name ?? ''}`,
        html: `<p>Voce foi convidado(a) para o time de <strong>${tenant?.name ?? ''}</strong>.</p>
               <p><a href="${inviteUrl}">Aceitar convite</a></p>
               <p>Este convite expira em 7 dias.</p>`,
      });
      return { success: true };
    }),

  listMembers: roleProtectedProcedure('LEADER')
    .query(async ({ ctx }) => {
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

  updateMemberRole: roleProtectedProcedure('ADMIN')
    .input(updateMemberRoleSchema)
    .mutation(async ({ input, ctx }) => {
      requirePermission(ctx.tenant.role as Role, 'team:promote');
      if (!canPromoteTo(ctx.tenant.role as Role, input.newRole as Role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot promote to this role' });
      }
      const uc = new UpdateMemberRole(memberRepo);
      await uc.execute({
        callerAccountId: ctx.tenant.userId,
        callerTenantId: ctx.tenant.tenantId,
        memberId: input.memberId,
        newRole: input.newRole,
      });
      return { success: true };
    }),

  removeMember: roleProtectedProcedure('ADMIN')
    .input(removeMemberSchema)
    .mutation(async ({ input, ctx }) => {
      const uc = new RemoveMember(memberRepo);
      await uc.execute({
        callerAccountId: ctx.tenant.userId,
        tenantId: ctx.tenant.tenantId,
        memberId: input.memberId,
      });
      return { success: true };
    }),
});
