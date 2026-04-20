import type { RedisLike } from "@wbc/shared";
import type { JwtBlacklist } from "../ports/jwt-blacklist.port";

const PREFIX = "auth:jwt-blacklist";

function keyFor(jti: string): string {
  return `${PREFIX}:${jti}`;
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
}
