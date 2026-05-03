// AcceptInvite use-case
//
// Invariants:
//   - Token must resolve to a real invite, status PENDING, not expired.
//   - Expired invite is auto-flipped to EXPIRED before throwing — no
//     accidental membership created on the next call.
//   - Account email must match invite email (otherwise a stolen link can be
//     used by anyone logged in).
//   - Existing active membership in the same tenant blocks re-accept.
//   - On success: TenantMember is created with the invite's role/tenantId
//     and the invite is marked ACCEPTED with `acceptedAt`.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AcceptInvite } from "../accept-invite.use-case";
import type {
  InviteRepository,
  InviteData,
} from "../../ports/invite.repository";
import type { TenantMemberRepository } from "../../ports/tenant-member.repository";
import type { AccountRepository } from "../../ports/account.repository";
import { Account } from "../../domain/entities/account.entity";
import { TenantMember } from "../../domain/entities/tenant-member.entity";

function makeInvite(overrides: Partial<InviteData> = {}): InviteData {
  return {
    id: "inv-1",
    tenantId: "tenant-1",
    email: "user@example.com",
    role: "CONSULTANT",
    invitedBy: "admin-acc",
    token: "tok-abc",
    status: "PENDING",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    acceptedAt: null,
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function makeAccount(email = "user@example.com"): Account {
  return new Account({
    id: "acc-1",
    email,
    name: "User",
    emailVerified: new Date("2026-01-01"),
    passwordHash: "$2a$10$hash",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  });
}

function makeMember(
  overrides: { isActive?: boolean; tenantId?: string } = {},
): TenantMember {
  return new TenantMember({
    id: "mem-1",
    accountId: "acc-1",
    tenantId: overrides.tenantId ?? "tenant-1",
    role: "CONSULTANT",
    phone: null,
    displayName: null,
    avatar: null,
    isActive: overrides.isActive ?? true,
    deletedAt: null,
    joinedAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  });
}

function mockInviteRepo(invite: InviteData | null): InviteRepository {
  return {
    findById: vi.fn(),
    findByToken: vi.fn().mockResolvedValue(invite),
    findByTenantId: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn().mockResolvedValue(undefined),
    expirePending: vi.fn(),
  };
}

function mockMemberRepo(
  opts: {
    existing?: TenantMember | null;
    created?: TenantMember;
  } = {},
): TenantMemberRepository {
  return {
    findById: vi.fn(),
    findByAccountAndTenant: vi.fn().mockResolvedValue(opts.existing ?? null),
    findActiveByAccountId: vi.fn(),
    findActiveByTenantId: vi.fn(),
    create: vi.fn().mockResolvedValue(opts.created ?? makeMember()),
    update: vi.fn(),
    countAdminsByTenantId: vi.fn(),
  };
}

function mockAccountRepo(account: Account | null): AccountRepository {
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

describe("AcceptInvite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates membership and stamps invite ACCEPTED on a valid invite", async () => {
    const invite = makeInvite();
    const inviteRepo = mockInviteRepo(invite);
    const memberRepo = mockMemberRepo();
    const accountRepo = mockAccountRepo(makeAccount());
    const useCase = new AcceptInvite(inviteRepo, memberRepo, accountRepo);

    const result = await useCase.execute({
      inviteToken: "tok-abc",
      accountId: "acc-1",
      displayName: "Display",
      phone: "+5511999999999",
    });

    expect(result.tenantId).toBe("tenant-1");
    expect(memberRepo.create).toHaveBeenCalledWith({
      accountId: "acc-1",
      tenantId: "tenant-1",
      role: "CONSULTANT",
      phone: "+5511999999999",
      displayName: "Display",
    });
    expect(inviteRepo.updateStatus).toHaveBeenCalledWith(
      "inv-1",
      "ACCEPTED",
      expect.any(Date),
    );
  });

  it("rejects when the invite token does not exist", async () => {
    const useCase = new AcceptInvite(
      mockInviteRepo(null),
      mockMemberRepo(),
      mockAccountRepo(makeAccount()),
    );

    await expect(
      useCase.execute({
        inviteToken: "ghost",
        accountId: "acc-1",
        displayName: "x",
        phone: "x",
      }),
    ).rejects.toThrow(/nao encontrado/i);
  });

  it("rejects an invite already accepted/cancelled", async () => {
    const inviteRepo = mockInviteRepo(makeInvite({ status: "ACCEPTED" }));
    const useCase = new AcceptInvite(
      inviteRepo,
      mockMemberRepo(),
      mockAccountRepo(makeAccount()),
    );

    await expect(
      useCase.execute({
        inviteToken: "t",
        accountId: "acc-1",
        displayName: "x",
        phone: "x",
      }),
    ).rejects.toThrow(/pendente/i);
  });

  it("flips status to EXPIRED before throwing on a past expiresAt", async () => {
    const expired = makeInvite({
      expiresAt: new Date(Date.now() - 60 * 1000),
    });
    const inviteRepo = mockInviteRepo(expired);
    const useCase = new AcceptInvite(
      inviteRepo,
      mockMemberRepo(),
      mockAccountRepo(makeAccount()),
    );

    await expect(
      useCase.execute({
        inviteToken: "t",
        accountId: "acc-1",
        displayName: "x",
        phone: "x",
      }),
    ).rejects.toThrow(/expirado/i);

    // The auto-flip is what stops the same expired token from being re-tried.
    expect(inviteRepo.updateStatus).toHaveBeenCalledWith("inv-1", "EXPIRED");
  });

  it("rejects when the logged-in account email does not match the invite email", async () => {
    const inviteRepo = mockInviteRepo(makeInvite({ email: "other@x.com" }));
    const useCase = new AcceptInvite(
      inviteRepo,
      mockMemberRepo(),
      mockAccountRepo(makeAccount("user@example.com")),
    );

    await expect(
      useCase.execute({
        inviteToken: "t",
        accountId: "acc-1",
        displayName: "x",
        phone: "x",
      }),
    ).rejects.toThrow(/Email do convite/i);
  });

  it("rejects when account lookup returns null", async () => {
    const useCase = new AcceptInvite(
      mockInviteRepo(makeInvite()),
      mockMemberRepo(),
      mockAccountRepo(null),
    );

    await expect(
      useCase.execute({
        inviteToken: "t",
        accountId: "acc-1",
        displayName: "x",
        phone: "x",
      }),
    ).rejects.toThrow(/Account/i);
  });

  it("rejects when account already has an active membership in the tenant", async () => {
    const useCase = new AcceptInvite(
      mockInviteRepo(makeInvite()),
      mockMemberRepo({ existing: makeMember({ isActive: true }) }),
      mockAccountRepo(makeAccount()),
    );

    await expect(
      useCase.execute({
        inviteToken: "t",
        accountId: "acc-1",
        displayName: "x",
        phone: "x",
      }),
    ).rejects.toThrow(/ja e membro/i);
  });

  it("allows re-accept when the prior membership is inactive (rejoin)", async () => {
    const memberRepo = mockMemberRepo({
      existing: makeMember({ isActive: false }),
    });
    const useCase = new AcceptInvite(
      mockInviteRepo(makeInvite()),
      memberRepo,
      mockAccountRepo(makeAccount()),
    );

    await expect(
      useCase.execute({
        inviteToken: "t",
        accountId: "acc-1",
        displayName: "x",
        phone: "x",
      }),
    ).resolves.toEqual({ memberId: "mem-1", tenantId: "tenant-1" });
    expect(memberRepo.create).toHaveBeenCalledOnce();
  });
});
