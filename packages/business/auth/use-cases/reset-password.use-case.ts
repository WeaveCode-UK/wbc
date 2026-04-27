import type { AccountRepository } from "../ports/account.repository";
import type { PasswordHasher } from "../ports/password-hasher.port";
import type { AuthTokenStore } from "../ports/auth-token-store.port";
import type { JwtBlacklist } from "../ports/jwt-blacklist.port";
import type { PasswordBreachChecker } from "../ports/password-breach-checker.port";
import { BreachedPasswordError } from "./change-password.use-case";

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
    super("A senha deve ter pelo menos 12 caracteres");
    this.name = "WeakPasswordError";
  }
}

// ACH-004: aligned with passwordPolicySchema in @wbc/validators (12 chars).
const MIN_PASSWORD_LENGTH = 12;

export class ResetPassword {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenStore: AuthTokenStore,
    /**
     * Optional JWT blacklist. ResetPassword is the recovery path, so the
     * legitimate user often has *no* session at the moment of reset — but
     * an attacker with a parallel hijacked session must not survive the
     * reset. See ACH-005.
     */
    private readonly jwtBlacklist?: JwtBlacklist,
    private readonly revokeTtlSeconds: number = 60 * 60,
    /**
     * ACH-004: HIBP breach checker. Same contract as in ChangePassword —
     * fail-open on infra error.
     */
    private readonly breachChecker?: PasswordBreachChecker,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    if (!input.newPassword || input.newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new WeakPasswordError();
    }

    // ACH-004: reject known-breached passwords on reset too. The router
    // schema also enforces min-length, but we keep the use-case-level guard
    // for callers that bypass the schema (tests, internal scripts).
    if (this.breachChecker) {
      const breachCount = await this.breachChecker.countBreaches(
        input.newPassword,
      );
      if (breachCount !== null && breachCount > 0) {
        throw new BreachedPasswordError(breachCount);
      }
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

    // ACH-005: invalidate every JWT issued for this account at or before
    // the reset moment. Closes the window where a hijacked session could
    // outlive the password change.
    if (this.jwtBlacklist) {
      const nowUnix = Math.floor(Date.now() / 1000);
      await this.jwtBlacklist.revokeAllForAccount({
        accountId: account.id,
        revokedBeforeUnix: nowUnix,
        ttlSeconds: this.revokeTtlSeconds,
      });
    }
  }
}
