import type { Role } from '../entities/tenant-member.entity';

export type Plan = 'ESSENTIAL' | 'PRO';

export interface JWTPayload {
  sub: string;                        // accountId
  tid?: string;                       // tenantId
  mid?: string;                       // tenantMemberId
  role?: Role;                        // CONSULTANT | LEADER | DIRECTOR | ADMIN
  plan?: Plan;                        // ESSENTIAL | PRO
  needsOnboarding?: boolean;
  needsWorkspaceSelection?: boolean;
}
