import type { AccountRepository } from '../ports/account.repository';
import type { OAuthAccountRepository } from '../ports/oauth-account.repository';
import type { Account } from '../domain/entities/account.entity';

export interface AuthenticateWithOAuthInput {
  email: string;
  name: string;
  provider: string;
  providerAccountId: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: number | null;
  tokenType?: string | null;
  scope?: string | null;
  idToken?: string | null;
}

export class AuthenticateWithOAuth {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly oauthRepo: OAuthAccountRepository,
  ) {}

  async execute(input: AuthenticateWithOAuthInput): Promise<Account> {
    let account = await this.accountRepo.findByEmail(input.email.trim().toLowerCase());

    if (!account) {
      account = await this.accountRepo.create({
        email: input.email.trim().toLowerCase(),
        name: input.name,
        emailVerified: new Date(),
      });
    }

    const existingOAuth = await this.oauthRepo.findByAccountIdAndProvider(
      account.id,
      input.provider,
    );

    if (!existingOAuth) {
      await this.oauthRepo.create({
        accountId: account.id,
        provider: input.provider,
        providerAccountId: input.providerAccountId,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        expiresAt: input.expiresAt,
        tokenType: input.tokenType,
        scope: input.scope,
        idToken: input.idToken,
      });
    } else {
      await this.oauthRepo.updateTokens(existingOAuth.id, {
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        expiresAt: input.expiresAt,
      });
    }

    return account;
  }
}
