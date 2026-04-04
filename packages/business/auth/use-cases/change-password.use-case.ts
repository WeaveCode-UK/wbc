import type { AccountRepository } from '../ports/account.repository';
import type { PasswordHasher } from '../ports/password-hasher.port';

export interface ChangePasswordInput {
  accountId: string;
  currentPassword: string;
  newPassword: string;
}

export class ChangePassword {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const account = await this.accountRepo.findById(input.accountId);
    if (!account) throw new Error('Account nao encontrada');
    if (!account.hasPassword()) throw new Error('Esta conta usa Login com Google');

    const isValid = await this.passwordHasher.verify(input.currentPassword, account.passwordHash!);
    if (!isValid) throw new Error('Senha atual incorreta');

    const newHash = await this.passwordHasher.hash(input.newPassword);
    await this.accountRepo.update(input.accountId, { passwordHash: newHash });
  }
}
