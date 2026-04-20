import type { AccountRepository } from "../ports/account.repository";
import type { PasswordHasher } from "../ports/password-hasher.port";
import type { Account } from "../domain/entities/account.entity";
import type { LoginAttemptTracker } from "../ports/login-attempt-tracker.port";

export interface AuthenticateWithCredentialsInput {
  email: string;
  password: string;
  /**
   * Optional client IP. Used to scope the lockout per (email, IP) pair when
   * present, falling back to email-only otherwise.
   */
  ipAddress?: string;
}

/**
 * Single error message returned for every credential failure (account
 * missing, OAuth-only account, wrong password). Distinct messages would let
 * an attacker enumerate accounts (ACH-004).
 */
export class InvalidCredentialsError extends Error {
  constructor() {
    super("E-mail ou senha inválidos");
    this.name = "InvalidCredentialsError";
  }
}

/**
 * Reuses the same user-facing message as `InvalidCredentialsError` so a
 * locked account is indistinguishable from a wrong password — preserves the
 * anti-enumeration property even when the lockout fires (ACH-003).
 */
export class AccountLockedError extends Error {
  constructor() {
    super("E-mail ou senha inválidos");
    this.name = "AccountLockedError";
  }
}

// Pre-computed bcrypt hash used to equalize timing when the account does not
// exist. Keeps `passwordHasher.verify` on the hot path even when there is no
// real hash to compare against — defeats account enumeration via response
// time (ACH-004).
const TIMING_DECOY_HASH =
  "$2a$10$CwTycUXWue0Thq9StjUM0uJ8yL4SfFWZpw1zZl1OvSn0lWg9UGsKa";

export class AuthenticateWithCredentials {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly attemptTracker?: LoginAttemptTracker,
  ) {}

  async execute(input: AuthenticateWithCredentialsInput): Promise<Account> {
    const email = input.email.trim().toLowerCase();
    const trackerKey = input.ipAddress ? `${email}:${input.ipAddress}` : email;

    if (
      this.attemptTracker &&
      (await this.attemptTracker.isLocked(trackerKey))
    ) {
      throw new AccountLockedError();
    }

    const account = await this.accountRepo.findByEmail(email);

    // Always run bcrypt to equalize response time between the
    // "account-missing" and "wrong-password" branches.
    const hashToVerify = account?.passwordHash ?? TIMING_DECOY_HASH;
    const isValid = await this.passwordHasher.verify(
      input.password,
      hashToVerify,
    );

    if (!account || !account.hasPassword() || !isValid) {
      if (this.attemptTracker) {
        await this.attemptTracker.recordFailure(trackerKey);
      }
      throw new InvalidCredentialsError();
    }

    if (this.attemptTracker) {
      await this.attemptTracker.clearAttempts(trackerKey);
    }
    return account;
  }
}
