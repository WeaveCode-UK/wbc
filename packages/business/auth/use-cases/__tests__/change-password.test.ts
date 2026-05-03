// ChangePassword — authenticated password rotation
//
// Invariants:
//   - Current password must verify against the stored hash.
//   - OAuth-only accounts (no passwordHash) are rejected.
//   - HIBP breach checker rejects with BreachedPasswordError when count > 0.
//   - HIBP `null` (infra outage) is fail-open: rotation still happens.
//   - On success the JwtBlacklist mass-revokes all JWTs at/before now (ACH-005).
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ChangePassword,
  BreachedPasswordError,
} from "../change-password.use-case";
import type { AccountRepository } from "../../ports/account.repository";
import type { PasswordHasher } from "../../ports/password-hasher.port";
import type { JwtBlacklist } from "../../ports/jwt-blacklist.port";
import type { PasswordBreachChecker } from "../../ports/password-breach-checker.port";
import { Account } from "../../domain/entities/account.entity";

function makeAccount(opts: { passwordHash?: string | null } = {}): Account {
  const passwordHash =
    "passwordHash" in opts ? opts.passwordHash! : "$2a$10$old";
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
    findById: vi.fn().mockResolvedValue(account),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn().mockResolvedValue(account ?? makeAccount()),
    delete: vi.fn(),
    deleteWithCleanup: vi.fn(),
    markLoggedIn: vi.fn(),
  };
}

function mockHasher(passwordValid: boolean): PasswordHasher {
  return {
    hash: vi.fn().mockResolvedValue("$2a$10$new"),
    verify: vi.fn().mockResolvedValue(passwordValid),
  };
}

function mockBlacklist(): JwtBlacklist {
  return {
    revoke: vi.fn(),
    isRevoked: vi.fn(),
    revokeAllForAccount: vi.fn().mockResolvedValue(undefined),
    getAccountRevokedBefore: vi.fn(),
    revokeAllForTenant: vi.fn(),
    getTenantRevokedBefore: vi.fn(),
    revokeAllGlobal: vi.fn(),
    getGlobalRevokedBefore: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ChangePassword", () => {
  it("rotates the password when current verifies", async () => {
    const repo = mockRepo(makeAccount());
    const hasher = mockHasher(true);
    const useCase = new ChangePassword(repo, hasher);

    await useCase.execute({
      accountId: "acc-1",
      currentPassword: "old",
      newPassword: "newSecurePass123!",
    });

    expect(hasher.verify).toHaveBeenCalledWith("old", "$2a$10$old");
    expect(hasher.hash).toHaveBeenCalledWith("newSecurePass123!");
    expect(repo.update).toHaveBeenCalledWith("acc-1", {
      passwordHash: "$2a$10$new",
    });
  });

  it("rejects when account is not found", async () => {
    const useCase = new ChangePassword(mockRepo(null), mockHasher(true));
    await expect(
      useCase.execute({
        accountId: "x",
        currentPassword: "a",
        newPassword: "b",
      }),
    ).rejects.toThrow(/nao encontrada/i);
  });

  it("rejects OAuth-only accounts (no passwordHash)", async () => {
    const repo = mockRepo(makeAccount({ passwordHash: null }));
    const useCase = new ChangePassword(repo, mockHasher(true));

    await expect(
      useCase.execute({
        accountId: "acc-1",
        currentPassword: "anything",
        newPassword: "irrelevant",
      }),
    ).rejects.toThrow(/Google/i);
  });

  it("rejects when current password is wrong", async () => {
    const useCase = new ChangePassword(
      mockRepo(makeAccount()),
      mockHasher(false),
    );
    await expect(
      useCase.execute({
        accountId: "acc-1",
        currentPassword: "wrong",
        newPassword: "any",
      }),
    ).rejects.toThrow(/Senha atual/i);
  });

  it("rejects HIBP-breached passwords with BreachedPasswordError", async () => {
    const breachChecker: PasswordBreachChecker = {
      countBreaches: vi.fn().mockResolvedValue(99),
    };
    const repo = mockRepo(makeAccount());
    const useCase = new ChangePassword(
      repo,
      mockHasher(true),
      undefined,
      undefined,
      breachChecker,
    );

    await expect(
      useCase.execute({
        accountId: "acc-1",
        currentPassword: "old",
        newPassword: "leaked",
      }),
    ).rejects.toBeInstanceOf(BreachedPasswordError);
    // No mutation when breach detected.
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("fail-opens when HIBP returns null (infra outage)", async () => {
    const breachChecker: PasswordBreachChecker = {
      countBreaches: vi.fn().mockResolvedValue(null),
    };
    const repo = mockRepo(makeAccount());
    const useCase = new ChangePassword(
      repo,
      mockHasher(true),
      undefined,
      undefined,
      breachChecker,
    );

    await useCase.execute({
      accountId: "acc-1",
      currentPassword: "old",
      newPassword: "newSecurePass123!",
    });
    expect(repo.update).toHaveBeenCalled();
  });

  it("mass-revokes JWTs after rotation (ACH-005)", async () => {
    const blacklist = mockBlacklist();
    const repo = mockRepo(makeAccount());
    const useCase = new ChangePassword(
      repo,
      mockHasher(true),
      blacklist,
      60 * 60,
    );

    const before = Math.floor(Date.now() / 1000);
    await useCase.execute({
      accountId: "acc-1",
      currentPassword: "old",
      newPassword: "newSecurePass123!",
    });
    const after = Math.floor(Date.now() / 1000);

    expect(blacklist.revokeAllForAccount).toHaveBeenCalledOnce();
    const args = (blacklist.revokeAllForAccount as ReturnType<typeof vi.fn>)
      .mock.calls[0]![0];
    expect(args.accountId).toBe("acc-1");
    expect(args.ttlSeconds).toBe(60 * 60);
    expect(args.revokedBeforeUnix).toBeGreaterThanOrEqual(before);
    expect(args.revokedBeforeUnix).toBeLessThanOrEqual(after);
  });
});
