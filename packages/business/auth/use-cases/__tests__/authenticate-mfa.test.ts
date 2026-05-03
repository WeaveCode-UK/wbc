// T2.19 — AuthenticateWithCredentials, MFA + lockout flow
//
// We focus on the MFA + lockout interactions (the basic password path is
// already covered by integration tests). The contract under test:
//
//   - Account has totpEnabled=true and the caller did not send a totpToken
//     → MfaRequiredError (the api maps this to a UI prompt).
//   - Account has totpEnabled=true, password is valid but totpToken is
//     wrong → InvalidMfaTokenError, AND the LoginAttemptTracker is bumped
//     (so brute-forcing the second factor still trips the lockout).
//   - When the tracker reports `isLocked=true` BEFORE password check, the
//     use-case throws AccountLockedError. The trpc layer maps this to
//     HTTP 429 (apps/api/src/trpc/error-handler.ts).
//   - Successful MFA login clears the failure counter for both the
//     (email, IP) tracker and the IP-only tracker.
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AuthenticateWithCredentials,
  AccountLockedError,
  InvalidCredentialsError,
  InvalidMfaTokenError,
  MfaRequiredError,
} from "../authenticate-with-credentials.use-case";
import type { AccountRepository } from "../../ports/account.repository";
import type { PasswordHasher } from "../../ports/password-hasher.port";
import type { LoginAttemptTracker } from "../../ports/login-attempt-tracker.port";
import type { VerifyTotp } from "../verify-totp.use-case";
import { Account } from "../../domain/entities/account.entity";

type MfaAccountOpts = { totpEnabled?: boolean };

function makeAccount(opts: MfaAccountOpts = {}) {
  return new Account({
    id: "acc-1",
    email: "user@example.com",
    name: "User",
    emailVerified: new Date("2026-01-01"),
    passwordHash: "$2a$10$valid-hash",
    totpEnabled: opts.totpEnabled ?? false,
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

function mockVerifyTotp(ok: boolean): VerifyTotp {
  // VerifyTotp is a class with `.execute()`; only `execute` is touched
  // by AuthenticateWithCredentials so we build a minimal stand-in.
  return {
    execute: vi.fn().mockResolvedValue(ok),
  } as unknown as VerifyTotp;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuthenticateWithCredentials — MFA flow (T2.19)", () => {
  it("password OK but totpEnabled and no token → MfaRequiredError", async () => {
    const repo = mockRepo(makeAccount({ totpEnabled: true }));
    const hasher = mockHasher(true);
    const tracker = mockTracker();
    const verifyTotp = mockVerifyTotp(true);

    const useCase = new AuthenticateWithCredentials(
      repo,
      hasher,
      tracker,
      verifyTotp,
    );

    await expect(
      useCase.execute({ email: "user@example.com", password: "p" }),
    ).rejects.toBeInstanceOf(MfaRequiredError);

    // verifyTotp must NOT be invoked when no token was supplied.
    expect(verifyTotp.execute).not.toHaveBeenCalled();
    // And the lockout counter is NOT bumped for missing-second-factor —
    // the password was valid, so this isn't a credential brute force.
    expect(tracker.recordFailure).not.toHaveBeenCalled();
  });

  it("password OK + invalid totpToken → InvalidMfaTokenError AND counter bumps", async () => {
    const repo = mockRepo(makeAccount({ totpEnabled: true }));
    const hasher = mockHasher(true);
    const tracker = mockTracker();
    const ipTracker = mockTracker();
    const verifyTotp = mockVerifyTotp(false);

    const useCase = new AuthenticateWithCredentials(
      repo,
      hasher,
      tracker,
      verifyTotp,
      ipTracker,
    );

    await expect(
      useCase.execute({
        email: "user@example.com",
        password: "p",
        ipAddress: "203.0.113.5",
        totpToken: "000000",
      }),
    ).rejects.toBeInstanceOf(InvalidMfaTokenError);

    expect(verifyTotp.execute).toHaveBeenCalledWith({
      accountId: "acc-1",
      token: "000000",
    });
    // Both trackers tick on a failed second factor — that's the brute-force
    // protection for the MFA prompt.
    expect(tracker.recordFailure).toHaveBeenCalledOnce();
    expect(ipTracker.recordFailure).toHaveBeenCalledOnce();
    expect(tracker.clearAttempts).not.toHaveBeenCalled();
  });

  it("counter increments on every invalid-MFA attempt across calls", async () => {
    const repo = mockRepo(makeAccount({ totpEnabled: true }));
    const hasher = mockHasher(true);
    const tracker = mockTracker();
    const verifyTotp = mockVerifyTotp(false);

    const useCase = new AuthenticateWithCredentials(
      repo,
      hasher,
      tracker,
      verifyTotp,
    );

    // 3 wrong second-factor attempts.
    for (let i = 0; i < 3; i++) {
      await expect(
        useCase.execute({
          email: "user@example.com",
          password: "p",
          totpToken: `00000${i}`,
        }),
      ).rejects.toBeInstanceOf(InvalidMfaTokenError);
    }

    expect(tracker.recordFailure).toHaveBeenCalledTimes(3);
  });

  it("after the lockout fires (isLocked=true) → AccountLockedError before password check", async () => {
    const repo = mockRepo(makeAccount({ totpEnabled: true }));
    const hasher = mockHasher(true);
    const tracker = mockTracker({ locked: true });
    const verifyTotp = mockVerifyTotp(true);

    const useCase = new AuthenticateWithCredentials(
      repo,
      hasher,
      tracker,
      verifyTotp,
    );

    await expect(
      useCase.execute({
        email: "user@example.com",
        password: "right-password",
        totpToken: "123456",
      }),
    ).rejects.toBeInstanceOf(AccountLockedError);

    // Lockout short-circuits — neither password nor TOTP is checked.
    expect(hasher.verify).not.toHaveBeenCalled();
    expect(verifyTotp.execute).not.toHaveBeenCalled();
  });

  it("the IP-only lockout also triggers AccountLockedError (ACH-006)", async () => {
    const repo = mockRepo(makeAccount({ totpEnabled: true }));
    const hasher = mockHasher(true);
    const emailTracker = mockTracker({ locked: false });
    const ipTracker = mockTracker({ locked: true });
    const verifyTotp = mockVerifyTotp(true);

    const useCase = new AuthenticateWithCredentials(
      repo,
      hasher,
      emailTracker,
      verifyTotp,
      ipTracker,
    );

    await expect(
      useCase.execute({
        email: "user@example.com",
        password: "p",
        ipAddress: "203.0.113.5",
        totpToken: "123456",
      }),
    ).rejects.toBeInstanceOf(AccountLockedError);
    expect(hasher.verify).not.toHaveBeenCalled();
  });

  it("successful MFA login clears the failure counter on both trackers", async () => {
    const repo = mockRepo(makeAccount({ totpEnabled: true }));
    const hasher = mockHasher(true);
    const tracker = mockTracker();
    const ipTracker = mockTracker();
    const verifyTotp = mockVerifyTotp(true);

    const useCase = new AuthenticateWithCredentials(
      repo,
      hasher,
      tracker,
      verifyTotp,
      ipTracker,
    );

    const account = await useCase.execute({
      email: "user@example.com",
      password: "p",
      ipAddress: "203.0.113.5",
      totpToken: "123456",
    });

    expect(account.id).toBe("acc-1");
    expect(tracker.clearAttempts).toHaveBeenCalledOnce();
    expect(ipTracker.clearAttempts).toHaveBeenCalledOnce();
  });

  it("wrong password (totpEnabled=true) — InvalidCredentialsError, never asks for MFA", async () => {
    const repo = mockRepo(makeAccount({ totpEnabled: true }));
    const hasher = mockHasher(false); // password verification fails
    const tracker = mockTracker();
    const verifyTotp = mockVerifyTotp(true);

    const useCase = new AuthenticateWithCredentials(
      repo,
      hasher,
      tracker,
      verifyTotp,
    );

    // Distinct from MfaRequiredError — password is the failing branch.
    await expect(
      useCase.execute({ email: "user@example.com", password: "wrong" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(verifyTotp.execute).not.toHaveBeenCalled();
    expect(tracker.recordFailure).toHaveBeenCalledOnce();
  });

  it("totpEnabled=false ignores the totpToken and logs in on valid password", async () => {
    const repo = mockRepo(makeAccount({ totpEnabled: false }));
    const hasher = mockHasher(true);
    const tracker = mockTracker();
    const verifyTotp = mockVerifyTotp(false);

    const useCase = new AuthenticateWithCredentials(
      repo,
      hasher,
      tracker,
      verifyTotp,
    );

    const account = await useCase.execute({
      email: "user@example.com",
      password: "p",
      totpToken: "ignored",
    });
    expect(account.id).toBe("acc-1");
    expect(verifyTotp.execute).not.toHaveBeenCalled();
  });
});
