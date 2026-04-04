export interface CreateOAuthAccountInput {
  accountId: string;
  provider: string;
  providerAccountId: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: number | null;
  tokenType?: string | null;
  scope?: string | null;
  idToken?: string | null;
}

export interface UpdateOAuthTokensInput {
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: number | null;
}

export interface OAuthAccountRepository {
  findByProviderAndAccountId(provider: string, providerAccountId: string): Promise<{ id: string; accountId: string } | null>;
  findByAccountIdAndProvider(accountId: string, provider: string): Promise<{ id: string } | null>;
  create(input: CreateOAuthAccountInput): Promise<{ id: string; accountId: string }>;
  updateTokens(id: string, input: UpdateOAuthTokensInput): Promise<void>;
  deleteByAccountId(accountId: string): Promise<void>;
}
