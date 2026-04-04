import type { TenantMember, Role } from '../domain/entities/tenant-member.entity';

export interface CreateTenantMemberInput {
  accountId: string;
  tenantId: string;
  role: Role;
  phone?: string | null;
  displayName?: string | null;
  avatar?: string | null;
}

export interface UpdateTenantMemberInput {
  role?: Role;
  phone?: string | null;
  displayName?: string | null;
  avatar?: string | null;
  isActive?: boolean;
  deletedAt?: Date | null;
}

export interface TenantMemberWithTenantInfo extends TenantMember {
  tenantName: string;
  tenantSlug: string;
  plan: string;
  subscriptionStatus: string;
}

export interface TenantMemberRepository {
  findById(id: string): Promise<TenantMember | null>;
  findByAccountAndTenant(accountId: string, tenantId: string): Promise<TenantMember | null>;
  findActiveByAccountId(accountId: string): Promise<TenantMemberWithTenantInfo[]>;
  findActiveByTenantId(tenantId: string): Promise<TenantMember[]>;
  create(input: CreateTenantMemberInput): Promise<TenantMember>;
  update(id: string, input: UpdateTenantMemberInput): Promise<TenantMember>;
  countAdminsByTenantId(tenantId: string): Promise<number>;
}
