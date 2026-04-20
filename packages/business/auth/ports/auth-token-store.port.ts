/**
 * Single-use, server-side token store for short-lived auth flows
 * (password reset, e-mail verification). Tokens MUST be:
 * - Issued only via `issue()` (with a TTL).
 * - Consumed exactly once via `consume()` (atomically deleted on read).
 * - Bound to an `accountId` and a `kind` so a token issued for kind A cannot
 *   be replayed against kind B.
 */
export type AuthTokenKind = "password-reset" | "email-verification";

export interface IssuedAuthToken {
  /** Opaque token to send to the user (e.g. via e-mail link). */
  token: string;
  /** Expiration date — convenience for callers that build URLs/messages. */
  expiresAt: Date;
}

export interface ConsumedAuthToken {
  accountId: string;
  kind: AuthTokenKind;
}

export interface AuthTokenStore {
  issue(input: {
    accountId: string;
    kind: AuthTokenKind;
    ttlSeconds: number;
  }): Promise<IssuedAuthToken>;
  /**
   * Atomically reads-and-deletes the token. Returns null if the token does
   * not exist, has expired, or has been consumed already.
   */
  consume(input: {
    token: string;
    kind: AuthTokenKind;
  }): Promise<ConsumedAuthToken | null>;
  /**
   * Optional explicit revoke (e.g. user changed password through another flow
   * and we want to invalidate any pending reset token).
   */
  revokeAllForAccount(input: {
    accountId: string;
    kind: AuthTokenKind;
  }): Promise<void>;
}
