import { createHash } from "crypto";
import type { RedisLike } from "@wbc/shared";
import type { LoginAttemptTracker } from "../ports/login-attempt-tracker.port";

export interface LoginLockoutPolicy {
  /** Window for counting failures (default 15 min). */
  windowSeconds: number;
  /** Max failures before account is considered locked (default 5). */
  maxFailures: number;
}

export const DEFAULT_LOCKOUT_POLICY: LoginLockoutPolicy = {
  windowSeconds: 15 * 60,
  maxFailures: 5,
};

const PREFIX = "auth:login-attempts";

function keyFor(identifier: string): string {
  // Hash the identifier so emails / IPs never sit in plain text in Redis.
  const hash = createHash("sha256")
    .update(identifier)
    .digest("hex")
    .slice(0, 32);
  return `${PREFIX}:${hash}`;
}

export class RedisLoginAttemptTracker implements LoginAttemptTracker {
  constructor(
    private readonly redis: RedisLike,
    private readonly policy: LoginLockoutPolicy = DEFAULT_LOCKOUT_POLICY,
  ) {}

  async recordFailure(identifier: string): Promise<number> {
    const key = keyFor(identifier);
    const current = await (
      this.redis as unknown as { incr(k: string): Promise<number> }
    ).incr(key);
    if (current === 1) {
      await this.redis.set(
        key,
        String(current),
        "EX",
        this.policy.windowSeconds,
      );
    }
    return current;
  }

  async isLocked(identifier: string): Promise<boolean> {
    const key = keyFor(identifier);
    const raw = await this.redis.get(key);
    if (!raw) return false;
    const count = Number.parseInt(raw, 10);
    return Number.isFinite(count) && count >= this.policy.maxFailures;
  }

  async clearAttempts(identifier: string): Promise<void> {
    await this.redis.del(keyFor(identifier));
  }
}
