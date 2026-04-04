import { prisma } from '@wbc/db';
import type {
  OAuthAccountRepository,
  CreateOAuthAccountInput,
  UpdateOAuthTokensInput,
} from '../ports/oauth-account.repository';

export class PrismaOAuthAccountRepository implements OAuthAccountRepository {
  async findByProviderAndAccountId(
    provider: string,
    providerAccountId: string,
  ): Promise<{ id: string; accountId: string } | null> {
    return prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      select: { id: true, accountId: true },
    });
  }

  async findByAccountIdAndProvider(
    accountId: string,
    provider: string,
  ): Promise<{ id: string } | null> {
    return prisma.oAuthAccount.findFirst({
      where: { accountId, provider },
      select: { id: true },
    });
  }

  async create(input: CreateOAuthAccountInput): Promise<{ id: string; accountId: string }> {
    const data = await prisma.oAuthAccount.create({ data: input });
    return { id: data.id, accountId: data.accountId };
  }

  async updateTokens(id: string, input: UpdateOAuthTokensInput): Promise<void> {
    await prisma.oAuthAccount.update({ where: { id }, data: input });
  }

  async deleteByAccountId(accountId: string): Promise<void> {
    await prisma.oAuthAccount.deleteMany({ where: { accountId } });
  }
}
