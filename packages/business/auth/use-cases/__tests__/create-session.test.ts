// CreateSession — issues a new DB-backed refresh-session row
//
// Invariants:
//   - The plaintext refreshToken is returned to the caller, but ONLY a
//     SHA-256 hash is persisted.
//   - The session row uses a 30-day expiresAt.
//   - Each call yields a fresh token (randomness).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHash } from "crypto";
import { CreateSession } from "../create-session.use-case";
import type { SessionRepository } from "../../ports/session.repository";
import { Session } from "../../domain/entities/session.entity";

function mockRepo(): SessionRepository {
  return {
    findById: vi.fn(),
    findByTokenHash: vi.fn(),
    findByAccountId: vi.fn(),
    create: vi.fn().mockImplementation(async (input) => {
      return new Session({
        id: "sess-1",
        accountId: input.accountId,
        tenantId: input.tenantId ?? null,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        userAgent: input.userAgent ?? null,
        ipAddress: input.ipAddress ?? null,
        lastUsedAt: new Date(),
        createdAt: new Date(),
      });
    }),
    updateLastUsed: vi.fn(),
    delete: vi.fn(),
    deleteByAccountId: vi.fn(),
    deleteExpired: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CreateSession", () => {
  it("returns a 64-char hex refresh token", async () => {
    const useCase = new CreateSession(mockRepo());
    const out = await useCase.execute({ accountId: "acc-1" });
    expect(out.refreshToken).toMatch(/^[0-9a-f]{64}$/);
  });

  it("persists only the SHA-256 hash of the refresh token", async () => {
    const repo = mockRepo();
    const useCase = new CreateSession(repo);

    const out = await useCase.execute({ accountId: "acc-1" });

    const arg = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    const expectedHash = createHash("sha256")
      .update(out.refreshToken)
      .digest("hex");
    expect(arg.tokenHash).toBe(expectedHash);
    // Plaintext token must not be the same as what's stored.
    expect(arg.tokenHash).not.toBe(out.refreshToken);
  });

  it("uses a 30-day expiresAt", async () => {
    const repo = mockRepo();
    const useCase = new CreateSession(repo);

    const before = Date.now();
    const out = await useCase.execute({ accountId: "acc-1" });
    const after = Date.now();

    const expiry = out.expiresAt.getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    expect(expiry).toBeGreaterThanOrEqual(before + thirtyDays - 1000);
    expect(expiry).toBeLessThanOrEqual(after + thirtyDays + 1000);
  });

  it("forwards optional tenantId, userAgent, ipAddress to the repo", async () => {
    const repo = mockRepo();
    const useCase = new CreateSession(repo);

    await useCase.execute({
      accountId: "acc-1",
      tenantId: "tenant-1",
      userAgent: "Mozilla/5.0",
      ipAddress: "1.2.3.4",
    });

    const arg = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(arg.tenantId).toBe("tenant-1");
    expect(arg.userAgent).toBe("Mozilla/5.0");
    expect(arg.ipAddress).toBe("1.2.3.4");
  });

  it("issues a different token on every call (randomness)", async () => {
    const useCase = new CreateSession(mockRepo());
    const a = await useCase.execute({ accountId: "acc-1" });
    const b = await useCase.execute({ accountId: "acc-1" });
    expect(a.refreshToken).not.toBe(b.refreshToken);
  });
});
