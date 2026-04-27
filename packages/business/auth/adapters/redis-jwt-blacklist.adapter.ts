import type { RedisLike } from "@wbc/shared";
import type { JwtBlacklist } from "../ports/jwt-blacklist.port";

const PREFIX = "auth:jwt-blacklist";
const ACCOUNT_PREFIX = "auth:account-revoked-before";

function keyFor(jti: string): string {
  return `${PREFIX}:${jti}`;
}

function accountKeyFor(accountId: string): string {
  return `${ACCOUNT_PREFIX}:${accountId}`;
}

export class RedisJwtBlacklist implements JwtBlacklist {
  constructor(private readonly redis: RedisLike) {}

  async revoke(input: { jti: string; ttlSeconds: number }): Promise<void> {
    // Clamp to at least 1 second; anything shorter is effectively a no-op.
    const ttl = Math.max(1, Math.ceil(input.ttlSeconds));
    await this.redis.set(keyFor(input.jti), "1", "EX", ttl);
  }

  async isRevoked(jti: string): Promise<boolean> {
    const raw = await this.redis.get(keyFor(jti));
    return raw !== null;
  }

  async revokeAllForAccount(input: {
    accountId: string;
    revokedBeforeUnix: number;
    ttlSeconds: number;
  }): Promise<void> {
    const ttl = Math.max(1, Math.ceil(input.ttlSeconds));
    await this.redis.set(
      accountKeyFor(input.accountId),
      String(input.revokedBeforeUnix),
      "EX",
      ttl,
    );
  }

  async getAccountRevokedBefore(accountId: string): Promise<number | null> {
    const raw = await this.redis.get(accountKeyFor(accountId));
    if (raw === null) return null;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  }
}
