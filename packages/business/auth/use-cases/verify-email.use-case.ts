import type { AccountRepository } from '../ports/account.repository';

export interface VerifyEmailInput {
  token: string;
}

export class VerifyEmail {
  constructor(private readonly accountRepo: AccountRepository) {}

  async execute(_input: VerifyEmailInput): Promise<void> {
    // TODO: validar token do Redis e obter accountId
    // Por enquanto, placeholder
    throw new Error('Email verification token validation not yet implemented');
  }
}
