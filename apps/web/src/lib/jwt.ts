import type { Role } from '@wbc/business/auth/domain/entities/tenant-member.entity';
import type { Plan } from '@wbc/business/auth/domain/value-objects/jwt-payload.vo';
import type { DefaultSession } from 'next-auth';

export interface JWTPayload {
  sub: string;                        // accountId
  tid?: string;                       // tenantId
  mid?: string;                       // tenantMemberId
  role?: Role;                        // CONSULTANT | LEADER | DIRECTOR | ADMIN
  plan?: Plan;                        // ESSENTIAL | PRO
  needsOnboarding?: boolean;
  needsWorkspaceSelection?: boolean;
}

// Type augmentation for next-auth
declare module 'next-auth' {
  interface Session {
    user: {
      accountId?: string;
      tenantId?: string;
      memberId?: string;
      role?: string;
      plan?: string;
      needsOnboarding?: boolean;
      needsWorkspaceSelection?: boolean;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub?: string;
    tid?: string;
    mid?: string;
    role?: string;
    plan?: string;
    needsOnboarding?: boolean;
    needsWorkspaceSelection?: boolean;
  }
}
