import { prisma } from '@wbc/db';
import type { TenantMemberRepository } from '../ports/tenant-member.repository';

export interface DeleteAccountInput {
  accountId: string;
  confirmation: string;
}

export class DeleteAccount {
  constructor(
    private readonly memberRepo: TenantMemberRepository,
  ) {}

  async execute(input: DeleteAccountInput): Promise<void> {
    if (input.confirmation !== 'DELETE') {
      throw new Error('Confirmacao invalida');
    }

    // Verificar se nao e unico ADMIN de nenhum tenant
    const members = await this.memberRepo.findActiveByAccountId(input.accountId);
    for (const member of members) {
      if (member.role === 'ADMIN') {
        const adminCount = await this.memberRepo.countAdminsByTenantId(member.tenantId);
        if (adminCount <= 1) {
          throw new Error(`Voce e o unico ADMIN do workspace. Transfira a administracao antes de deletar a conta.`);
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      // Anonimizar Account
      await tx.account.update({
        where: { id: input.accountId },
        data: {
          email: `deleted_${input.accountId}@removed.wbc`,
          name: 'Conta Removida',
          passwordHash: null,
        },
      });
      // Hard delete OAuth
      await tx.oAuthAccount.deleteMany({ where: { accountId: input.accountId } });
      // Hard delete Sessions
      await tx.session.deleteMany({ where: { accountId: input.accountId } });
      // Soft delete TenantMembers
      await tx.tenantMember.updateMany({
        where: { accountId: input.accountId },
        data: { deletedAt: new Date(), isActive: false },
      });
    });
  }
}
