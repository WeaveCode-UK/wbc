import type { Role } from "@wbc/business/auth/domain/entities/tenant-member.entity";
import type { Plan } from "@wbc/business/auth/domain/value-objects/jwt-payload.vo";

export interface JWTPayload {
  sub: string;
  /** JWT id — random per issuance; used by the Redis blacklist to revoke
   *  individual sessions before their natural expiry (ACH-006). */
  jti?: string;
  /** Issued-at seconds since epoch — used to compute remaining TTL at
   *  revocation time. */
  iat?: number;
  tid?: string;
  mid?: string;
  role?: Role;
  plan?: Plan;
  needsOnboarding?: boolean;
  needsWorkspaceSelection?: boolean;
}
