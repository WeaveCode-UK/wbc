import type { Role } from '../domain/entities/tenant-member.entity';
import type { Permission } from '../domain/permissions';
import { ROLE_PERMISSIONS } from '../domain/permissions';

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function requirePermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error('Permissao insuficiente');
  }
}

// Role hierarchy for promotion checks
const ROLE_HIERARCHY: Record<Role, number> = {
  CONSULTANT: 0,
  LEADER: 1,
  DIRECTOR: 2,
  ADMIN: 3,
};

export function canPromoteTo(callerRole: Role, targetRole: Role): boolean {
  // No one promotes to role >= their own
  return ROLE_HIERARCHY[targetRole] < ROLE_HIERARCHY[callerRole];
}
