/**
 * ACH-053 / ACH-019 seguranca: minimal HTML-entity escape for interpolating
 * user-controlled values into transactional emails / inline HTML strings.
 * Covers the OWASP-recommended baseline: `&` first, then `<`, `>`, `"`, `'`,
 * `/`. Sufficient for HTML element / attribute contexts; do NOT use for
 * JS / URL / CSS contexts (those need their own encoders).
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\//g, "&#x2F;");
}
