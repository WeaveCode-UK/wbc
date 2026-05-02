// F11.E02 — Edge-safe NextAuth config used exclusively by `middleware.ts`.
//
// Why a separate file
// -------------------
// `auth.config.ts` (the full one) imports `ioredis`, `bcryptjs`, and
// `@wbc/shared` (which uses `node:crypto`). The Edge runtime cannot bundle
// any of those. Mounting the full config in middleware turns every request
// into a 500.
//
// Boundary
// --------
// This file MUST NOT import:
// - any adapter that touches Redis, Postgres, bcrypt, otplib, ioredis
// - `@wbc/shared` (pulls node:crypto)
// - anything from `@wbc/business`
// - the full `auth.config.ts`
//
// It only declares: cookie shape, JWT session strategy, and a `session`
// callback that reads claims off the token. The token itself is signed by
// the Node-side `auth.config.ts` during `/api/auth/*` requests; middleware
// only decodes it.
//
// Both configs use the same `AUTH_SECRET`, the same cookie names, and the
// same JWT strategy, so the token signed by Node decodes cleanly here.

import type { NextAuthConfig } from "next-auth";

const SESSION_MAX_AGE_SECONDS = 15 * 60;

export default {
  // Providers run only in `/api/auth/*` handlers (Node runtime). Middleware
  // doesn't authenticate — it only reads the existing JWT cookie. An empty
  // list is intentional and supported by NextAuth v5 for the edge variant.
  providers: [],

  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },

  // Mirror the cookie shape from `auth.config.ts` exactly so the same
  // cookie is read by both runtimes.
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
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  callbacks: {
    // The middleware reads `req.auth.user.<field>` to decide gates. The
    // shape below mirrors `auth.config.ts`'s session callback so consumers
    // see the same fields regardless of which runtime served the request.
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

  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
