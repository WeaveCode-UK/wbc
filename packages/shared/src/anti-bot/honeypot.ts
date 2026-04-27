/**
 * ACH-072 seguranca: classic honeypot input. Forms render an extra hidden
 * field with a name a real user never fills in (`__hp` here, generic
 * enough that bots looking for `name`/`email` pattern-matching don't
 * skip it). When the field arrives non-empty on the wire, the request
 * is treated as bot traffic and dropped silently — no user-visible
 * error, no rate-limit consumption.
 *
 * Pair with the React component:
 *
 *   <input
 *     type="text"
 *     name="__hp"
 *     tabIndex={-1}
 *     autoComplete="off"
 *     style={{ position: "absolute", left: "-9999px" }}
 *     aria-hidden="true"
 *   />
 */
export const HONEYPOT_FIELD_NAME = "__hp";

/** Returns true when the request is bot traffic (honeypot tripped). */
export function isHoneypotTripped(input: Record<string, unknown>): boolean {
  const v = input[HONEYPOT_FIELD_NAME];
  if (v === undefined || v === null) return false;
  if (typeof v === "string" && v.trim() === "") return false;
  return true;
}
