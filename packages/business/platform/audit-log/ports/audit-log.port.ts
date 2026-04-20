/**
 * AuditLog port — persists security and administrative events to a
 * durable store (Postgres `audit_logs` table). Used to reconstruct what
 * happened on a tenant after an incident and to satisfy LGPD audit
 * requirements (ACH-024).
 *
 * The application emits an event for every state-changing security action:
 * login.success / login.failure, password.change, invite.accept,
 * member.role.change, session.revoke, api-token.create/revoke, etc.
 */
export type AuditAction =
  | "auth.login.success"
  | "auth.login.failed"
  | "auth.password.change"
  | "auth.password.reset"
  | "auth.session.revoked"
  | "auth.totp.enabled"
  | "auth.totp.disabled"
  | "auth.invite.accepted"
  | "auth.invite.cancelled"
  | "tenant.member.added"
  | "tenant.member.removed"
  | "tenant.member.role.changed"
  | "tenant.api_token.created"
  | "tenant.api_token.revoked";

export type AuditStatus = "success" | "failure" | "denied";

export interface AuditEntry {
  tenantId?: string | null;
  accountId?: string | null;
  action: AuditAction | string;
  resource: string;
  resourceId?: string | null;
  status: AuditStatus;
  ip?: string | null;
  userAgent?: string | null;
  detail?: Record<string, unknown>;
}

export interface AuditLogPort {
  record(entry: AuditEntry): Promise<void>;
}
