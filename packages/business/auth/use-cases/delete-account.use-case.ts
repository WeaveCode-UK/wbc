import type { TenantMemberRepository } from "../ports/tenant-member.repository";
import type { AccountRepository } from "../ports/account.repository";
import type { JwtBlacklist } from "../ports/jwt-blacklist.port";

export interface DeleteAccountInput {
  accountId: string;
  confirmation: string;
}

export class DeleteAccount {
  constructor(
    private readonly memberRepo: TenantMemberRepository,
    private readonly accountRepo?: AccountRepository,
    /**
     * Optional JWT blacklist. After hard-deleting the account, every JWT
     * issued for it must be invalidated immediately — otherwise an attacker
     * with a stolen session can keep acting as the now-non-existent user
     * for up to the JWT max-age (ACH-008).
     */
    private readonly jwtBlacklist?: JwtBlacklist,
    private readonly revokeTtlSeconds: number = 60 * 60,
  ) {}

  async execute(input: DeleteAccountInput): Promise<void> {
    if (input.confirmation !== "DELETE") {
      throw new Error("Confirmacao invalida");
    }

    const members = await this.memberRepo.findActiveByAccountId(
      input.accountId,
    );
    for (const member of members) {
      if (member.role === "ADMIN") {
        const adminCount = await this.memberRepo.countAdminsByTenantId(
          member.tenantId,
        );
        if (adminCount <= 1) {
          throw new Error(
            "Voce e o unico ADMIN do workspace. Transfira a administracao antes de deletar a conta.",
          );
        }
      }
    }

    if (this.accountRepo) {
      await this.accountRepo.deleteWithCleanup(input.accountId);
    }

    // ACH-008: stamp the account-revocation threshold AFTER the cleanup so
    // the now-orphaned JWTs are rejected by the next jwt() callback. The
    // jti-blacklist alone wouldn't reach JWTs issued before this request,
    // and per-account mass revocation is exactly the right hammer here.
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
