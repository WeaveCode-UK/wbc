export type SecurityEventType =
  | 'otp.send'
  | 'otp.send.rate_limited'
  | 'otp.verify.success'
  | 'otp.verify.failed'
  | 'otp.verify.locked'
  | 'auth.login.success'
  | 'auth.login.failed'
  | 'rbac.forbidden'
  | 'tenant.cross_tenant_blocked';

export interface SecurityEvent {
  event: SecurityEventType;
  phone?: string;
  userId?: string;
  tenantId?: string;
  path?: string;
  success: boolean;
  detail?: string;
}

export function logSecurityEvent(data: SecurityEvent): void {
  const entry = {
    level: data.success ? 'info' : 'warn',
    service: 'wbc-security',
    event: data.event,
    phone: data.phone,
    userId: data.userId,
    tenantId: data.tenantId,
    path: data.path,
    success: data.success,
    detail: data.detail,
    timestamp: new Date().toISOString(),
  };
  const msg = `[SECURITY] ${data.event} ${data.success ? 'OK' : 'BLOCKED'}`;

  if (data.success) {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ ...entry, msg }));
  } else {
    // eslint-disable-next-line no-console
    console.warn(JSON.stringify({ ...entry, msg }));
  }
}
