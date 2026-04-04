import type { TenantMemberRepository } from '../ports/tenant-member.repository';

export interface SwitchWorkspaceInput {
  accountId: string;
  targetTenantId: string;
}

export interface SwitchWorkspaceOutput {
  tenantId: string;
  memberId: string;
  role: string;
  plan: string;
}

export class SwitchWorkspace {
  constructor(private readonly memberRepo: TenantMemberRepository) {}

  async execute(input: SwitchWorkspaceInput): Promise<SwitchWorkspaceOutput> {
    const members = await this.memberRepo.findActiveByAccountId(input.accountId);
    const target = members.find((m) => m.tenantId === input.targetTenantId);

    if (!target) {
      throw new Error('Acesso negado a este workspace');
    }

    return {
      tenantId: target.tenantId,
      memberId: target.id,
      role: target.role,
      plan: target.plan,
    };
  }
}
