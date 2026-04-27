import type { AccountRepository } from "../ports/account.repository";
import type { PasswordHasher } from "../ports/password-hasher.port";
import type { Account } from "../domain/entities/account.entity";
import type { LoginAttemptTracker } from "../ports/login-attempt-tracker.port";
import type { VerifyTotp } from "./verify-totp.use-case";

export interface AuthenticateWithCredentialsInput {
  email: string;
  password: string;
  /**
   * Optional client IP. Used to scope the lockout per (email, IP) pair when
   * present, falling back to email-only otherwise.
   */
  ipAddress?: string;
  /**
   * Optional 6-digit TOTP token (or 24-char recovery code). Required only
   * when the resolved account has `totpEnabled = true` (ACH-003).
   */
  totpToken?: string;
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

/**
 * Raised when password is correct but the account has TOTP enabled and the
 * caller did not supply a TOTP token. The frontend uses this to render a
 * second-factor prompt without re-collecting the password (ACH-003).
 */
export class MfaRequiredError extends Error {
  constructor() {
    super("Código de autenticação em dois fatores obrigatório");
    this.name = "MfaRequiredError";
  }
}

/**
 * Raised when the supplied TOTP token (or recovery code) does not match the
 * account secret. Distinct from `InvalidCredentialsError` so the UI can
 * keep the password field and re-prompt only the TOTP field (ACH-003).
 */
export class InvalidMfaTokenError extends Error {
  constructor() {
    super("Código de autenticação inválido");
    this.name = "InvalidMfaTokenError";
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
    /**
     * Optional TOTP verifier. When supplied, accounts with `totpEnabled=true`
     * must provide a valid token in `input.totpToken`. Wired in
     * `apps/web/src/lib/auth.config.ts` so production logins enforce MFA;
     * left optional so unit tests of the password path stay focused.
     */
    private readonly verifyTotp?: VerifyTotp,
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

    // ACH-003: enforce TOTP second factor when the account opted in.
    // Failures here do NOT clear the lockout — the password was right but
    // the second factor must complete before we count it as a real login.
    if (account.totpEnabled && this.verifyTotp) {
      if (!input.totpToken) {
        throw new MfaRequiredError();
      }
      const ok = await this.verifyTotp.execute({
        accountId: account.id,
        token: input.totpToken,
      });
      if (!ok) {
        if (this.attemptTracker) {
          await this.attemptTracker.recordFailure(trackerKey);
        }
        throw new InvalidMfaTokenError();
      }
    }

    if (this.attemptTracker) {
      await this.attemptTracker.clearAttempts(trackerKey);
    }
    return account;
  }
}
