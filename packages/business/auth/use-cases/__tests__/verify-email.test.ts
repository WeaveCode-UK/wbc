// VerifyEmail — consume the email-verification token and stamp emailVerified
//
// Invariants:
//   - The token is consumed atomically; if `consume` returns null the use-case
//     throws InvalidVerificationTokenError and never touches the account.
//   - When the resolved account no longer exists we still throw the same
//     error (anti-enumeration).
//   - Already-verified accounts are an idempotent no-op (no update, no
//     re-revoke).
//   - On success: account.update({ emailVerified: now }) AND any other
//     pending verification tokens are revoked (defense in depth).
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  VerifyEmail,
  InvalidVerificationTokenError,
} from "../verify-email.use-case";
import type { AccountRepository } from "../../ports/account.repository";
import type { AuthTokenStore } from "../../ports/auth-token-store.port";
import { Account } from "../../domain/entities/account.entity";

function makeAccount(verified = false): Account {
  return new Account({
    id: "acc-1",
    email: "user@example.com",
    name: "User",
    emailVerified: verified ? new Date("2026-01-01") : null,
    passwordHash: "$2a$10$h",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  });
}

function mockRepo(account: Account | null): AccountRepository {
  return {
    findById: vi.fn().mockResolvedValue(account),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn(),
    deleteWithCleanup: vi.fn(),
    markLoggedIn: vi.fn(),
  };
}

function mockTokenStore(consumable: boolean): AuthTokenStore {
  return {
    issue: vi.fn(),
    consume: vi
      .fn()
      .mockResolvedValue(
        consumable
          ? { accountId: "acc-1", kind: "email-verification" as const }
          : null,
      ),
    revokeAllForAccount: vi.fn().mockResolvedValue(undefined),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("VerifyEmail", () => {
  it("stamps emailVerified and revokes other pending tokens", async () => {
    const repo = mockRepo(makeAccount(false));
    const tokens = mockTokenStore(true);
    const useCase = new VerifyEmail(repo, tokens);

    await useCase.execute({ token: "good" });

    expect(tokens.consume).toHaveBeenCalledWith({
      token: "good",
      kind: "email-verification",
    });
    expect(repo.update).toHaveBeenCalledWith(
      "acc-1",
      expect.objectContaining({ emailVerified: expect.any(Date) }),
    );
    expect(tokens.revokeAllForAccount).toHaveBeenCalledWith({
      accountId: "acc-1",
      kind: "email-verification",
    });
  });

  it("throws InvalidVerificationTokenError when consume returns null", async () => {
    const repo = mockRepo(makeAccount(false));
    const tokens = mockTokenStore(false);
    const useCase = new VerifyEmail(repo, tokens);

    await expect(useCase.execute({ token: "burnt" })).rejects.toBeInstanceOf(
      InvalidVerificationTokenError,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("throws InvalidVerificationTokenError when account is missing post-consume", async () => {
    // consume succeeded (stale entry), but the account row was hard-deleted.
    const useCase = new VerifyEmail(mockRepo(null), mockTokenStore(true));

    await expect(useCase.execute({ token: "ok" })).rejects.toBeInstanceOf(
      InvalidVerificationTokenError,
    );
  });

  it("is idempotent for already-verified accounts (no update, no revoke)", async () => {
    const repo = mockRepo(makeAccount(true));
    const tokens = mockTokenStore(true);
    const useCase = new VerifyEmail(repo, tokens);

    await useCase.execute({ token: "ok" });

    expect(repo.update).not.toHaveBeenCalled();
    expect(tokens.revokeAllForAccount).not.toHaveBeenCalled();
  });
});
