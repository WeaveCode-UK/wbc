// LeaveTenant — soft-delete the caller's membership in a tenant
//
// Invariants:
//   - Confirmation must be the literal string "LEAVE".
//   - Caller must have an active membership in the target tenant.
//   - The sole-admin check mirrors DeleteAccount: an ADMIN with adminCount<=1
//     cannot leave (would orphan the tenant).
//   - On success: deletedAt is stamped + isActive=false.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LeaveTenant } from "../leave-tenant.use-case";
import type { TenantMemberRepository } from "../../ports/tenant-member.repository";
import {
  TenantMember,
  type Role,
} from "../../domain/entities/tenant-member.entity";

function makeMember(
  opts: { role?: Role; isActive?: boolean } = {},
): TenantMember {
  return new TenantMember({
    id: "mem-1",
    accountId: "acc-1",
    tenantId: "tenant-1",
    role: opts.role ?? "CONSULTANT",
    phone: null,
    displayName: null,
    avatar: null,
    isActive: opts.isActive ?? true,
    deletedAt: null,
    joinedAt: new Date(),
    updatedAt: new Date(),
  });
}

function mockRepo(
  opts: {
    member?: TenantMember | null;
    adminCount?: number;
  } = {},
): TenantMemberRepository {
  // `??` would coalesce explicit-null callers back to a default member —
  // use `in` so a deliberate null reaches the use-case unchanged.
  const member = "member" in opts ? opts.member! : makeMember();
  return {
    findById: vi.fn(),
    findByAccountAndTenant: vi.fn().mockResolvedValue(member),
    findActiveByAccountId: vi.fn(),
    findActiveByTenantId: vi.fn(),
    create: vi.fn(),
    update: vi.fn().mockResolvedValue(makeMember()),
    countAdminsByTenantId: vi.fn().mockResolvedValue(opts.adminCount ?? 2),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LeaveTenant", () => {
  it("soft-deletes the membership on a valid LEAVE confirmation", async () => {
    const repo = mockRepo();
    const useCase = new LeaveTenant(repo);

    await useCase.execute({
      accountId: "acc-1",
      tenantId: "tenant-1",
      confirmation: "LEAVE",
    });

    expect(repo.update).toHaveBeenCalledWith(
      "mem-1",
      expect.objectContaining({ isActive: false }),
    );
    const arg = (repo.update as ReturnType<typeof vi.fn>).mock.calls[0]![1];
    expect(arg.deletedAt).toBeInstanceOf(Date);
  });

  it("rejects when confirmation string is wrong", async () => {
    const useCase = new LeaveTenant(mockRepo());
    await expect(
      useCase.execute({
        accountId: "acc-1",
        tenantId: "tenant-1",
        confirmation: "leave",
      }),
    ).rejects.toThrow(/Confirmacao/i);
  });

  it("rejects when caller is not a member of the tenant", async () => {
    const useCase = new LeaveTenant(mockRepo({ member: null }));
    await expect(
      useCase.execute({
        accountId: "acc-1",
        tenantId: "tenant-1",
        confirmation: "LEAVE",
      }),
    ).rejects.toThrow(/nao e membro/i);
  });

  it("rejects when membership is inactive (already left)", async () => {
    const useCase = new LeaveTenant(
      mockRepo({ member: makeMember({ isActive: false }) }),
    );
    await expect(
      useCase.execute({
        accountId: "acc-1",
        tenantId: "tenant-1",
        confirmation: "LEAVE",
      }),
    ).rejects.toThrow(/nao e membro/i);
  });

  it("blocks the sole ADMIN from leaving", async () => {
    const repo = mockRepo({
      member: makeMember({ role: "ADMIN" }),
      adminCount: 1,
    });
    const useCase = new LeaveTenant(repo);
    await expect(
      useCase.execute({
        accountId: "acc-1",
        tenantId: "tenant-1",
        confirmation: "LEAVE",
      }),
    ).rejects.toThrow(/unico ADMIN/i);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("allows ADMIN to leave when other admins exist", async () => {
    const repo = mockRepo({
      member: makeMember({ role: "ADMIN" }),
      adminCount: 2,
    });
    const useCase = new LeaveTenant(repo);
    await useCase.execute({
      accountId: "acc-1",
      tenantId: "tenant-1",
      confirmation: "LEAVE",
    });
    expect(repo.update).toHaveBeenCalled();
  });
});
