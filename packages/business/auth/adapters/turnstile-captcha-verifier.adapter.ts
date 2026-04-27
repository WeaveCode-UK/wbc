import type { CaptchaVerifier } from "../ports/captcha-verifier.port";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const DEFAULT_TIMEOUT_MS = 2000;

/**
 * ACH-068 seguranca: Cloudflare Turnstile verifier.
 *
 * Fail-closed by design: a Turnstile outage means the verify call
 * throws or returns falsy `success`; we treat that as "token invalid",
 * not "let it through". The cost of a CAPTCHA outage is logins failing
 * for a few minutes; the cost of failing open is undetected credential
 * stuffing.
 */
export class TurnstileCaptchaVerifier implements CaptchaVerifier {
  constructor(
    private readonly secretKey = process.env.TURNSTILE_SECRET_KEY,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ) {}

  async verify(input: { token: string; ipAddress?: string }): Promise<boolean> {
    if (!this.secretKey) {
      // No secret configured — refuse rather than silently accept. Dev
      // setups should wire StubCaptchaVerifier instead.
      return false;
    }
    if (!input.token) return false;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const body = new URLSearchParams();
      body.set("secret", this.secretKey);
      body.set("response", input.token);
      if (input.ipAddress) body.set("remoteip", input.ipAddress);

      const res = await this.fetchImpl(TURNSTILE_VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        signal: controller.signal,
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { success?: boolean };
      return data.success === true;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * Stub for dev/test. Accepts any non-empty token. Wire this only when
 * NODE_ENV !== "production".
 */
export class StubCaptchaVerifier implements CaptchaVerifier {
  async verify(input: { token: string }): Promise<boolean> {
    return typeof input.token === "string" && input.token.length > 0;
  }
}
