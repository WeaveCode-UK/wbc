import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { PrismaAccountRepository } from "@wbc/business/auth/adapters/prisma-account.repository";
import { PrismaOAuthAccountRepository } from "@wbc/business/auth/adapters/prisma-oauth-account.repository";
import { PrismaTenantMemberRepository } from "@wbc/business/auth/adapters/prisma-tenant-member.repository";
import { BcryptPasswordHasher } from "@wbc/business/auth/adapters/bcrypt-password-hasher.adapter";
import {
  AuthenticateWithCredentials,
  InvalidMfaTokenError,
  MfaRequiredError,
} from "@wbc/business/auth/use-cases/authenticate-with-credentials.use-case";
import { AuthenticateWithOAuth } from "@wbc/business/auth/use-cases/authenticate-with-oauth.use-case";
import {
  RedisLoginAttemptTracker,
  DEFAULT_IP_ONLY_LOCKOUT_POLICY,
} from "@wbc/business/auth/adapters/redis-login-attempt-tracker.adapter";
import { RedisJwtBlacklist } from "@wbc/business/auth/adapters/redis-jwt-blacklist.adapter";
import { OtplibTotpService } from "@wbc/business/auth/adapters/otplib-totp-service.adapter";
import { VerifyTotp } from "@wbc/business/auth/use-cases/verify-totp.use-case";
import { logSecurityEvent, type RedisLike } from "@wbc/shared";
import { randomUUID } from "crypto";
import Redis from "ioredis";
// ACH-007 revisor follow-up: pull the pure membership resolver into the
// callback so the five-field mutation becomes a single apply-state call.
import { resolveWorkspaceMembership } from "./resolve-workspace-membership";

const accountRepo = new PrismaAccountRepository();
const oauthRepo = new PrismaOAuthAccountRepository();
const memberRepo = new PrismaTenantMemberRepository();
const passwordHasher = new BcryptPasswordHasher();
// Lazy Redis singleton scoped to auth.config so the connection is reused
// across `authorize` invocations. Cast via `unknown` because the full
// ioredis surface is a superset of the minimal `RedisLike` contract.
const authRedis = new Redis(
  process.env.REDIS_URL ?? "redis://localhost:6379/0",
) as unknown as RedisLike;
const loginAttemptTracker = new RedisLoginAttemptTracker(authRedis);
// ACH-006: separate IP-only tracker (100 failures / 1h) catches credential
// stuffing patterns invisible to the per-(email,IP) counter.
const ipOnlyAttemptTracker = new RedisLoginAttemptTracker(
  authRedis,
  DEFAULT_IP_ONLY_LOCKOUT_POLICY,
  "auth:login-attempts:ip",
);
export const jwtBlacklist = new RedisJwtBlacklist(authRedis);

const SESSION_MAX_AGE_SECONDS = 15 * 60;
// ACH-003: enforce TOTP at login when the account has it enabled. The
// VerifyTotp use-case loads the encrypted secret + recovery codes for the
// account and consumes recovery codes one-shot.
const totpService = new OtplibTotpService();
const verifyTotp = new VerifyTotp(totpService);
const authWithCredentials = new AuthenticateWithCredentials(
  accountRepo,
  passwordHasher,
  loginAttemptTracker,
  verifyTotp,
  ipOnlyAttemptTracker,
);
const authWithOAuth = new AuthenticateWithOAuth(accountRepo, oauthRepo);

function extractIp(request?: Request): string | undefined {
  if (!request) return undefined;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const real = request.headers.get("x-real-ip");
  return real ?? undefined;
}

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        // ACH-003: optional second-factor token. Empty when the user has
        // never enrolled TOTP; required (and verified) when totpEnabled.
        totp: { label: "TOTP", type: "text" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const totpRaw =
            typeof credentials.totp === "string" ? credentials.totp.trim() : "";
          const account = await authWithCredentials.execute({
            email: credentials.email as string,
            password: credentials.password as string,
            ipAddress: extractIp(request as unknown as Request | undefined),
            totpToken: totpRaw === "" ? undefined : totpRaw,
          });
          logSecurityEvent({
            event: "auth.login.success",
            userId: account.id,
            success: true,
            detail: "credentials",
          });
          return { id: account.id, email: account.email, name: account.name };
        } catch (err) {
          // ACH-003: surface MFA-specific failures as distinct codes so the
          // login UI can ask only for the second factor instead of the full
          // password again. NextAuth re-throws Errors on the
          // CredentialsSignin path, so callers receive the `code` we set.
          if (err instanceof MfaRequiredError) {
            logSecurityEvent({
              event: "auth.login.failed",
              success: false,
              email: credentials.email as string,
              detail: "mfa-required",
            });
            const e = new Error("mfa_required");
            (e as Error & { code: string }).code = "mfa_required";
            throw e;
          }
          if (err instanceof InvalidMfaTokenError) {
            logSecurityEvent({
              event: "auth.login.failed",
              success: false,
              email: credentials.email as string,
              detail: "mfa-invalid",
            });
            const e = new Error("mfa_invalid");
            (e as Error & { code: string }).code = "mfa_invalid";
            throw e;
          }
          logSecurityEvent({
            event: "auth.login.failed",
            success: false,
            email: credentials.email as string,
            detail: "credentials",
          });
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account: oauthAccount }) {
      if (oauthAccount?.provider === "google" && user.email && user.name) {
        logSecurityEvent({
          event: "auth.login.success",
          userId: user.id,
          success: true,
          detail: `oauth:${oauthAccount.provider}`,
        });
        await authWithOAuth.execute({
          email: user.email,
          name: user.name,
          provider: oauthAccount.provider,
          providerAccountId: oauthAccount.providerAccountId,
          accessToken: oauthAccount.access_token ?? null,
          refreshToken: oauthAccount.refresh_token ?? null,
          expiresAt: oauthAccount.expires_at ?? null,
          tokenType: oauthAccount.token_type ?? null,
          scope: oauthAccount.scope ?? null,
          idToken: oauthAccount.id_token ?? null,
        });
      }
      return true;
    },
    async jwt({ token, user, trigger, session: updateSession }) {
      // On initial login — set accountId + jti for revocation
      if (user) {
        const dbAccount = await accountRepo.findByEmail(user.email!);
        if (dbAccount) {
          token.sub = dbAccount.id;
          token.jti = randomUUID();
          token.iat = Math.floor(Date.now() / 1000);
        }
      }

      // ACH-006: if the current jti has been blacklisted (e.g. user signed
      // out of another session), invalidate the token here so callbacks
      // downstream do not see `sub` and the session reads as unauthenticated.
      if (token.jti && typeof token.jti === "string") {
        if (await jwtBlacklist.isRevoked(token.jti)) {
          return {};
        }
      }

      // ACH-005: account-level mass revocation. ChangePassword,
      // ResetPassword and DeleteAccount stamp a `revokedBefore` Unix second
      // on the account; tokens whose `iat` falls at or before that stamp
      // are considered invalid even if their jti is not individually
      // blacklisted. Closes the window where a hijacked session would
      // outlive a password rotation.
      if (typeof token.sub === "string" && typeof token.iat === "number") {
        const revokedBefore = await jwtBlacklist.getAccountRevokedBefore(
          token.sub,
        );
        if (revokedBefore !== null && token.iat <= revokedBefore) {
          return {};
        }
      }

      // ACH-007: resolve membership once via a pure function and collapse
      // the five-field mutation into a single branch per kind. `preferred`
      // is either the tid already in the token (steady-state reads) or the
      // tid the user just picked via `session.update(...)`.
      if (token.sub) {
        const preferred =
          trigger === "update" && typeof updateSession?.tenantId === "string"
            ? updateSession.tenantId
            : typeof token.tid === "string"
              ? token.tid
              : undefined;

        const state = await resolveWorkspaceMembership(
          token.sub,
          preferred,
          memberRepo,
        );

        switch (state.kind) {
          case "onboarding":
            token.needsOnboarding = true;
            delete token.tid;
            delete token.mid;
            delete token.role;
            delete token.plan;
            delete token.needsWorkspaceSelection;
            break;
          case "selection":
            // Only force selection when the user hasn't locked in a tid.
            if (!token.tid) {
              token.needsWorkspaceSelection = true;
              delete token.needsOnboarding;
            }
            break;
          case "ready":
            token.tid = state.tenantId;
            token.mid = state.memberId;
            token.role = state.role;
            token.plan = state.plan;
            delete token.needsOnboarding;
            delete token.needsWorkspaceSelection;
            break;
        }
      }

      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          accountId: token.sub,
          tenantId: token.tid as string | undefined,
          memberId: token.mid as string | undefined,
          role: token.role as string | undefined,
          plan: token.plan as string | undefined,
          needsOnboarding: token.needsOnboarding as boolean | undefined,
          needsWorkspaceSelection: token.needsWorkspaceSelection as
            | boolean
            | undefined,
        },
      };
    },
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  // ACH-010: declare cookie options explicitly so a version/env change can
  // not silently relax the defaults. `useSecureCookies` is set via
  // NextAuth's env detection (AUTH_URL scheme) but we pin httpOnly/sameSite
  // here regardless.
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Host-authjs.csrf-token"
          : "authjs.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.callback-url"
          : "authjs.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  events: {
    async signOut(message) {
      // ACH-006: push the outgoing jti onto the Redis blacklist so stolen
      // JWT copies can no longer be used. TTL matches the remaining token
      // lifetime (default: full session window).
      const token = "token" in message ? message.token : null;
      if (token && typeof token.jti === "string") {
        const iat =
          typeof token.iat === "number"
            ? token.iat
            : Math.floor(Date.now() / 1000);
        const age = Math.floor(Date.now() / 1000) - iat;
        const remaining = Math.max(60, SESSION_MAX_AGE_SECONDS - age);
        await jwtBlacklist.revoke({ jti: token.jti, ttlSeconds: remaining });
        logSecurityEvent({
          event: "auth.login.failed",
          success: false,
          jti: token.jti,
          detail: "session-revoked",
        });
      }
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
} satisfies NextAuthConfig;
