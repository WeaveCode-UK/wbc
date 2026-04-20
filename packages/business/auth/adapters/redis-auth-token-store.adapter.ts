import { randomBytes } from "node:crypto";
import type { RedisLike } from "@wbc/shared";
import type {
  AuthTokenKind,
  AuthTokenStore,
  ConsumedAuthToken,
  IssuedAuthToken,
} from "../ports/auth-token-store.port";

const TOKEN_PREFIX = "auth:tk";
const ACCOUNT_INDEX_PREFIX = "auth:tk:idx";

function tokenKey(token: string): string {
  return `${TOKEN_PREFIX}:${token}`;
}

function accountIndexKey(accountId: string, kind: AuthTokenKind): string {
  return `${ACCOUNT_INDEX_PREFIX}:${kind}:${accountId}`;
}

/**
 * Redis-backed `AuthTokenStore`.
 *
 * Token format: 32 random bytes hex-encoded (256 bits of entropy). Stored as
 * `${prefix}:${token}` → JSON `{accountId, kind}` with TTL via EX.
 *
 * Consume uses GETDEL when available (Redis ≥ 6.2). The cast escapes
 * `RedisLike` because GETDEL is not in the minimal interface; ioredis
 * supports it natively.
 */
export class RedisAuthTokenStore implements AuthTokenStore {
  constructor(private readonly redis: RedisLike) {}

  async issue(input: {
    accountId: string;
    kind: AuthTokenKind;
    ttlSeconds: number;
  }): Promise<IssuedAuthToken> {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + input.ttlSeconds * 1000);
    const payload = JSON.stringify({
      accountId: input.accountId,
      kind: input.kind,
    });

    await this.redis.set(tokenKey(token), payload, "EX", input.ttlSeconds);
    // Mirror in an index so revokeAllForAccount can scan/delete in O(1)
    // per-issued token. We append the new token to a per-account set.
    await (
      this.redis as unknown as {
        sadd(k: string, ...values: string[]): Promise<number>;
      }
    ).sadd(accountIndexKey(input.accountId, input.kind), token);

    return { token, expiresAt };
  }

  async consume(input: {
    token: string;
    kind: AuthTokenKind;
  }): Promise<ConsumedAuthToken | null> {
    const raw = await (
      this.redis as unknown as {
        getdel(k: string): Promise<string | null>;
      }
    ).getdel(tokenKey(input.token));
    if (!raw) return null;

    let parsed: ConsumedAuthToken;
    try {
      parsed = JSON.parse(raw) as ConsumedAuthToken;
    } catch {
      return null;
    }

    if (parsed.kind !== input.kind) {
      // Token existed but for a different kind — refuse, do not let it be
      // replayed across flows. We've already deleted via getdel; that is fine
      // because reusing an attacker-supplied token of the wrong kind should
      // burn it anyway.
      return null;
    }
    return parsed;
  }

  async revokeAllForAccount(input: {
    accountId: string;
    kind: AuthTokenKind;
  }): Promise<void> {
    const indexKey = accountIndexKey(input.accountId, input.kind);
    const tokens = await (
      this.redis as unknown as { smembers(k: string): Promise<string[]> }
    ).smembers(indexKey);
    if (tokens.length === 0) return;
    const keys = tokens.map(tokenKey);
    await this.redis.del(...keys, indexKey);
  }
}
