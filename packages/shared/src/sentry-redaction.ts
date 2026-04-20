/**
 * Pure redaction for Sentry event payloads. Used in `beforeSend` hooks across
 * apps/api (sentry/node) and apps/web (sentry/nextjs) so PII, secrets and
 * tokens never reach Sentry.io.
 *
 * Strategy:
 * - Strip `request.headers.authorization`, `request.headers.cookie`.
 * - Recursively redact any field whose key matches `SENSITIVE_KEYS_RE`.
 * - Truncate strings longer than `MAX_STRING_LEN` to avoid leaking large bodies.
 *
 * Function is intentionally typed as `unknown` → `unknown` so it works for
 * both `@sentry/node` and `@sentry/nextjs` Event shapes without coupling to
 * the SDK package.
 */

const SENSITIVE_KEYS_RE =
  /^(authorization|cookie|set-cookie|password|token|access_token|refresh_token|id_token|secret|api[_-]?key|otp|email)$/i;
const MAX_STRING_LEN = 2000;

function redactValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[redacted-depth]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    return value.length > MAX_STRING_LEN
      ? `${value.slice(0, MAX_STRING_LEN)}…[truncated]`
      : value;
  }
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => redactValue(v, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS_RE.test(k)) {
      out[k] = "[redacted]";
    } else {
      out[k] = redactValue(v, depth + 1);
    }
  }
  return out;
}

export function redactSentryEvent<T>(event: T): T {
  if (event === null || typeof event !== "object") return event;
  const e = event as Record<string, unknown>;
  const redacted: Record<string, unknown> = { ...e };

  if (e.request && typeof e.request === "object") {
    redacted.request = redactValue(e.request);
  }
  if (e.user && typeof e.user === "object") {
    const user = { ...(e.user as Record<string, unknown>) };
    delete user.email;
    delete user.ip_address;
    redacted.user = user;
  }
  if (e.contexts && typeof e.contexts === "object") {
    redacted.contexts = redactValue(e.contexts);
  }
  if (e.extra && typeof e.extra === "object") {
    redacted.extra = redactValue(e.extra);
  }
  if (Array.isArray(e.breadcrumbs)) {
    redacted.breadcrumbs = (e.breadcrumbs as unknown[]).map((b) =>
      redactValue(b),
    );
  }
  return redacted as T;
}
