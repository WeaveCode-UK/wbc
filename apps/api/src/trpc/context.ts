import type { TenantContext } from '@wbc/shared';

export interface TRPCContext {
  tenant: TenantContext | null;
}

export function createContext(tenant: TenantContext | null = null): TRPCContext {
  return { tenant };
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
    tenant: {
      tenantId: claims.tid,
      userId: claims.sub,
      role: claims.role as TenantContext['role'],
      plan: claims.plan as TenantContext['plan'],
      locale: claims.locale,
      timezone: claims.timezone,
      currency: claims.currency,
    },
  };
}
