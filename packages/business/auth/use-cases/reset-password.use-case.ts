import type { AccountRepository } from "../ports/account.repository";
import type { PasswordHasher } from "../ports/password-hasher.port";
import type { AuthTokenStore } from "../ports/auth-token-store.port";

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export class InvalidResetTokenError extends Error {
  constructor() {
    super("Token de redefinição inválido ou expirado");
    this.name = "InvalidResetTokenError";
  }
}

export class WeakPasswordError extends Error {
  constructor() {
    super("A senha deve ter pelo menos 8 caracteres");
    this.name = "WeakPasswordError";
  }
}

const MIN_PASSWORD_LENGTH = 8;

export class ResetPassword {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenStore: AuthTokenStore,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    if (!input.newPassword || input.newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new WeakPasswordError();
    }

    const consumed = await this.tokenStore.consume({
      token: input.token,
      kind: "password-reset",
    });
    if (!consumed) {
      throw new InvalidResetTokenError();
    }

    const account = await this.accountRepo.findById(consumed.accountId);
    if (!account) {
      throw new InvalidResetTokenError();
    }

    const passwordHash = await this.passwordHasher.hash(input.newPassword);
    await this.accountRepo.update(account.id, { passwordHash });

    // Burn any other pending reset tokens for this account so a parallel
    // request cannot be used after this one succeeds.
    await this.tokenStore.revokeAllForAccount({
      accountId: account.id,
      kind: "password-reset",
    });
  }
}
