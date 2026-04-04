import type { Role } from './entities/tenant-member.entity';

export type Permission =
  | 'team:view'
  | 'team:invite'
  | 'team:multi-view'
  | 'team:promote'
  | 'team:promote:director'
  | 'tenant:manage'
  | 'tenant:billing'
  | 'tenant:export';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  CONSULTANT: [],
  LEADER:     ['team:view', 'team:invite', 'team:promote'],
  DIRECTOR:   ['team:view', 'team:invite', 'team:promote', 'team:promote:director', 'team:multi-view'],
  ADMIN:      ['team:view', 'team:invite', 'team:promote', 'team:promote:director', 'team:multi-view',
               'tenant:manage', 'tenant:billing', 'tenant:export'],
};
