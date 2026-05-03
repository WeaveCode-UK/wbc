// RevokeSession — single-session delete with ownership check
//
// Invariants:
//   - Missing session → "Session not found".
//   - Cross-account delete attempts → "Unauthorized" (no info leak).
//   - On success: session is deleted by id.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RevokeSession } from "../revoke-session.use-case";
import type { SessionRepository } from "../../ports/session.repository";
import { Session } from "../../domain/entities/session.entity";

function makeSession(accountId = "acc-1"): Session {
  return new Session({
    id: "sess-1",
    accountId,
    tenantId: null,
    tokenHash: "h",
    expiresAt: new Date(Date.now() + 60_000),
    userAgent: null,
    ipAddress: null,
    lastUsedAt: new Date(),
    createdAt: new Date(),
  });
}

function mockRepo(session: Session | null): SessionRepository {
  return {
    findById: vi.fn().mockResolvedValue(session),
    findByTokenHash: vi.fn(),
    findByAccountId: vi.fn(),
    create: vi.fn(),
    updateLastUsed: vi.fn(),
    delete: vi.fn().mockResolvedValue(undefined),
    deleteByAccountId: vi.fn(),
    deleteExpired: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RevokeSession", () => {
  it("deletes the session when caller owns it", async () => {
    const repo = mockRepo(makeSession("acc-1"));
    const useCase = new RevokeSession(repo);

    await useCase.execute({ sessionId: "sess-1", accountId: "acc-1" });
    expect(repo.delete).toHaveBeenCalledWith("sess-1");
  });

  it("rejects when session is not found", async () => {
    const useCase = new RevokeSession(mockRepo(null));
    await expect(
      useCase.execute({ sessionId: "ghost", accountId: "acc-1" }),
    ).rejects.toThrow(/Session not found/);
  });

  it("rejects cross-account delete (Unauthorized)", async () => {
    const repo = mockRepo(makeSession("acc-other"));
    const useCase = new RevokeSession(repo);

    await expect(
      useCase.execute({ sessionId: "sess-1", accountId: "acc-1" }),
    ).rejects.toThrow(/Unauthorized/);
    expect(repo.delete).not.toHaveBeenCalled();
  });
});
