// T2.16 — RequestPasswordReset use-case
//
// Invariants we lock in:
//   - the use-case never returns the issued token to the caller (so it
//     cannot leak via tRPC response logging) — only the EmailSender sees it
//   - tokens are produced by AuthTokenStore.issue, which is the boundary
//     responsible for hashing/opaque storage; the use-case must NOT pass
//     the plaintext token to any other port (Account/etc.)
//   - a previous pending token for the same account is revoked before a
//     new one is issued (guards against reuse of a parallel reset link)
//   - unknown e-mails resolve silently (anti-enumeration) — no token is
//     ever issued, no e-mail is dispatched
//   - OAuth-only accounts (no passwordHash) are also silently ignored
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RequestPasswordReset } from "../request-password-reset.use-case";
import type { AccountRepository } from "../../ports/account.repository";
import type { EmailSender } from "../../ports/email-sender.port";
import type { AuthTokenStore } from "../../ports/auth-token-store.port";
import { Account } from "../../domain/entities/account.entity";

function makeAccount(overrides: { passwordHash?: string | null } = {}) {
  // `??` would coalesce an explicit null to the default, masking the
  // OAuth-only branch — pick by `in` instead so callers can pass null.
  const passwordHash =
    "passwordHash" in overrides
      ? overrides.passwordHash!
      : "$2a$10$existinghash";
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

function mockAccountRepo(account: Account | null): AccountRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByEmail: vi.fn().mockResolvedValue(account),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteWithCleanup: vi.fn(),
    markLoggedIn: vi.fn().mockResolvedValue(undefined),
  };
}

function mockEmailSender(): EmailSender {
  return { send: vi.fn().mockResolvedValue(undefined) };
}

function mockTokenStore(token = "opaque-token-abcdef"): AuthTokenStore {
  return {
    issue: vi.fn().mockResolvedValue({
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    }),
    consume: vi.fn().mockResolvedValue(null),
    revokeAllForAccount: vi.fn().mockResolvedValue(undefined),
  };
}

describe("RequestPasswordReset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("issues a token via the token store with kind=password-reset", async () => {
    const repo = mockAccountRepo(makeAccount());
    const email = mockEmailSender();
    const tokens = mockTokenStore();
    const useCase = new RequestPasswordReset(
      repo,
      email,
      tokens,
      "https://app.example.com",
    );

    await useCase.execute({ email: "user@example.com" });

    expect(tokens.issue).toHaveBeenCalledOnce();
    expect(tokens.issue).toHaveBeenCalledWith({
      accountId: "acc-1",
      kind: "password-reset",
      ttlSeconds: 60 * 60,
    });
  });

  it("revokes any pending reset tokens BEFORE issuing the new one", async () => {
    const repo = mockAccountRepo(makeAccount());
    const email = mockEmailSender();
    const tokens = mockTokenStore();
    // Spy on call order — revokeAllForAccount must run before issue.
    const order: string[] = [];
    (tokens.revokeAllForAccount as ReturnType<typeof vi.fn>).mockImplementation(
      async () => {
        order.push("revoke");
      },
    );
    (tokens.issue as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      order.push("issue");
      return {
        token: "opaque",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      };
    });

    const useCase = new RequestPasswordReset(repo, email, tokens, "https://x");
    await useCase.execute({ email: "user@example.com" });

    expect(order).toEqual(["revoke", "issue"]);
    expect(tokens.revokeAllForAccount).toHaveBeenCalledWith({
      accountId: "acc-1",
      kind: "password-reset",
    });
  });

  it("dispatches the reset email with a link containing the token", async () => {
    const repo = mockAccountRepo(makeAccount());
    const email = mockEmailSender();
    const tokens = mockTokenStore("plain-token-123");
    const useCase = new RequestPasswordReset(
      repo,
      email,
      tokens,
      "https://app.example.com",
    );

    await useCase.execute({ email: "user@example.com" });

    expect(email.send).toHaveBeenCalledOnce();
    const msg = (email.send as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(msg.to).toBe("user@example.com");
    expect(msg.subject).toContain("senha");
    expect(msg.html).toContain("plain-token-123");
    expect(msg.html).toContain("https://app.example.com/reset-password?token=");
  });

  it("does not return the token to the caller (anti-leak)", async () => {
    const repo = mockAccountRepo(makeAccount());
    const email = mockEmailSender();
    const tokens = mockTokenStore("super-secret");
    const useCase = new RequestPasswordReset(repo, email, tokens, "https://x");

    const result = await useCase.execute({ email: "user@example.com" });
    // Use-case is void — the token never crosses the use-case boundary.
    expect(result).toBeUndefined();
  });

  it("does NOT pass the plaintext token to AccountRepository (only the store sees it)", async () => {
    const repo = mockAccountRepo(makeAccount());
    const email = mockEmailSender();
    const tokens = mockTokenStore("plain-token-xyz");
    const useCase = new RequestPasswordReset(repo, email, tokens, "https://x");

    await useCase.execute({ email: "user@example.com" });

    // Sanity: the account repo update is never invoked at request time —
    // the password is only changed by ResetPassword (consume step).
    expect(repo.update).not.toHaveBeenCalled();
    // And we never store the plaintext token via account fields.
    const updateCalls = (repo.update as ReturnType<typeof vi.fn>).mock.calls;
    for (const c of updateCalls) {
      expect(JSON.stringify(c)).not.toContain("plain-token-xyz");
    }
  });

  it("normalises the email (trim + lowercase) before lookup", async () => {
    const repo = mockAccountRepo(makeAccount());
    const useCase = new RequestPasswordReset(
      repo,
      mockEmailSender(),
      mockTokenStore(),
      "https://x",
    );

    await useCase.execute({ email: "  USER@Example.COM  " });

    expect(repo.findByEmail).toHaveBeenCalledWith("user@example.com");
  });

  it("silently no-ops when account is not found (anti-enumeration)", async () => {
    const repo = mockAccountRepo(null);
    const email = mockEmailSender();
    const tokens = mockTokenStore();
    const useCase = new RequestPasswordReset(repo, email, tokens, "https://x");

    await expect(
      useCase.execute({ email: "ghost@example.com" }),
    ).resolves.toBeUndefined();
    expect(tokens.issue).not.toHaveBeenCalled();
    expect(email.send).not.toHaveBeenCalled();
  });

  it("silently no-ops for OAuth-only accounts (no passwordHash)", async () => {
    const repo = mockAccountRepo(makeAccount({ passwordHash: null }));
    const email = mockEmailSender();
    const tokens = mockTokenStore();
    const useCase = new RequestPasswordReset(repo, email, tokens, "https://x");

    await useCase.execute({ email: "user@example.com" });

    expect(tokens.issue).not.toHaveBeenCalled();
    expect(email.send).not.toHaveBeenCalled();
    // Still no token-storage interaction happened — request is a true no-op.
    expect(tokens.revokeAllForAccount).not.toHaveBeenCalled();
  });

  it("URL-encodes the token in the reset link (forward-safe escaping)", async () => {
    const repo = mockAccountRepo(makeAccount());
    const email = mockEmailSender();
    // Token containing characters that MUST be percent-encoded in a query param.
    const tokens = mockTokenStore("a b/c+d");
    const useCase = new RequestPasswordReset(repo, email, tokens, "https://x");

    await useCase.execute({ email: "user@example.com" });

    const html = (email.send as ReturnType<typeof vi.fn>).mock.calls[0]![0]
      .html as string;
    // Plain token must NOT appear unescaped — encodeURIComponent turns
    // " " into %20, "/" into %2F, "+" into %2B.
    expect(html).toContain("a%20b%2Fc%2Bd");
    expect(html).not.toContain("?token=a b/c+d");
  });
});
