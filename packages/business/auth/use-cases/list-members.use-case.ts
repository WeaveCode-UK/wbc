import type { TenantMemberRepository } from '../ports/tenant-member.repository';
import type { TenantMember } from '../domain/entities/tenant-member.entity';

export interface ListMembersInput {
  tenantId: string;
}

export class ListMembers {
  constructor(private readonly memberRepo: TenantMemberRepository) {}

  async execute(input: ListMembersInput): Promise<TenantMember[]> {
    return this.memberRepo.findActiveByTenantId(input.tenantId);
  }
}
