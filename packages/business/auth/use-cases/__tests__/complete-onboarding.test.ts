// CompleteOnboarding — first-workspace creation flow
//
// Invariants:
//   - Slug uniqueness is checked BEFORE membership scan (cheaper failure).
//   - An account that already owns/joined a workspace cannot onboard again
//     — we keep the account → tenant cardinality at 1 for onboarding.
//   - Account must exist; the displayName persisted on the new tenant comes
//     from the Account row, NOT from input (input has no `displayName`).
//   - Without a tenantRepo the use-case throws — composition root must wire
//     it explicitly.
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  CompleteOnboarding,
  type OnboardingPort,
} from "../complete-onboarding.use-case";
import type { TenantMemberRepository } from "../../ports/tenant-member.repository";
import type { AccountRepository } from "../../ports/account.repository";
import { Account } from "../../domain/entities/account.entity";

function makeAccount(): Account {
  return new Account({
    id: "acc-1",
    email: "user@example.com",
    name: "Real Name",
    emailVerified: new Date("2026-01-01"),
    passwordHash: "$2a$10$h",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  });
}

function mockMemberRepo(existingCount = 0): TenantMemberRepository {
  return {
    findById: vi.fn(),
    findByAccountAndTenant: vi.fn(),
    findActiveByAccountId: vi
      .fn()
      // findActiveByAccountId returns TenantMemberWithTenantInfo[] but the
      // use-case only inspects `length`, so an empty array suffices.
      .mockResolvedValue(existingCount === 0 ? [] : [{}]),
    findActiveByTenantId: vi.fn(),
    create: vi.fn(),
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

function mockTenantRepo(
  opts: {
    slugTaken?: boolean;
    result?: { tenantId: string; memberId: string };
  } = {},
): OnboardingPort {
  return {
    findBySlug: vi
      .fn()
      .mockResolvedValue(opts.slugTaken ? { id: "existing-tenant" } : null),
    onboardTenant: vi
      .fn()
      .mockResolvedValue(
        opts.result ?? { tenantId: "tenant-1", memberId: "mem-1" },
      ),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CompleteOnboarding", () => {
  it("creates the tenant + first member on the happy path", async () => {
    const tenantRepo = mockTenantRepo();
    const useCase = new CompleteOnboarding(
      mockAccountRepo(makeAccount()),
      mockMemberRepo(0),
      tenantRepo,
    );

    const out = await useCase.execute({
      accountId: "acc-1",
      tenantName: "My Studio",
      slug: "my-studio",
      phone: "+5511999999999",
    });

    expect(out).toEqual({ tenantId: "tenant-1", memberId: "mem-1" });
    expect(tenantRepo.onboardTenant).toHaveBeenCalledWith({
      tenantName: "My Studio",
      slug: "my-studio",
      accountId: "acc-1",
      // displayName comes from Account.name (NOT input) — the input shape
      // has no displayName, so this contract is load-bearing.
      displayName: "Real Name",
      phone: "+5511999999999",
      avatar: null,
    });
  });

  it("rejects when slug is already taken", async () => {
    const tenantRepo = mockTenantRepo({ slugTaken: true });
    const useCase = new CompleteOnboarding(
      mockAccountRepo(makeAccount()),
      mockMemberRepo(0),
      tenantRepo,
    );

    await expect(
      useCase.execute({
        accountId: "acc-1",
        tenantName: "x",
        slug: "taken",
        phone: "p",
      }),
    ).rejects.toThrow(/Slug ja em uso/i);
    expect(tenantRepo.onboardTenant).not.toHaveBeenCalled();
  });

  it("rejects when the account already has an active membership", async () => {
    const useCase = new CompleteOnboarding(
      mockAccountRepo(makeAccount()),
      mockMemberRepo(1),
      mockTenantRepo(),
    );

    await expect(
      useCase.execute({
        accountId: "acc-1",
        tenantName: "x",
        slug: "fresh",
        phone: "p",
      }),
    ).rejects.toThrow(/ja possui workspace/i);
  });

  it("rejects when the account row is missing", async () => {
    const useCase = new CompleteOnboarding(
      mockAccountRepo(null),
      mockMemberRepo(0),
      mockTenantRepo(),
    );

    await expect(
      useCase.execute({
        accountId: "ghost",
        tenantName: "x",
        slug: "fresh",
        phone: "p",
      }),
    ).rejects.toThrow(/nao encontrada/i);
  });

  it("forwards avatar when provided", async () => {
    const tenantRepo = mockTenantRepo();
    const useCase = new CompleteOnboarding(
      mockAccountRepo(makeAccount()),
      mockMemberRepo(0),
      tenantRepo,
    );

    await useCase.execute({
      accountId: "acc-1",
      tenantName: "x",
      slug: "fresh",
      phone: "p",
      avatar: "https://cdn/avatar.png",
    });

    const arg = (tenantRepo.onboardTenant as ReturnType<typeof vi.fn>).mock
      .calls[0]![0];
    expect(arg.avatar).toBe("https://cdn/avatar.png");
  });

  it("throws when no tenantRepo is wired (composition-root contract)", async () => {
    const useCase = new CompleteOnboarding(
      mockAccountRepo(makeAccount()),
      mockMemberRepo(0),
      // no tenantRepo
    );

    await expect(
      useCase.execute({
        accountId: "acc-1",
        tenantName: "x",
        slug: "fresh",
        phone: "p",
      }),
    ).rejects.toThrow(/TenantRepo not provided/i);
  });
});
