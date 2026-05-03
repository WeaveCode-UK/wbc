// RequestEmailVerification — issue an opaque token + send verify email
//
// Invariants:
//   - Already-verified accounts are a no-op (idempotent).
//   - Issuing the token must follow `revokeAllForAccount` so a second
//     request invalidates the previous link.
//   - The verification URL contains the token URL-encoded.
//   - Email is dispatched via EmailSender.send.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RequestEmailVerification } from "../request-email-verification.use-case";
import type { AccountRepository } from "../../ports/account.repository";
import type { EmailSender } from "../../ports/email-sender.port";
import type { AuthTokenStore } from "../../ports/auth-token-store.port";
import { Account } from "../../domain/entities/account.entity";

function makeAccount(opts: { verified?: boolean } = {}): Account {
  return new Account({
    id: "acc-1",
    email: "user@example.com",
    name: "User",
    emailVerified: opts.verified ? new Date("2026-01-01") : null,
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
    update: vi.fn(),
    delete: vi.fn(),
    deleteWithCleanup: vi.fn(),
    markLoggedIn: vi.fn(),
  };
}

function mockEmail(): EmailSender {
  return { send: vi.fn().mockResolvedValue(undefined) };
}

function mockTokenStore(token = "verify-tok"): AuthTokenStore {
  return {
    issue: vi.fn().mockResolvedValue({
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }),
    consume: vi.fn(),
    revokeAllForAccount: vi.fn().mockResolvedValue(undefined),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RequestEmailVerification", () => {
  it("issues a token and emails the verify link on the happy path", async () => {
    const repo = mockRepo(makeAccount());
    const email = mockEmail();
    const tokens = mockTokenStore("plain-tok-1");
    const useCase = new RequestEmailVerification(
      repo,
      email,
      tokens,
      "https://app.example.com",
    );

    await useCase.execute({ accountId: "acc-1" });

    expect(tokens.issue).toHaveBeenCalledWith({
      accountId: "acc-1",
      kind: "email-verification",
      ttlSeconds: 24 * 60 * 60,
    });
    const sent = (email.send as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(sent.to).toBe("user@example.com");
    expect(sent.html).toContain(
      "https://app.example.com/verify-email?token=plain-tok-1",
    );
  });

  it("revokes previous tokens BEFORE issuing the new one", async () => {
    const repo = mockRepo(makeAccount());
    const tokens = mockTokenStore();
    const order: string[] = [];
    (tokens.revokeAllForAccount as ReturnType<typeof vi.fn>).mockImplementation(
      async () => {
        order.push("revoke");
      },
    );
    (tokens.issue as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      order.push("issue");
      return { token: "t", expiresAt: new Date() };
    });

    const useCase = new RequestEmailVerification(
      repo,
      mockEmail(),
      tokens,
      "https://x",
    );
    await useCase.execute({ accountId: "acc-1" });

    expect(order).toEqual(["revoke", "issue"]);
  });

  it("rejects when account does not exist", async () => {
    const useCase = new RequestEmailVerification(
      mockRepo(null),
      mockEmail(),
      mockTokenStore(),
      "https://x",
    );
    await expect(useCase.execute({ accountId: "ghost" })).rejects.toThrow(
      /nao encontrada/i,
    );
  });

  it("no-ops when the account is already verified", async () => {
    const tokens = mockTokenStore();
    const email = mockEmail();
    const useCase = new RequestEmailVerification(
      mockRepo(makeAccount({ verified: true })),
      email,
      tokens,
      "https://x",
    );

    await useCase.execute({ accountId: "acc-1" });

    expect(tokens.issue).not.toHaveBeenCalled();
    expect(email.send).not.toHaveBeenCalled();
    expect(tokens.revokeAllForAccount).not.toHaveBeenCalled();
  });

  it("URL-encodes the token in the verify link", async () => {
    const email = mockEmail();
    const useCase = new RequestEmailVerification(
      mockRepo(makeAccount()),
      email,
      mockTokenStore("a b/c"),
      "https://x",
    );

    await useCase.execute({ accountId: "acc-1" });

    const html = (email.send as ReturnType<typeof vi.fn>).mock.calls[0]![0]
      .html as string;
    expect(html).toContain("a%20b%2Fc");
    expect(html).not.toContain("?token=a b/c");
  });
});
