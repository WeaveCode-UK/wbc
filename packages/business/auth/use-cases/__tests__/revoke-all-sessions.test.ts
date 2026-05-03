// RevokeAllSessions — burn every JWT for an account (ACH-007)
//
// The Prisma session table is dormant in production today, but the use-case
// is still wired so the day a real DB strategy lands, the call site does not
// change. Invariants:
//   - sessionRepo.deleteByAccountId is invoked.
//   - When jwtBlacklist is wired, mass-revocation runs with `revokedBeforeUnix=now`.
//   - The default revoke TTL is 1h (matches changePassword / resetPassword).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RevokeAllSessions } from "../revoke-all-sessions.use-case";
import type { SessionRepository } from "../../ports/session.repository";
import type { JwtBlacklist } from "../../ports/jwt-blacklist.port";

function mockSessionRepo(): SessionRepository {
  return {
    findById: vi.fn(),
    findByTokenHash: vi.fn(),
    findByAccountId: vi.fn(),
    create: vi.fn(),
    updateLastUsed: vi.fn(),
    delete: vi.fn(),
    deleteByAccountId: vi.fn().mockResolvedValue(undefined),
    deleteExpired: vi.fn(),
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

describe("RevokeAllSessions", () => {
  it("calls sessionRepo.deleteByAccountId on the target account", async () => {
    const repo = mockSessionRepo();
    const useCase = new RevokeAllSessions(repo);

    await useCase.execute({ accountId: "acc-1" });
    expect(repo.deleteByAccountId).toHaveBeenCalledWith("acc-1");
  });

  it("mass-revokes JWTs when blacklist is wired", async () => {
    const blacklist = mockBlacklist();
    const useCase = new RevokeAllSessions(mockSessionRepo(), blacklist);

    const before = Math.floor(Date.now() / 1000);
    await useCase.execute({ accountId: "acc-1" });
    const after = Math.floor(Date.now() / 1000);

    expect(blacklist.revokeAllForAccount).toHaveBeenCalledOnce();
    const args = (blacklist.revokeAllForAccount as ReturnType<typeof vi.fn>)
      .mock.calls[0]![0];
    expect(args.accountId).toBe("acc-1");
    expect(args.ttlSeconds).toBe(60 * 60);
    expect(args.revokedBeforeUnix).toBeGreaterThanOrEqual(before);
    expect(args.revokedBeforeUnix).toBeLessThanOrEqual(after);
  });

  it("works without blacklist wired (best-effort)", async () => {
    const repo = mockSessionRepo();
    const useCase = new RevokeAllSessions(repo);
    await expect(
      useCase.execute({ accountId: "acc-1" }),
    ).resolves.toBeUndefined();
    expect(repo.deleteByAccountId).toHaveBeenCalled();
  });

  it("respects a custom revokeTtlSeconds override", async () => {
    const blacklist = mockBlacklist();
    const useCase = new RevokeAllSessions(
      mockSessionRepo(),
      blacklist,
      900, // 15 min
    );
    await useCase.execute({ accountId: "acc-1" });
    const args = (blacklist.revokeAllForAccount as ReturnType<typeof vi.fn>)
      .mock.calls[0]![0];
    expect(args.ttlSeconds).toBe(900);
  });
});
