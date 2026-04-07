import type { TenantContext } from '@wbc/shared';
import { randomUUID } from 'crypto';

export interface TRPCContext {
  requestId: string;
  tenant: TenantContext | null;
}

export function createContext(tenant: TenantContext | null = null): TRPCContext {
  return { requestId: randomUUID(), tenant };
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
      role: claims.role as TenantContext['role'],
      plan: claims.plan as TenantContext['plan'],
      locale: claims.locale,
      timezone: claims.timezone,
      currency: claims.currency,
    },
  };
}
