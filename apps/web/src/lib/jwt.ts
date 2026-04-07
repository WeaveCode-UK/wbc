import type { Role } from '@wbc/business/auth/domain/entities/tenant-member.entity';
import type { Plan } from '@wbc/business/auth/domain/value-objects/jwt-payload.vo';

export interface JWTPayload {
  sub: string;
  tid?: string;
  mid?: string;
  role?: Role;
  plan?: Plan;
  needsOnboarding?: boolean;
  needsWorkspaceSelection?: boolean;
}
