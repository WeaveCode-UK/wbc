// RefreshSession — exchange a refresh token for a sliding 30-day session
//
// Invariants:
//   - The plaintext refreshToken is hashed (SHA-256) before lookup —
//     it is NEVER passed to the repo as-is.
//   - Missing token → "Session not found".
//   - Expired session is auto-deleted before throwing (cleanup).
//   - Valid session is extended (sliding window) by 30 days.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHash } from "crypto";
import { RefreshSession } from "../refresh-session.use-case";
import type { SessionRepository } from "../../ports/session.repository";
import { Session } from "../../domain/entities/session.entity";

function makeSession(opts: { expired?: boolean } = {}): Session {
  const expiresAt = opts.expired
    ? new Date(Date.now() - 60_000)
    : new Date(Date.now() + 60 * 60 * 1000);
  return new Session({
    id: "sess-1",
    accountId: "acc-1",
    tenantId: "tenant-1",
    tokenHash: "abc",
    expiresAt,
    userAgent: null,
    ipAddress: null,
    lastUsedAt: new Date(),
    createdAt: new Date(),
  });
}

function mockRepo(session: Session | null): SessionRepository {
  return {
    findById: vi.fn(),
    findByTokenHash: vi.fn().mockResolvedValue(session),
    findByAccountId: vi.fn(),
    create: vi.fn(),
    updateLastUsed: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    deleteByAccountId: vi.fn(),
    deleteExpired: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RefreshSession", () => {
  it("hashes the refresh token before looking it up (never passes plaintext)", async () => {
    const repo = mockRepo(makeSession());
    const useCase = new RefreshSession(repo);

    await useCase.execute({ refreshToken: "plain-rt" });

    const expected = createHash("sha256").update("plain-rt").digest("hex");
    expect(repo.findByTokenHash).toHaveBeenCalledWith(expected);
  });

  it("extends the session by 30 days on a valid refresh", async () => {
    const repo = mockRepo(makeSession());
    const useCase = new RefreshSession(repo);

    const before = Date.now();
    const out = await useCase.execute({ refreshToken: "rt" });
    const after = Date.now();

    expect(out.sessionId).toBe("sess-1");
    expect(out.accountId).toBe("acc-1");
    expect(out.tenantId).toBe("tenant-1");

    const thirty = 30 * 24 * 60 * 60 * 1000;
    expect(out.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before + thirty - 1000,
    );
    expect(out.expiresAt.getTime()).toBeLessThanOrEqual(after + thirty + 1000);

    expect(repo.updateLastUsed).toHaveBeenCalledWith(
      "sess-1",
      expect.any(Date),
    );
  });

  it("rejects when no session matches the token hash", async () => {
    const useCase = new RefreshSession(mockRepo(null));
    await expect(useCase.execute({ refreshToken: "ghost" })).rejects.toThrow(
      /Session not found/,
    );
  });

  it("auto-deletes the row when the session is expired", async () => {
    const repo = mockRepo(makeSession({ expired: true }));
    const useCase = new RefreshSession(repo);

    await expect(useCase.execute({ refreshToken: "rt" })).rejects.toThrow(
      /Session expired/,
    );
    expect(repo.delete).toHaveBeenCalledWith("sess-1");
    // Sliding window must NOT have been applied to an expired session.
    expect(repo.updateLastUsed).not.toHaveBeenCalled();
  });
});
