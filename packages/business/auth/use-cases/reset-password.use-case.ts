import type { AccountRepository } from '../ports/account.repository';
import type { PasswordHasher } from '../ports/password-hasher.port';

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export class ResetPassword {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(_input: ResetPasswordInput): Promise<void> {
    // TODO: validar token do Redis/tabela dedicada e obter accountId
    // Por enquanto, placeholder que sera conectado ao storage de tokens
    throw new Error('Reset password token validation not yet implemented');
  }
}
