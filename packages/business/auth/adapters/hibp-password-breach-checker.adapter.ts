import { createHash } from "crypto";
import type { PasswordBreachChecker } from "../ports/password-breach-checker.port";

const HIBP_RANGE_URL = "https://api.pwnedpasswords.com/range/";
const DEFAULT_TIMEOUT_MS = 1500;

/**
 * ACH-004: HaveIBeenPwned k-anonymity client. Sends only the first 5 hex
 * characters of the password's SHA-1; the response is the list of suffixes
 * that complete a known-breached hash, with a count next to each. The full
 * password and its complete hash never leave the process.
 *
 * This adapter is intentionally fail-open — if HIBP is down, we let the
 * caller decide whether to block (which would deny password rotations during
 * an external outage) or warn. Default callers in this codebase warn-only
 * when `count > 0`; rotate the policy as needed.
 */
export class HibpPasswordBreachChecker implements PasswordBreachChecker {
  constructor(
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ) {}

  async countBreaches(password: string): Promise<number | null> {
    const sha1 = createHash("sha1")
      .update(password)
      .digest("hex")
      .toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(`${HIBP_RANGE_URL}${prefix}`, {
        method: "GET",
        signal: controller.signal,
        headers: { "Add-Padding": "true" },
      });
      if (!res.ok) return null;
      const text = await res.text();
      for (const line of text.split(/\r?\n/)) {
        const [hashSuffix, count] = line.trim().split(":");
        if (!hashSuffix || !count) continue;
        if (hashSuffix.toUpperCase() === suffix) {
          const n = Number.parseInt(count, 10);
          return Number.isFinite(n) ? n : null;
        }
      }
      return 0;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}
