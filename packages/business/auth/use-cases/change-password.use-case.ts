import type { AccountRepository } from "../ports/account.repository";
import type { PasswordHasher } from "../ports/password-hasher.port";
import type { JwtBlacklist } from "../ports/jwt-blacklist.port";

export interface ChangePasswordInput {
  accountId: string;
  currentPassword: string;
  newPassword: string;
}

export class ChangePassword {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly passwordHasher: PasswordHasher,
    /**
     * Optional JWT blacklist used to mass-invalidate every JWT issued for the
     * account at or before the moment the password was rotated. Without it,
     * pre-existing sessions stay valid until natural expiry — see ACH-005.
     */
    private readonly jwtBlacklist?: JwtBlacklist,
    /**
     * Mass-revocation TTL. Defaults to one hour, which exceeds the current
     * NextAuth `maxAge` of 15 min and gives a wide safety margin even if the
     * session window is bumped later. Caller can override.
     */
    private readonly revokeTtlSeconds: number = 60 * 60,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const account = await this.accountRepo.findById(input.accountId);
    if (!account) throw new Error("Account nao encontrada");
    if (!account.hasPassword())
      throw new Error("Esta conta usa Login com Google");

    const isValid = await this.passwordHasher.verify(
      input.currentPassword,
      account.passwordHash!,
    );
    if (!isValid) throw new Error("Senha atual incorreta");

    const newHash = await this.passwordHasher.hash(input.newPassword);
    await this.accountRepo.update(input.accountId, { passwordHash: newHash });

    // ACH-005: invalidate every JWT issued at or before this exact second.
    // The JWT callback in `apps/web/src/lib/auth.config.ts` compares
    // `token.iat` against `getAccountRevokedBefore(accountId)` and refuses
    // any token whose iat falls inside the revoked window.
    if (this.jwtBlacklist) {
      const nowUnix = Math.floor(Date.now() / 1000);
      await this.jwtBlacklist.revokeAllForAccount({
        accountId: input.accountId,
        revokedBeforeUnix: nowUnix,
        ttlSeconds: this.revokeTtlSeconds,
      });
    }
  }
}
