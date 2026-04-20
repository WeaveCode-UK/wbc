/**
 * Redaction helpers for log payloads. Used by security-logger and any other
 * logger that records identifiers or PII so values never appear in clear in
 * stdout, syslog, or log aggregators.
 *
 * Conventions:
 * - Phone: keep only the last 4 digits, mask the rest with `*`.
 * - IDs (userId, tenantId, accountId, jti, etc.): keep only the first 8
 *   characters of the identifier, suffixed with `…`.
 * - Email: hash with sha256 and keep first 12 chars; never log raw email.
 *
 * `redactSecurityFields` applies the conventions to a known set of fields. It
 * is the recommended entrypoint for log payloads.
 */

import { createHash } from "node:crypto";

export function redactPhone(phone: string | undefined): string | undefined {
  if (!phone) return phone;
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "****";
  const last4 = digits.slice(-4);
  return `${"*".repeat(Math.max(0, digits.length - 4))}${last4}`;
}

export function redactId(id: string | undefined): string | undefined {
  if (!id) return id;
  if (id.length <= 8) return id;
  return `${id.slice(0, 8)}…`;
}

export function redactEmail(email: string | undefined): string | undefined {
  if (!email) return email;
  const hash = createHash("sha256").update(email.toLowerCase()).digest("hex");
  return `email#${hash.slice(0, 12)}`;
}

export interface RedactableSecurityFields {
  phone?: string;
  userId?: string;
  tenantId?: string;
  accountId?: string;
  email?: string;
  jti?: string;
}

export function redactSecurityFields<T extends RedactableSecurityFields>(
  fields: T,
): T {
  const redacted: RedactableSecurityFields = {};
  if (fields.phone !== undefined) redacted.phone = redactPhone(fields.phone);
  if (fields.userId !== undefined) redacted.userId = redactId(fields.userId);
  if (fields.tenantId !== undefined)
    redacted.tenantId = redactId(fields.tenantId);
  if (fields.accountId !== undefined)
    redacted.accountId = redactId(fields.accountId);
  if (fields.email !== undefined) redacted.email = redactEmail(fields.email);
  if (fields.jti !== undefined) redacted.jti = redactId(fields.jti);
  return { ...fields, ...redacted };
}
