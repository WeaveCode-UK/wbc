// F11.E01 — Mounts the tRPC appRouter from `@wbc/api` as a Next.js route
// handler. Every UI call from `apps/web/` goes through `/api/trpc/<proc>`
// and is dispatched here.
//
// Context strategy
// ----------------
// The handler reads the NextAuth JWT from cookies via `getToken`. When the
// token has a `tid` (workspace selected) we build a full `TenantContext`;
// otherwise the `tenant` field is `null` and protected procedures will
// reject with UNAUTHORIZED/FORBIDDEN — same behaviour as the standalone
// `apps/api/` server.
//
// `locale`/`timezone`/`currency` are not yet stored in the JWT; we default
// them here. When auth.config starts populating these claims, the
// fallback can be removed in a follow-up epic.

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { getToken, decode, type JWT } from "next-auth/jwt";
import { appRouter } from "@wbc/api/src/trpc/router";
import {
  createContext,
  extractIpFromHeaders,
  type TRPCContext,
} from "@wbc/api/src/trpc/context";
import type { TenantContext } from "@wbc/shared";

const DEFAULT_LOCALE = "pt-BR";
const DEFAULT_TIMEZONE = "America/Sao_Paulo";
const DEFAULT_CURRENCY = "BRL";

// F11 follow-up: mobile clients send the NextAuth-shaped JWT as a
// `Authorization: Bearer ...` header. The `getToken` cookie path is
// tried first (web); if that fails we fall back to decoding the
// Bearer header with the same secret. Both paths produce identical
// claim shapes downstream.
type JwtTokenShape = JWT | null;

async function readBearerToken(req: Request): Promise<JwtTokenShape> {
  const auth =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const raw = auth.slice("Bearer ".length).trim();
  if (!raw) return null;
  try {
    const salt =
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token";
    const decoded = await decode({
      token: raw,
      secret: process.env.AUTH_SECRET ?? "",
      salt,
    });
    if (!decoded || typeof decoded === "string") return null;
    return decoded as JwtTokenShape;
  } catch {
    return null;
  }
}

async function buildContext(req: Request): Promise<TRPCContext> {
  let token: JwtTokenShape = await getToken({
    // `getToken` accepts the Web `Request` directly in Next 15. Cast keeps
    // older NextAuth typings (which expect Node IncomingMessage) happy
    // without us pretending to provide one.
    req: req as unknown as Parameters<typeof getToken>[0]["req"],
    secret: process.env.AUTH_SECRET,
  });
  if (!token?.sub) {
    token = await readBearerToken(req);
  }

  const ipAddress = extractIpFromHeaders(req.headers);

  if (!token?.sub) {
    return createContext(null, ipAddress);
  }

  const tid = typeof token.tid === "string" ? token.tid : undefined;
  const role = typeof token.role === "string" ? token.role : undefined;
  const plan = typeof token.plan === "string" ? token.plan : undefined;

  if (!tid || !role || !plan) {
    return createContext(null, ipAddress);
  }

  const tenant: TenantContext = {
    tenantId: tid,
    userId: token.sub,
    role: role as TenantContext["role"],
    plan: plan as TenantContext["plan"],
    locale: DEFAULT_LOCALE,
    timezone: DEFAULT_TIMEZONE,
    currency: DEFAULT_CURRENCY,
  };

  return createContext(tenant, ipAddress);
}

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => buildContext(req),
  });

export { handler as GET, handler as POST };
