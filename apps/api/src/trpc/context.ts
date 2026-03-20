import type { TenantContext } from '@wbc/shared';

export interface TRPCContext {
  tenant: TenantContext | null;
}

export function createContext(): TRPCContext {
  return { tenant: null };
}
