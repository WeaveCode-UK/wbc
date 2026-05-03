// DeleteAccount — hard-delete with adminship + JWT-revocation guards
//
// Invariants:
//   - Confirmation must be the literal string "DELETE" (typo-proof).
//   - If the user is the SOLE admin of any tenant, deletion is blocked.
//   - On success, accountRepo.deleteWithCleanup runs BEFORE JwtBlacklist
//     mass-revocation (otherwise a stolen JWT could outrace the wipe).
//   - JwtBlacklist (when wired) mass-revokes all account JWTs at/before now.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteAccount } from "../delete-account.use-case";
import type { TenantMemberRepository } from "../../ports/tenant-member.repository";
import type { AccountRepository } from "../../ports/account.repository";
import type { JwtBlacklist } from "../../ports/jwt-blacklist.port";
import {
  TenantMember,
  type Role,
} from "../../domain/entities/tenant-member.entity";

function makeMember(
  opts: { role?: Role; tenantId?: string } = {},
): TenantMember {
  return new TenantMember({
    id: "mem-1",
    accountId: "acc-1",
    tenantId: opts.tenantId ?? "tenant-1",
    role: opts.role ?? "CONSULTANT",
    phone: null,
    displayName: null,
    avatar: null,
    isActive: true,
    deletedAt: null,
    joinedAt: new Date(),
    updatedAt: new Date(),
  });
}

// findActiveByAccountId returns TenantMemberWithTenantInfo[]; the use-case
// only reads role + tenantId, so a thinly-typed stand-in works.
function asTenantInfo(m: TenantMember): unknown {
  return Object.assign(m, {
    tenantName: "T",
    tenantSlug: "t",
    plan: "ESSENTIAL",
    subscriptionStatus: "ACTIVE",
  });
}

function mockMemberRepo(
  opts: {
    members?: TenantMember[];
    adminCount?: number;
  } = {},
): TenantMemberRepository {
  const members = opts.members ?? [];
  return {
    findById: vi.fn(),
    findByAccountAndTenant: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findActiveByAccountId: vi
      .fn()
      .mockResolvedValue(members.map(asTenantInfo) as any),
    findActiveByTenantId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    countAdminsByTenantId: vi.fn().mockResolvedValue(opts.adminCount ?? 1),
  };
}

function mockAccountRepo(): AccountRepository {
  return {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteWithCleanup: vi.fn().mockResolvedValue(undefined),
    markLoggedIn: vi.fn(),
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

describe("DeleteAccount", () => {
  it("rejects when confirmation string is wrong", async () => {
    const useCase = new DeleteAccount(mockMemberRepo());
    await expect(
      useCase.execute({ accountId: "acc-1", confirmation: "delete" }),
    ).rejects.toThrow(/Confirmacao/i);
  });

  it("deletes a non-admin account on confirmation=DELETE", async () => {
    const memberRepo = mockMemberRepo({ members: [makeMember()] });
    const accountRepo = mockAccountRepo();
    const useCase = new DeleteAccount(memberRepo, accountRepo);

    await useCase.execute({ accountId: "acc-1", confirmation: "DELETE" });

    expect(accountRepo.deleteWithCleanup).toHaveBeenCalledWith("acc-1");
  });

  it("blocks deletion when user is the SOLE admin of a tenant", async () => {
    const memberRepo = mockMemberRepo({
      members: [makeMember({ role: "ADMIN" })],
      adminCount: 1,
    });
    const accountRepo = mockAccountRepo();
    const useCase = new DeleteAccount(memberRepo, accountRepo);

    await expect(
      useCase.execute({ accountId: "acc-1", confirmation: "DELETE" }),
    ).rejects.toThrow(/unico ADMIN/i);
    expect(accountRepo.deleteWithCleanup).not.toHaveBeenCalled();
  });

  it("allows deletion when there are other admins in the tenant", async () => {
    const memberRepo = mockMemberRepo({
      members: [makeMember({ role: "ADMIN" })],
      adminCount: 2,
    });
    const accountRepo = mockAccountRepo();
    const useCase = new DeleteAccount(memberRepo, accountRepo);

    await useCase.execute({ accountId: "acc-1", confirmation: "DELETE" });
    expect(accountRepo.deleteWithCleanup).toHaveBeenCalled();
  });

  it("mass-revokes JWTs after deletion completes (ACH-008)", async () => {
    const memberRepo = mockMemberRepo();
    const accountRepo = mockAccountRepo();
    const blacklist = mockBlacklist();
    const useCase = new DeleteAccount(memberRepo, accountRepo, blacklist);

    const calls: string[] = [];
    (
      accountRepo.deleteWithCleanup as ReturnType<typeof vi.fn>
    ).mockImplementation(async () => {
      calls.push("delete");
    });
    (
      blacklist.revokeAllForAccount as ReturnType<typeof vi.fn>
    ).mockImplementation(async () => {
      calls.push("revoke");
    });

    await useCase.execute({ accountId: "acc-1", confirmation: "DELETE" });

    // delete-then-revoke order matters: the revoke threshold must be set
    // AFTER the cleanup so any in-flight write can't race past it.
    expect(calls).toEqual(["delete", "revoke"]);
  });

  it("works without an accountRepo wired (legacy/no-op delete path)", async () => {
    const useCase = new DeleteAccount(mockMemberRepo());
    await expect(
      useCase.execute({ accountId: "acc-1", confirmation: "DELETE" }),
    ).resolves.toBeUndefined();
  });
});
