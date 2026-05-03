// CancelInvite — admin-side rescind of a pending invite
//
// Invariants:
//   - Cross-tenant cancel attempts are rejected (tenant scoping).
//   - Already accepted/cancelled invites cannot be cancelled again.
//   - On success the invite is moved to CANCELLED status.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CancelInvite } from "../cancel-invite.use-case";
import type {
  InviteRepository,
  InviteData,
} from "../../ports/invite.repository";

function makeInvite(overrides: Partial<InviteData> = {}): InviteData {
  return {
    id: "inv-1",
    tenantId: "tenant-1",
    email: "user@example.com",
    role: "CONSULTANT",
    invitedBy: "admin",
    token: "tok",
    status: "PENDING",
    expiresAt: new Date(Date.now() + 60_000),
    acceptedAt: null,
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function mockRepo(invite: InviteData | null): InviteRepository {
  return {
    findById: vi.fn().mockResolvedValue(invite),
    findByToken: vi.fn(),
    findByTenantId: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn().mockResolvedValue(undefined),
    expirePending: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CancelInvite", () => {
  it("flips a pending invite to CANCELLED", async () => {
    const repo = mockRepo(makeInvite());
    const useCase = new CancelInvite(repo);

    await useCase.execute({ inviteId: "inv-1", tenantId: "tenant-1" });

    expect(repo.updateStatus).toHaveBeenCalledWith("inv-1", "CANCELLED");
  });

  it("rejects when the invite does not exist", async () => {
    const useCase = new CancelInvite(mockRepo(null));
    await expect(
      useCase.execute({ inviteId: "x", tenantId: "tenant-1" }),
    ).rejects.toThrow(/nao encontrado/i);
  });

  it("rejects cross-tenant cancel (tenant scoping)", async () => {
    const repo = mockRepo(makeInvite({ tenantId: "tenant-other" }));
    const useCase = new CancelInvite(repo);

    await expect(
      useCase.execute({ inviteId: "inv-1", tenantId: "tenant-1" }),
    ).rejects.toThrow(/nao pertence/i);
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it("rejects when the invite is already accepted", async () => {
    const repo = mockRepo(makeInvite({ status: "ACCEPTED" }));
    const useCase = new CancelInvite(repo);

    await expect(
      useCase.execute({ inviteId: "inv-1", tenantId: "tenant-1" }),
    ).rejects.toThrow(/pendente/i);
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });

  it("rejects an already-cancelled invite", async () => {
    const repo = mockRepo(makeInvite({ status: "CANCELLED" }));
    const useCase = new CancelInvite(repo);

    await expect(
      useCase.execute({ inviteId: "inv-1", tenantId: "tenant-1" }),
    ).rejects.toThrow(/pendente/i);
  });
});
