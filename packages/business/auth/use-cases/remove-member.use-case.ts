import type { TenantMemberRepository } from '../ports/tenant-member.repository';

export interface RemoveMemberInput {
  callerAccountId: string;
  tenantId: string;
  memberId: string;
}

export class RemoveMember {
  constructor(private readonly memberRepo: TenantMemberRepository) {}

  async execute(input: RemoveMemberInput): Promise<void> {
    // Verificar que o caller e ADMIN
    const callerMember = await this.memberRepo.findByAccountAndTenant(
      input.callerAccountId,
      input.tenantId,
    );
    if (!callerMember || callerMember.role !== 'ADMIN') {
      throw new Error('Apenas ADMIN pode remover membros');
    }

    const targetMember = await this.memberRepo.findById(input.memberId);
    if (!targetMember) throw new Error('Membro nao encontrado');
    if (targetMember.tenantId !== input.tenantId) throw new Error('Membro nao pertence a este workspace');
    if (targetMember.accountId === input.callerAccountId) throw new Error('Voce nao pode remover a si mesmo');

    await this.memberRepo.update(input.memberId, { deletedAt: new Date(), isActive: false });
  }
}
