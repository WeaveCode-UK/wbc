import type { TenantMemberRepository } from '../ports/tenant-member.repository';
import type { AccountRepository } from '../ports/account.repository';

export interface OnboardingPort {
  findBySlug(slug: string): Promise<{ id: string } | null>;
  onboardTenant(input: {
    tenantName: string;
    slug: string;
    accountId: string;
    displayName: string;
    phone: string;
    avatar?: string | null;
  }): Promise<{ tenantId: string; memberId: string }>;
}

export interface CompleteOnboardingInput {
  accountId: string;
  tenantName: string;
  slug: string;
  phone: string;
  brandId?: string;
  avatar?: string;
}

export interface CompleteOnboardingOutput {
  tenantId: string;
  memberId: string;
}

export class CompleteOnboarding {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly memberRepo: TenantMemberRepository,
    private readonly tenantRepo?: OnboardingPort,
  ) {}

  async execute(input: CompleteOnboardingInput): Promise<CompleteOnboardingOutput> {
    if (this.tenantRepo) {
      const existing = await this.tenantRepo.findBySlug(input.slug);
      if (existing) throw new Error('Slug ja em uso');
    }

    const existingMembers = await this.memberRepo.findActiveByAccountId(input.accountId);
    if (existingMembers.length > 0) throw new Error('Account ja possui workspace');

    const account = await this.accountRepo.findById(input.accountId);
    if (!account) throw new Error('Account nao encontrada');

    if (!this.tenantRepo) throw new Error('TenantRepo not provided');

    return this.tenantRepo.onboardTenant({
      tenantName: input.tenantName,
      slug: input.slug,
      accountId: input.accountId,
      displayName: account.name,
      phone: input.phone,
      avatar: input.avatar ?? null,
    });
  }
}
