import type { SessionRepository } from "../ports/session.repository";
import type { JwtBlacklist } from "../ports/jwt-blacklist.port";

export interface RevokeAllSessionsInput {
  accountId: string;
}

/**
 * ACH-007: invalidates every active JWT for `accountId`. The Prisma Session
 * table is currently dormant (no INSERT path in this codebase), so the
 * authoritative cut-off is the JWT mass-revocation threshold in Redis. The
 * repository delete is preserved for the day a real DB session strategy
 * lands; until then it is a no-op against an empty table.
 */
export class RevokeAllSessions {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly jwtBlacklist?: JwtBlacklist,
    private readonly revokeTtlSeconds: number = 60 * 60,
  ) {}

  async execute(input: RevokeAllSessionsInput): Promise<void> {
    if (this.jwtBlacklist) {
      const nowUnix = Math.floor(Date.now() / 1000);
      await this.jwtBlacklist.revokeAllForAccount({
        accountId: input.accountId,
        revokedBeforeUnix: nowUnix,
        ttlSeconds: this.revokeTtlSeconds,
      });
    }
    await this.sessionRepo.deleteByAccountId(input.accountId);
  }
}
