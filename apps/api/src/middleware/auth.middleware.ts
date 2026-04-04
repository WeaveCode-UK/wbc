import { TRPCError } from '@trpc/server';
import type { Role } from '@wbc/business/auth/domain/entities/tenant-member.entity';
import type { Plan } from '@wbc/business/auth/domain/value-objects/jwt-payload.vo';

// Auth context types injected by middleware
export interface AuthedContext {
  accountId: string;
}

export interface TenantContext extends AuthedContext {
  tenantId: string;
  memberId: string;
  role: Role;
  plan: Plan;
}

// Validate that accountId exists in JWT
export function extractAuthedContext(token: { sub?: string }): AuthedContext {
  if (!token.sub) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  return { accountId: token.sub };
}

// Validate that tenant context exists in JWT
export function extractTenantContext(token: {
  sub?: string;
  tid?: string;
  mid?: string;
  role?: string;
  plan?: string;
}): TenantContext {
  if (!token.sub) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  if (!token.tid || !token.mid || !token.role || !token.plan) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Workspace nao selecionado' });
  }
  return {
    accountId: token.sub,
    tenantId: token.tid,
    memberId: token.mid,
    role: token.role as Role,
    plan: token.plan as Plan,
  };
}
