import type { RedisLike } from "@wbc/shared";
import type { JwtBlacklist } from "../ports/jwt-blacklist.port";

const PREFIX = "auth:jwt-blacklist";
const ACCOUNT_PREFIX = "auth:account-revoked-before";
const TENANT_PREFIX = "auth:tenant-revoked-before";
const GLOBAL_KEY = "auth:global-revoked-before";

function keyFor(jti: string): string {
  return `${PREFIX}:${jti}`;
}

function accountKeyFor(accountId: string): string {
  return `${ACCOUNT_PREFIX}:${accountId}`;
}

function tenantKeyFor(tenantId: string): string {
  return `${TENANT_PREFIX}:${tenantId}`;
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

  async revokeAllForTenant(input: {
    tenantId: string;
    revokedBeforeUnix: number;
    ttlSeconds: number;
  }): Promise<void> {
    const ttl = Math.max(1, Math.ceil(input.ttlSeconds));
    await this.redis.set(
      tenantKeyFor(input.tenantId),
      String(input.revokedBeforeUnix),
      "EX",
      ttl,
    );
  }

  async getTenantRevokedBefore(tenantId: string): Promise<number | null> {
    const raw = await this.redis.get(tenantKeyFor(tenantId));
    if (raw === null) return null;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  }

  async revokeAllGlobal(input: {
    revokedBeforeUnix: number;
    ttlSeconds: number;
  }): Promise<void> {
    const ttl = Math.max(1, Math.ceil(input.ttlSeconds));
    await this.redis.set(
      GLOBAL_KEY,
      String(input.revokedBeforeUnix),
      "EX",
      ttl,
    );
  }

  async getGlobalRevokedBefore(): Promise<number | null> {
    const raw = await this.redis.get(GLOBAL_KEY);
    if (raw === null) return null;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  }
}
