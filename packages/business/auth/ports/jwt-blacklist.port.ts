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
}
