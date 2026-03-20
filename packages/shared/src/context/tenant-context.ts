import { AsyncLocalStorage } from 'async_hooks';
import type { TenantContext } from '../types/tenant';

const tenantStorage = new AsyncLocalStorage<TenantContext>();

export function runWithTenant<T>(context: TenantContext, fn: () => T): T {
  return tenantStorage.run(context, fn);
}

export function getCurrentTenant(): TenantContext | undefined {
  return tenantStorage.getStore();
}

export function requireCurrentTenant(): TenantContext {
  const tenant = tenantStorage.getStore();
  if (!tenant) {
    throw new Error('No tenant context available. Ensure request is authenticated.');
  }
  return tenant;
}

// For worker usage — creates a minimal tenant context
export function withTenant<T>(tenantId: string, fn: () => T): T {
  const context: TenantContext = {
    tenantId,
    userId: 'system',
    plan: 'ESSENTIAL',
    role: 'CONSULTANT',
    locale: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    currency: 'BRL',
  };
  return tenantStorage.run(context, fn);
}
