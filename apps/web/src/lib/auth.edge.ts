// F11.E02 — NextAuth instance for the Edge runtime (middleware only).
//
// `apps/web/src/middleware.ts` imports `auth` from here, NOT from
// `./auth.ts`, because the latter pulls Node-only deps (Redis, bcrypt,
// crypto) that the Edge runtime refuses to bundle.
//
// The handlers, signIn, and signOut helpers live in `./auth.ts` for use
// by route handlers and server components.

import NextAuth from "next-auth";
import authConfig from "./auth.config.edge";

export const { auth } = NextAuth(authConfig);
