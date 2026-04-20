import type { AccountRepository } from "../ports/account.repository";
import type { AuthTokenStore } from "../ports/auth-token-store.port";

export interface VerifyEmailInput {
  token: string;
}

export class InvalidVerificationTokenError extends Error {
  constructor() {
    super("Token de verificação inválido ou expirado");
    this.name = "InvalidVerificationTokenError";
  }
}

export class VerifyEmail {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly tokenStore: AuthTokenStore,
  ) {}

  async execute(input: VerifyEmailInput): Promise<void> {
    const consumed = await this.tokenStore.consume({
      token: input.token,
      kind: "email-verification",
    });
    if (!consumed) {
      throw new InvalidVerificationTokenError();
    }

    const account = await this.accountRepo.findById(consumed.accountId);
    if (!account) {
      throw new InvalidVerificationTokenError();
    }

    if (account.isEmailVerified()) return; // idempotente

    await this.accountRepo.update(account.id, { emailVerified: new Date() });

    // Defense in depth: drop any other pending verification tokens.
    await this.tokenStore.revokeAllForAccount({
      accountId: account.id,
      kind: "email-verification",
    });
  }
}
