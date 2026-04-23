/**
 * ACH-004 compliance-privacidade: central registry of fields that contain
 * sensitive categories (LGPD art. 5.II / GDPR art. 9) or require elevated
 * handling.
 *
 * Consumers:
 * - Loggers: pass through `redactSensitive()` before printing.
 * - Sentry `beforeSend`: already covers these keys via `SENSITIVE_KEYS_RE`
 *   (see sentry-redaction.ts).
 * - ESLint rule (follow-up): forbid `console.log` of any property matching.
 * - Code review: adding a new sensitive field requires updating this file.
 */

export const SENSITIVE_FIELD_NAMES = [
  // Health (LGPD art. 5.II)
  "allergies",
  // Free-text user input — may contain unstructured sensitive data
  "notes",
  "preferences",
  // Document numbers
  "cpf",
  "cnpj",
  // Personal identifiers
  "phone",
  "phoneNumber",
  "whatsappNumber",
  "email",
  // Secrets that might slip in
  "password",
  "otp",
  "token",
] as const;

export type SensitiveFieldName = (typeof SENSITIVE_FIELD_NAMES)[number];

export function isSensitiveField(name: string): name is SensitiveFieldName {
  return (SENSITIVE_FIELD_NAMES as readonly string[]).includes(name);
}

/**
 * Redact every sensitive field in a flat object. Returns a new object
 * with placeholders. Values of non-sensitive fields pass through.
 */
export function redactSensitive<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (isSensitiveField(k)) {
      out[k] = v === undefined || v === null ? v : "[sensitive]";
    } else {
      out[k] = v;
    }
  }
  return out as T;
}
