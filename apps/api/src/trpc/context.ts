import type { TenantContext } from "@wbc/shared";
import { randomUUID } from "crypto";

export interface TRPCContext {
  requestId: string;
  tenant: TenantContext | null;
  /**
   * Client IP, derived from `x-forwarded-for` (first hop) or `x-real-ip` at
   * the HTTP boundary. Optional because not every transport (tests, internal
   * RPC) carries one; rate-limit middleware degrades gracefully when absent.
   */
  ipAddress?: string;
}

export function createContext(
  tenant: TenantContext | null = null,
  ipAddress?: string,
): TRPCContext {
  return { requestId: randomUUID(), tenant, ipAddress };
}

/**
 * Extracts the client IP from a Fetch-style Request. Returns the first hop
 * from `x-forwarded-for`, else `x-real-ip`, else undefined. Use this at the
 * HTTP handler boundary before calling `createContext`.
 */
export function extractIpFromHeaders(headers: Headers): string | undefined {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const real = headers.get("x-real-ip");
  return real ?? undefined;
}

export function createAuthenticatedContext(claims: {
  sub: string;
  tid: string;
  role: string;
  plan: string;
  locale: string;
  timezone: string;
  currency: string;
}): TRPCContext {
  return {
    requestId: randomUUID(),
    tenant: {
      tenantId: claims.tid,
      userId: claims.sub,
      role: claims.role as TenantContext["role"],
      plan: claims.plan as TenantContext["plan"],
      locale: claims.locale,
      timezone: claims.timezone,
      currency: claims.currency,
    },
  };
}
