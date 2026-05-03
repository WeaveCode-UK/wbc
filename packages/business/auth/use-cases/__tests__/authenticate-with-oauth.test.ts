// AuthenticateWithOAuth — link an OAuth identity to an account
//
// Invariants:
//   - Existing account is reused on email match — no duplicate Account row.
//   - First-time email creates the Account with `emailVerified=now` (we
//     trust the OAuth provider asserted ownership of the e-mail).
//   - First link with this provider → oauth row is CREATED.
//   - Subsequent login with same provider → oauth row tokens are UPDATED,
//     never duplicated.
//   - Email is normalised (trim + lowercase) before lookup AND on creation.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthenticateWithOAuth } from "../authenticate-with-oauth.use-case";
import type { AccountRepository } from "../../ports/account.repository";
import type { OAuthAccountRepository } from "../../ports/oauth-account.repository";
import { Account } from "../../domain/entities/account.entity";

function makeAccount(): Account {
  return new Account({
    id: "acc-1",
    email: "user@example.com",
    name: "User",
    emailVerified: new Date("2026-01-01"),
    passwordHash: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  });
}

function mockAccountRepo(existing: Account | null): AccountRepository {
  return {
    findById: vi.fn(),
    findByEmail: vi.fn().mockResolvedValue(existing),
    create: vi.fn().mockResolvedValue(makeAccount()),
    update: vi.fn(),
    delete: vi.fn(),
    deleteWithCleanup: vi.fn(),
    markLoggedIn: vi.fn(),
  };
}

function mockOAuthRepo(
  existing: { id: string } | null,
): OAuthAccountRepository {
  return {
    findByProviderAndAccountId: vi.fn(),
    findByAccountIdAndProvider: vi.fn().mockResolvedValue(existing),
    create: vi.fn().mockResolvedValue({ id: "oauth-1", accountId: "acc-1" }),
    updateTokens: vi.fn().mockResolvedValue(undefined),
    deleteByAccountId: vi.fn(),
  };
}

const BASE_INPUT = {
  email: "user@example.com",
  name: "User",
  provider: "google",
  providerAccountId: "google-uid-123",
  accessToken: "at",
  refreshToken: "rt",
  expiresAt: 1234567890,
  tokenType: "Bearer",
  scope: "email profile",
  idToken: "id-tok",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuthenticateWithOAuth", () => {
  it("creates a new account when no email match exists", async () => {
    const accountRepo = mockAccountRepo(null);
    const oauthRepo = mockOAuthRepo(null);
    const useCase = new AuthenticateWithOAuth(accountRepo, oauthRepo);

    await useCase.execute(BASE_INPUT);

    expect(accountRepo.create).toHaveBeenCalledOnce();
    const createArg = (accountRepo.create as ReturnType<typeof vi.fn>).mock
      .calls[0]![0];
    expect(createArg.email).toBe("user@example.com");
    // emailVerified is set at creation — OAuth providers vouch for the email.
    expect(createArg.emailVerified).toBeInstanceOf(Date);
  });

  it("reuses the existing account on email match (no duplicate)", async () => {
    const accountRepo = mockAccountRepo(makeAccount());
    const oauthRepo = mockOAuthRepo(null);
    const useCase = new AuthenticateWithOAuth(accountRepo, oauthRepo);

    const result = await useCase.execute(BASE_INPUT);

    expect(result.id).toBe("acc-1");
    expect(accountRepo.create).not.toHaveBeenCalled();
  });

  it("creates the oauth row on first link with this provider", async () => {
    const accountRepo = mockAccountRepo(makeAccount());
    const oauthRepo = mockOAuthRepo(null);
    const useCase = new AuthenticateWithOAuth(accountRepo, oauthRepo);

    await useCase.execute(BASE_INPUT);

    expect(oauthRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        accountId: "acc-1",
        provider: "google",
        providerAccountId: "google-uid-123",
        accessToken: "at",
        refreshToken: "rt",
      }),
    );
    expect(oauthRepo.updateTokens).not.toHaveBeenCalled();
  });

  it("updates existing oauth tokens on subsequent login", async () => {
    const accountRepo = mockAccountRepo(makeAccount());
    const oauthRepo = mockOAuthRepo({ id: "oauth-existing" });
    const useCase = new AuthenticateWithOAuth(accountRepo, oauthRepo);

    await useCase.execute(BASE_INPUT);

    expect(oauthRepo.updateTokens).toHaveBeenCalledWith("oauth-existing", {
      accessToken: "at",
      refreshToken: "rt",
      expiresAt: 1234567890,
    });
    expect(oauthRepo.create).not.toHaveBeenCalled();
  });

  it("normalises the email (trim + lowercase) on lookup AND creation", async () => {
    const accountRepo = mockAccountRepo(null);
    const oauthRepo = mockOAuthRepo(null);
    const useCase = new AuthenticateWithOAuth(accountRepo, oauthRepo);

    await useCase.execute({ ...BASE_INPUT, email: "  USER@Example.COM " });

    expect(accountRepo.findByEmail).toHaveBeenCalledWith("user@example.com");
    const createArg = (accountRepo.create as ReturnType<typeof vi.fn>).mock
      .calls[0]![0];
    expect(createArg.email).toBe("user@example.com");
  });
});
