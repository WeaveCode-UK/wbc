/**
 * ACH-004: checks a candidate password against a corpus of breached
 * passwords. Implementations should keep the password local (only its
 * SHA-1 prefix may leave the process), per the HaveIBeenPwned k-anonymity
 * convention.
 */
export interface PasswordBreachChecker {
  /**
   * Returns the count of breaches in which `password` appears, or `null`
   * when the lookup itself fails (network error, rate-limit). Callers
   * SHOULD treat `null` as "unknown" and let the password through with a
   * warning rather than blocking on transient infra issues.
   */
  countBreaches(password: string): Promise<number | null>;
}
