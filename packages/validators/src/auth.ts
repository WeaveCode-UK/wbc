import { z } from 'zod';

// Auth 2.0 schemas — replaces legacy OTP-based schemas

export const completeOnboardingSchema = z.object({
  tenantName: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minusculas, numeros e hifens'),
  phone: z.string().min(10).max(15),
  brandId: z.string().uuid().optional(),
  avatar: z.string().url().optional(),
});

export const acceptInviteSchema = z.object({
  inviteToken: z.string().min(1),
  displayName: z.string().min(2).max(100),
  phone: z.string().min(10).max(15),
});

export const switchWorkspaceSchema = z.object({
  tenantId: z.string().uuid(),
});

export const updateAccountSchema = z.object({
  name: z.string().min(2).max(100).optional(),
});

export const updateMemberSchema = z.object({
  phone: z.string().min(10).max(15).optional(),
  displayName: z.string().min(2).max(100).optional(),
  avatar: z.string().url().optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/[a-zA-Z]/, 'Must contain at least one letter').regex(/[0-9]/, 'Must contain at least one number'),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).regex(/[a-zA-Z]/, 'Must contain at least one letter').regex(/[0-9]/, 'Must contain at least one number'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['CONSULTANT', 'LEADER', 'DIRECTOR', 'ADMIN']),
});

export const cancelInviteSchema = z.object({
  inviteId: z.string().uuid(),
});

export const resendInviteSchema = z.object({
  inviteId: z.string().uuid(),
});

export const listInvitesSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED']).optional(),
});

export const updateMemberRoleSchema = z.object({
  memberId: z.string().uuid(),
  newRole: z.enum(['CONSULTANT', 'LEADER', 'DIRECTOR', 'ADMIN']),
});

export const removeMemberSchema = z.object({
  memberId: z.string().uuid(),
});

export const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE'),
});

export const leaveTenantSchema = z.object({
  confirmation: z.literal('LEAVE'),
});

export const revokeSessionSchema = z.object({
  sessionId: z.string().uuid(),
});
