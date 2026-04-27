import { z } from "zod";
import { phoneE164Schema, optionalPhoneE164Schema } from "./phone";

// Auth 2.0 schemas — replaces legacy OTP-based schemas

/**
 * Allow-list of hostname suffixes accepted for user-supplied avatar URLs.
 * Anything outside this list is rejected at parse time to prevent SSRF when
 * the server fetches the avatar for preview generation, e-mail composition,
 * etc. (ACH-009).
 */
const AVATAR_HOSTNAME_ALLOWLIST = [
  // Google avatars (used by OAuth Google provider).
  "googleusercontent.com",
  // Gravatar (legacy).
  "gravatar.com",
  // Own CDNs — add the production CDN host here once it exists.
  "wbc.cdn.weavecode.co.uk",
];

function isAllowedAvatarUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    return AVATAR_HOSTNAME_ALLOWLIST.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
  } catch {
    return false;
  }
}

export const avatarUrlSchema = z.string().url().refine(isAllowedAvatarUrl, {
  message:
    "Avatar URL must be HTTPS and on an allowed host (googleusercontent.com, gravatar.com, wbc.cdn.weavecode.co.uk)",
});

export const completeOnboardingSchema = z.object({
  tenantName: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug deve conter apenas letras minusculas, numeros e hifens",
    ),
  phone: phoneE164Schema,
  brandId: z.string().uuid().optional(),
  avatar: avatarUrlSchema.optional(),
});

export const acceptInviteSchema = z.object({
  inviteToken: z.string().min(1),
  displayName: z.string().min(2).max(100),
  phone: phoneE164Schema,
});

export const switchWorkspaceSchema = z.object({
  tenantId: z.string().uuid(),
});

export const updateAccountSchema = z.object({
  name: z.string().min(2).max(100).optional(),
});

export const updateMemberSchema = z.object({
  phone: optionalPhoneE164Schema,
  displayName: z.string().min(2).max(100).optional(),
  avatar: avatarUrlSchema.optional().nullable(),
});

// ACH-004: NIST 800-63B alignment. min length 12, max 128 (DoS guard at the
// validator layer; bcrypt itself caps at 72 bytes but we check the user-typed
// string before hashing). Composition regex (letter + number) kept for
// compatibility with existing UX hints; breach-check is enforced in the
// use-case via PasswordBreachChecker port.
export const passwordPolicySchema = z
  .string()
  .min(12, "A senha deve ter pelo menos 12 caracteres")
  .max(128, "A senha é longa demais")
  .regex(/[a-zA-Z]/, "Deve conter ao menos uma letra")
  .regex(/[0-9]/, "Deve conter ao menos um número");

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordPolicySchema,
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordPolicySchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["CONSULTANT", "LEADER", "DIRECTOR", "ADMIN"]),
});

export const cancelInviteSchema = z.object({
  inviteId: z.string().uuid(),
});

export const resendInviteSchema = z.object({
  inviteId: z.string().uuid(),
});

export const listInvitesSchema = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "EXPIRED", "CANCELLED"]).optional(),
});

export const updateMemberRoleSchema = z.object({
  memberId: z.string().uuid(),
  newRole: z.enum(["CONSULTANT", "LEADER", "DIRECTOR", "ADMIN"]),
});

export const removeMemberSchema = z.object({
  memberId: z.string().uuid(),
});

export const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE"),
});

export const leaveTenantSchema = z.object({
  confirmation: z.literal("LEAVE"),
});

export const revokeSessionSchema = z.object({
  sessionId: z.string().uuid(),
});

// ACH-003: MFA/TOTP integration. The 6-digit live code or one of the
// 24-char recovery codes (`XXXX-XXXX-XXXX-XXXX-XXXX`) — the verifier
// distinguishes them.
export const mfaTotpTokenSchema = z
  .string()
  .trim()
  .min(6)
  .max(32)
  .regex(/^[A-Z0-9-]+$/i, "Token TOTP inválido");

export const mfaConfirmEnrollmentSchema = z.object({
  secret: z.string().min(16).max(64),
  token: mfaTotpTokenSchema,
});

export const mfaDisableSchema = z.object({
  currentToken: mfaTotpTokenSchema,
});
