import { prisma } from '@wbc/db';
import type { TenantMemberRepository } from '../ports/tenant-member.repository';
import type { AccountRepository } from '../ports/account.repository';

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
  ) {}

  async execute(input: CompleteOnboardingInput): Promise<CompleteOnboardingOutput> {
    // Verificar que o slug e unico
    const existingTenant = await prisma.tenant.findUnique({ where: { slug: input.slug } });
    if (existingTenant) {
      throw new Error('Slug ja em uso');
    }

    // Verificar que a Account nao tem tenant ainda
    const existingMembers = await this.memberRepo.findActiveByAccountId(input.accountId);
    if (existingMembers.length > 0) {
      throw new Error('Account ja possui workspace');
    }

    const account = await this.accountRepo.findById(input.accountId);
    if (!account) {
      throw new Error('Account nao encontrada');
    }

    // Tudo numa transacao
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cria Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: input.tenantName,
          slug: input.slug,
          timezone: 'America/Sao_Paulo',
          locale: 'pt-BR',
          currency: 'BRL',
          isActive: true,
        },
      });

      // 2. Cria Subscription trial ESSENTIAL
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          plan: 'ESSENTIAL',
          status: 'TRIAL',
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 dias
        },
      });

      // 3. Cria TenantMember
      const member = await tx.tenantMember.create({
        data: {
          accountId: input.accountId,
          tenantId: tenant.id,
          role: 'ADMIN',
          phone: input.phone,
          displayName: account.name,
          avatar: input.avatar ?? null,
        },
      });

      return { tenantId: tenant.id, memberId: member.id };
    });

    return result;
  }
}
