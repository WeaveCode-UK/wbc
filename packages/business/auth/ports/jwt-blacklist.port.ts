/**
 * JWT revocation list. Since NextAuth issues stateless JWTs, the only way to
 * invalidate a token before its natural expiry is to check every request
 * against a denylist of revoked `jti` values.
 */
export interface JwtBlacklist {
  /**
   * Marks `jti` as revoked for at least `ttlSeconds`. TTL should be no
   * shorter than the remaining lifetime of the JWT — after that the JWT is
   * naturally expired and the entry can be garbage-collected.
   */
  revoke(input: { jti: string; ttlSeconds: number }): Promise<void>;

  /**
   * Returns true if `jti` has been revoked.
   */
  isRevoked(jti: string): Promise<boolean>;

  /**
   * Mass-invalidates every JWT issued for `accountId` with `iat` at or before
   * `revokedBeforeUnix`. Used by ChangePassword, ResetPassword, DeleteAccount
   * and the future "revoke all sessions" admin tool (ACH-005, ACH-008,
   * ACH-066). TTL should equal the JWT max-age so the threshold expires at
   * the same time as the longest-lived legacy token.
   */
  revokeAllForAccount(input: {
    accountId: string;
    revokedBeforeUnix: number;
    ttlSeconds: number;
  }): Promise<void>;

  /**
   * Returns the most recent `revokedBeforeUnix` for `accountId`, or null when
   * no mass revocation is in force. The JWT callback compares `token.iat`
   * with this value and rejects tokens issued at or before it.
   */
  getAccountRevokedBefore(accountId: string): Promise<number | null>;
}
