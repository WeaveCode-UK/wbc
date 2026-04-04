import { createLogger } from './logger';

const logger = createLogger('security');

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
  const level = data.success ? 'info' : 'warn';
  logger[level]({
    event: data.event,
    phone: data.phone,
    userId: data.userId,
    tenantId: data.tenantId,
    path: data.path,
    success: data.success,
    detail: data.detail,
    timestamp: new Date().toISOString(),
  }, `[SECURITY] ${data.event} ${data.success ? 'OK' : 'BLOCKED'}`);
}
