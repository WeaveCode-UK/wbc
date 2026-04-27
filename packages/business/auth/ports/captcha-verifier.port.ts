/**
 * ACH-068 seguranca: CAPTCHA verifier. Sensitive endpoints (login,
 * password-reset request, email-verification request, accept-invite)
 * MUST require a CAPTCHA token when the request originates from
 * untrusted territory (no recent successful login from this IP, lockout
 * counter > 0, anonymous public landing form, etc.).
 *
 * The decision of WHEN to require the CAPTCHA lives in the calling
 * router; this port only verifies a token against the third-party
 * service. Adapters supported (in priority order):
 *
 * 1. Cloudflare Turnstile  — invisible by default, free
 * 2. hCaptcha              — invisible variant available
 * 3. Stub                  — dev/test, accepts every token
 */
export interface CaptchaVerifier {
  /**
   * Returns true when the token is valid for the (anonymous) request.
   * Implementations must be fail-closed when the upstream is
   * unreachable — a CAPTCHA outage is a security incident, not an
   * excuse to let traffic through unchecked.
   */
  verify(input: { token: string; ipAddress?: string }): Promise<boolean>;
}
