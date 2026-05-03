// AuthenticateWithCredentials — happy path, anti-enumeration, lockout
//
// The MFA branches are owned by `authenticate-mfa.test.ts`. Here we cover:
//   - Wrong-password and missing-account both throw InvalidCredentialsError
//     and BOTH still run bcrypt verify (timing equalisation, ACH-004).
//   - Email is normalised (trim + lowercase) before lookup.
//   - On success the lockout counters (email-key + IP-only) are cleared.
//   - OAuth-only accounts (no passwordHash) reject the same way as wrong
//     password — never leak that the account exists.
//   - Email-keyed lockout fires before findByEmail.
//   - IP-only lockout (ACH-006) fires before findByEmail.
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AuthenticateWithCredentials,
  AccountLockedError,
  InvalidCredentialsError,
} from "../authenticate-with-credentials.use-case";
import type { AccountRepository } from "../../ports/account.repository";
import type { PasswordHasher } from "../../ports/password-hasher.port";
import type { LoginAttemptTracker } from "../../ports/login-attempt-tracker.port";
import { Account } from "../../domain/entities/account.entity";

function makeAccount(opts: { passwordHash?: string | null } = {}) {
  // OAuth-only accounts have passwordHash=null; we want to exercise that path.
  const passwordHash =
    "passwordHash" in opts ? opts.passwordHash! : "$2a$10$valid";
  return new Account({
    id: "acc-1",
    email: "user@example.com",
    name: "User",
    emailVerified: new Date("2026-01-01"),
    passwordHash,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  });
}

function mockRepo(account: Account | null): AccountRepository {
  return {
    findById: vi.fn(),
    findByEmail: vi.fn().mockResolvedValue(account),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteWithCleanup: vi.fn(),
    markLoggedIn: vi.fn(),
  };
}

function mockHasher(passwordValid: boolean): PasswordHasher {
  return {
    hash: vi.fn(),
    verify: vi.fn().mockResolvedValue(passwordValid),
  };
}

function mockTracker(
  opts: { locked: boolean } = { locked: false },
): LoginAttemptTracker {
  return {
    isLocked: vi.fn().mockResolvedValue(opts.locked),
    recordFailure: vi.fn().mockResolvedValue(1),
    clearAttempts: vi.fn().mockResolvedValue(undefined),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuthenticateWithCredentials — credentials path", () => {
  it("returns the account on a valid email + password", async () => {
    const repo = mockRepo(makeAccount());
    const hasher = mockHasher(true);
    const useCase = new AuthenticateWithCredentials(repo, hasher);

    const account = await useCase.execute({
      email: "user@example.com",
      password: "any",
    });

    expect(account.id).toBe("acc-1");
    expect(hasher.verify).toHaveBeenCalledWith("any", "$2a$10$valid");
  });

  it("normalises email to trimmed lowercase before lookup", async () => {
    const repo = mockRepo(makeAccount());
    const useCase = new AuthenticateWithCredentials(repo, mockHasher(true));

    await useCase.execute({
      email: "  USER@Example.COM  ",
      password: "p",
    });

    expect(repo.findByEmail).toHaveBeenCalledWith("user@example.com");
  });

  it("missing account → InvalidCredentialsError but bcrypt still runs (timing)", async () => {
    const repo = mockRepo(null);
    const hasher = mockHasher(false);
    const useCase = new AuthenticateWithCredentials(repo, hasher);

    await expect(
      useCase.execute({ email: "ghost@example.com", password: "p" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    // Hasher MUST be called against the decoy hash even when account is null.
    expect(hasher.verify).toHaveBeenCalledOnce();
  });

  it("OAuth-only account (passwordHash=null) → InvalidCredentialsError", async () => {
    const repo = mockRepo(makeAccount({ passwordHash: null }));
    const useCase = new AuthenticateWithCredentials(repo, mockHasher(true));

    await expect(
      useCase.execute({ email: "user@example.com", password: "p" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("wrong password bumps email-keyed counter (no IP)", async () => {
    const tracker = mockTracker();
    const useCase = new AuthenticateWithCredentials(
      mockRepo(makeAccount()),
      mockHasher(false),
      tracker,
    );

    await expect(
      useCase.execute({ email: "user@example.com", password: "wrong" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(tracker.recordFailure).toHaveBeenCalledWith("user@example.com");
  });

  it("wrong password with IP bumps both (email:ip) and ip-only trackers", async () => {
    const tracker = mockTracker();
    const ipTracker = mockTracker();
    const useCase = new AuthenticateWithCredentials(
      mockRepo(makeAccount()),
      mockHasher(false),
      tracker,
      undefined,
      ipTracker,
    );

    await expect(
      useCase.execute({
        email: "user@example.com",
        password: "wrong",
        ipAddress: "1.2.3.4",
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    expect(tracker.recordFailure).toHaveBeenCalledWith(
      "user@example.com:1.2.3.4",
    );
    expect(ipTracker.recordFailure).toHaveBeenCalledWith("1.2.3.4");
  });

  it("email-keyed lockout fires BEFORE findByEmail (short-circuit)", async () => {
    const repo = mockRepo(makeAccount());
    const tracker = mockTracker({ locked: true });
    const useCase = new AuthenticateWithCredentials(
      repo,
      mockHasher(true),
      tracker,
    );

    await expect(
      useCase.execute({ email: "user@example.com", password: "p" }),
    ).rejects.toBeInstanceOf(AccountLockedError);
    // No DB lookup, no bcrypt — pure denial.
    expect(repo.findByEmail).not.toHaveBeenCalled();
  });

  it("ip-only lockout fires before findByEmail (ACH-006)", async () => {
    const repo = mockRepo(makeAccount());
    const ipTracker = mockTracker({ locked: true });
    const useCase = new AuthenticateWithCredentials(
      repo,
      mockHasher(true),
      mockTracker({ locked: false }),
      undefined,
      ipTracker,
    );

    await expect(
      useCase.execute({
        email: "user@example.com",
        password: "p",
        ipAddress: "9.9.9.9",
      }),
    ).rejects.toBeInstanceOf(AccountLockedError);
    expect(repo.findByEmail).not.toHaveBeenCalled();
  });

  it("on success clears the email-keyed counter", async () => {
    const tracker = mockTracker();
    const useCase = new AuthenticateWithCredentials(
      mockRepo(makeAccount()),
      mockHasher(true),
      tracker,
    );

    await useCase.execute({ email: "user@example.com", password: "p" });
    expect(tracker.clearAttempts).toHaveBeenCalledWith("user@example.com");
  });

  it("on success with IP clears both trackers", async () => {
    const tracker = mockTracker();
    const ipTracker = mockTracker();
    const useCase = new AuthenticateWithCredentials(
      mockRepo(makeAccount()),
      mockHasher(true),
      tracker,
      undefined,
      ipTracker,
    );

    await useCase.execute({
      email: "user@example.com",
      password: "p",
      ipAddress: "1.2.3.4",
    });
    expect(tracker.clearAttempts).toHaveBeenCalledWith(
      "user@example.com:1.2.3.4",
    );
    expect(ipTracker.clearAttempts).toHaveBeenCalledWith("1.2.3.4");
  });
});
