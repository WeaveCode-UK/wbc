import { redactSecurityFields } from "./redaction";

export type SecurityEventType =
  | "otp.send"
  | "otp.send.rate_limited"
  | "otp.verify.success"
  | "otp.verify.failed"
  | "otp.verify.locked"
  | "auth.login.success"
  | "auth.login.failed"
  | "rbac.forbidden"
  | "tenant.cross_tenant_blocked";

export interface SecurityEvent {
  event: SecurityEventType;
  phone?: string;
  userId?: string;
  tenantId?: string;
  accountId?: string;
  email?: string;
  jti?: string;
  path?: string;
  success: boolean;
  detail?: string;
}

export function logSecurityEvent(data: SecurityEvent): void {
  const redacted = redactSecurityFields({
    phone: data.phone,
    userId: data.userId,
    tenantId: data.tenantId,
    accountId: data.accountId,
    email: data.email,
    jti: data.jti,
  });

  const entry = {
    level: data.success ? "info" : "warn",
    service: "wbc-security",
    event: data.event,
    phone: redacted.phone,
    userId: redacted.userId,
    tenantId: redacted.tenantId,
    accountId: redacted.accountId,
    email: redacted.email,
    jti: redacted.jti,
    path: data.path,
    success: data.success,
    detail: data.detail,
    timestamp: new Date().toISOString(),
  };
  const msg = `[SECURITY] ${data.event} ${data.success ? "OK" : "BLOCKED"}`;

  if (data.success) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ ...entry, msg }));
  } else {
    console.warn(JSON.stringify({ ...entry, msg }));
  }
}
