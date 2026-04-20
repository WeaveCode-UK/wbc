/**
 * TOTP (RFC 6238) service. Generates per-account shared secrets, builds the
 * provisioning URI for authenticator apps, and verifies 6-digit codes.
 *
 * Adapters should be stateless — the caller owns secret persistence.
 */
export interface TotpService {
  /** Fresh base32 secret (typically 20 bytes / 160 bits). */
  generateSecret(): string;

  /** otpauth:// URI to embed in a QR code for authenticator apps. */
  buildOtpauthUri(input: {
    accountEmail: string;
    issuer: string;
    secret: string;
  }): string;

  /** Returns true if `token` is valid for `secret` within the acceptable
   *  time window (typically ±1 step). */
  verify(input: { token: string; secret: string }): boolean;
}
