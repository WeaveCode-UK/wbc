// T2.17 — ResetPassword (consume-token-and-set-password) use-case
//
// Token-lifecycle invariants we lock in:
//   - a valid (consumable) token leads to a fresh password hash + update
//   - the token is "burnt" by AuthTokenStore.consume — a second attempt to
//     reuse the same token is a fresh consume() call, which the store
//     contract says returns null → InvalidResetTokenError. We model that
//     here and assert the use-case still surfaces the same error
//   - expired/missing tokens (consume returns null) → InvalidResetTokenError
//     and NO password mutation happens
//   - successful reset triggers revokeAllForAccount so any *other* pending
//     reset link issued before this one is invalidated immediately
//   - successful reset triggers JwtBlacklist.revokeAllForAccount so a
//     hijacked session can't survive the password change (ACH-005)
//   - weak passwords (< 12 chars) are rejected before any side effect
//   - HIBP-breached passwords are rejected with BreachedPasswordError
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ResetPassword,
  InvalidResetTokenError,
  WeakPasswordError,
} from "../reset-password.use-case";
import { BreachedPasswordError } from "../change-password.use-case";
import type { AccountRepository } from "../../ports/account.repository";
import type { PasswordHasher } from "../../ports/password-hasher.port";
import type { AuthTokenStore } from "../../ports/auth-token-store.port";
import type { JwtBlacklist } from "../../ports/jwt-blacklist.port";
import type { PasswordBreachChecker } from "../../ports/password-breach-checker.port";
import { Account } from "../../domain/entities/account.entity";

function makeAccount() {
  return new Account({
    id: "acc-1",
    email: "user@example.com",
    name: "User",
    emailVerified: new Date("2026-01-01"),
    passwordHash: "$2a$10$old-hash",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  });
}

function mockAccountRepo(
  account: Account | null = makeAccount(),
): AccountRepository {
  return {
    findById: vi.fn().mockResolvedValue(account),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn().mockResolvedValue(account),
    delete: vi.fn(),
    deleteWithCleanup: vi.fn(),
    markLoggedIn: vi.fn(),
  };
}

function mockHasher(): PasswordHasher {
  return {
    hash: vi.fn().mockResolvedValue("$2a$10$new-hash"),
    verify: vi.fn().mockResolvedValue(true),
  };
}

function mockTokenStore(
  opts: { consumable: boolean } = { consumable: true },
): AuthTokenStore {
  return {
    issue: vi.fn(),
    consume: vi
      .fn()
      .mockResolvedValue(
        opts.consumable
          ? { accountId: "acc-1", kind: "password-reset" as const }
          : null,
      ),
    revokeAllForAccount: vi.fn().mockResolvedValue(undefined),
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

const STRONG_PASSWORD = "strongPassword123!";

describe("ResetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hashes and persists the new password when the token is valid", async () => {
    const repo = mockAccountRepo();
    const hasher = mockHasher();
    const tokens = mockTokenStore({ consumable: true });
    const useCase = new ResetPassword(repo, hasher, tokens);

    await useCase.execute({
      token: "good-token",
      newPassword: STRONG_PASSWORD,
    });

    expect(tokens.consume).toHaveBeenCalledWith({
      token: "good-token",
      kind: "password-reset",
    });
    expect(hasher.hash).toHaveBeenCalledWith(STRONG_PASSWORD);
    expect(repo.update).toHaveBeenCalledWith("acc-1", {
      passwordHash: "$2a$10$new-hash",
    });
  });

  it("rejects a reused/expired token (consume returns null) with InvalidResetTokenError", async () => {
    const repo = mockAccountRepo();
    const hasher = mockHasher();
    // Simulates both: (a) a 2nd attempt with an already-consumed token,
    // (b) a token past TTL — the store collapses both into "null".
    const tokens = mockTokenStore({ consumable: false });
    const useCase = new ResetPassword(repo, hasher, tokens);

    await expect(
      useCase.execute({ token: "burnt", newPassword: STRONG_PASSWORD }),
    ).rejects.toBeInstanceOf(InvalidResetTokenError);

    // No mutation may happen on a failed consume.
    expect(hasher.hash).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("rejects when consume succeeds but account no longer exists", async () => {
    const repo = mockAccountRepo(null);
    const hasher = mockHasher();
    const tokens = mockTokenStore({ consumable: true });
    const useCase = new ResetPassword(repo, hasher, tokens);

    await expect(
      useCase.execute({ token: "ok", newPassword: STRONG_PASSWORD }),
    ).rejects.toBeInstanceOf(InvalidResetTokenError);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("revokes any other pending reset tokens for the account on success", async () => {
    const repo = mockAccountRepo();
    const tokens = mockTokenStore({ consumable: true });
    const useCase = new ResetPassword(repo, mockHasher(), tokens);

    await useCase.execute({ token: "ok", newPassword: STRONG_PASSWORD });

    expect(tokens.revokeAllForAccount).toHaveBeenCalledWith({
      accountId: "acc-1",
      kind: "password-reset",
    });
  });

  it("invalidates issued JWTs via the blacklist on success (ACH-005)", async () => {
    const repo = mockAccountRepo();
    const tokens = mockTokenStore({ consumable: true });
    const blacklist = mockBlacklist();
    const useCase = new ResetPassword(
      repo,
      mockHasher(),
      tokens,
      blacklist,
      60 * 60,
    );

    const before = Math.floor(Date.now() / 1000);
    await useCase.execute({ token: "ok", newPassword: STRONG_PASSWORD });
    const after = Math.floor(Date.now() / 1000);

    expect(blacklist.revokeAllForAccount).toHaveBeenCalledOnce();
    const args = (blacklist.revokeAllForAccount as ReturnType<typeof vi.fn>)
      .mock.calls[0]![0];
    expect(args.accountId).toBe("acc-1");
    expect(args.ttlSeconds).toBe(60 * 60);
    expect(args.revokedBeforeUnix).toBeGreaterThanOrEqual(before);
    expect(args.revokedBeforeUnix).toBeLessThanOrEqual(after);
  });

  it("rejects passwords below the 12-char minimum before consuming the token", async () => {
    const tokens = mockTokenStore({ consumable: true });
    const hasher = mockHasher();
    const useCase = new ResetPassword(mockAccountRepo(), hasher, tokens);

    await expect(
      useCase.execute({ token: "ok", newPassword: "short" }),
    ).rejects.toBeInstanceOf(WeakPasswordError);

    // Token must NOT be burned by a weak-password attempt.
    expect(tokens.consume).not.toHaveBeenCalled();
    expect(hasher.hash).not.toHaveBeenCalled();
  });

  it("rejects an empty password without touching the token store", async () => {
    const tokens = mockTokenStore({ consumable: true });
    const useCase = new ResetPassword(mockAccountRepo(), mockHasher(), tokens);

    await expect(
      useCase.execute({ token: "ok", newPassword: "" }),
    ).rejects.toBeInstanceOf(WeakPasswordError);
    expect(tokens.consume).not.toHaveBeenCalled();
  });

  it("rejects HIBP-breached passwords with BreachedPasswordError", async () => {
    const breachChecker: PasswordBreachChecker = {
      countBreaches: vi.fn().mockResolvedValue(42),
    };
    const tokens = mockTokenStore({ consumable: true });
    const useCase = new ResetPassword(
      mockAccountRepo(),
      mockHasher(),
      tokens,
      undefined,
      undefined,
      breachChecker,
    );

    await expect(
      useCase.execute({ token: "ok", newPassword: STRONG_PASSWORD }),
    ).rejects.toBeInstanceOf(BreachedPasswordError);

    // Same forward guarantee as weak-password: the token is not burned.
    expect(tokens.consume).not.toHaveBeenCalled();
  });

  it("fail-opens on HIBP infra error (countBreaches → null) and proceeds", async () => {
    const breachChecker: PasswordBreachChecker = {
      countBreaches: vi.fn().mockResolvedValue(null),
    };
    const repo = mockAccountRepo();
    const tokens = mockTokenStore({ consumable: true });
    const useCase = new ResetPassword(
      repo,
      mockHasher(),
      tokens,
      undefined,
      undefined,
      breachChecker,
    );

    await useCase.execute({ token: "ok", newPassword: STRONG_PASSWORD });

    // Fail-open: password is rotated even though HIBP could not answer.
    expect(repo.update).toHaveBeenCalled();
  });
});
