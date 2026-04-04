import type { TenantMemberRepository } from '../ports/tenant-member.repository';

export interface LeaveTenantInput {
  accountId: string;
  tenantId: string;
  confirmation: string;
}

export class LeaveTenant {
  constructor(
    private readonly memberRepo: TenantMemberRepository,
  ) {}

  async execute(input: LeaveTenantInput): Promise<void> {
    if (input.confirmation !== 'LEAVE') throw new Error('Confirmacao invalida');

    const member = await this.memberRepo.findByAccountAndTenant(input.accountId, input.tenantId);
    if (!member || !member.isActive) throw new Error('Voce nao e membro deste workspace');

    if (member.role === 'ADMIN') {
      const adminCount = await this.memberRepo.countAdminsByTenantId(input.tenantId);
      if (adminCount <= 1) {
        throw new Error('Voce e o unico ADMIN. Promova outro membro antes de sair.');
      }
    }

    await this.memberRepo.update(member.id, { deletedAt: new Date(), isActive: false });
  }
}
