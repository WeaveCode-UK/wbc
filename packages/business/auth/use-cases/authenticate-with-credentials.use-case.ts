import type { AccountRepository } from '../ports/account.repository';
import type { PasswordHasher } from '../ports/password-hasher.port';
import type { Account } from '../domain/entities/account.entity';

export interface AuthenticateWithCredentialsInput {
  email: string;
  password: string;
}

export class AuthenticateWithCredentials {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: AuthenticateWithCredentialsInput): Promise<Account> {
    const account = await this.accountRepo.findByEmail(input.email.trim().toLowerCase());
    if (!account) {
      throw new Error('Conta nao encontrada');
    }
    if (!account.hasPassword()) {
      throw new Error('Esta conta usa Login com Google');
    }
    const isValid = await this.passwordHasher.verify(input.password, account.passwordHash!);
    if (!isValid) {
      throw new Error('Senha incorreta');
    }
    return account;
  }
}
