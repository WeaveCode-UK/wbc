import type { TenantMemberRepository } from '../ports/tenant-member.repository';
import type { AccountRepository } from '../ports/account.repository';

export interface DeleteAccountInput {
  accountId: string;
  confirmation: string;
}

export class DeleteAccount {
  constructor(
    private readonly memberRepo: TenantMemberRepository,
    private readonly accountRepo?: AccountRepository,
  ) {}

  async execute(input: DeleteAccountInput): Promise<void> {
    if (input.confirmation !== 'DELETE') {
      throw new Error('Confirmacao invalida');
    }

    const members = await this.memberRepo.findActiveByAccountId(input.accountId);
    for (const member of members) {
      if (member.role === 'ADMIN') {
        const adminCount = await this.memberRepo.countAdminsByTenantId(member.tenantId);
        if (adminCount <= 1) {
          throw new Error('Voce e o unico ADMIN do workspace. Transfira a administracao antes de deletar a conta.');
        }
      }
    }

    if (this.accountRepo) {
      await this.accountRepo.deleteWithCleanup(input.accountId);
    }
  }
}
