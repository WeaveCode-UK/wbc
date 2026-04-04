import type { AccountRepository } from '../ports/account.repository';
import type { Account } from '../domain/entities/account.entity';

export interface UpdateAccountInput {
  accountId: string;
  name?: string;
}

export class UpdateAccount {
  constructor(private readonly accountRepo: AccountRepository) {}

  async execute(input: UpdateAccountInput): Promise<Account> {
    const account = await this.accountRepo.findById(input.accountId);
    if (!account) throw new Error('Account nao encontrada');
    return this.accountRepo.update(input.accountId, { name: input.name });
  }
}
