import type { TenantMemberRepository } from '../ports/tenant-member.repository';

export interface ListWorkspacesInput {
  accountId: string;
}

export interface WorkspaceInfo {
  tenantId: string;
  tenantName: string;
  slug: string;
  role: string;
  plan: string;
  status: string;
}

export class ListWorkspaces {
  constructor(private readonly memberRepo: TenantMemberRepository) {}

  async execute(input: ListWorkspacesInput): Promise<WorkspaceInfo[]> {
    const members = await this.memberRepo.findActiveByAccountId(input.accountId);
    return members.map((m) => ({
      tenantId: m.tenantId,
      tenantName: m.tenantName,
      slug: m.tenantSlug,
      role: m.role,
      plan: m.plan,
      status: m.subscriptionStatus,
    }));
  }
}
