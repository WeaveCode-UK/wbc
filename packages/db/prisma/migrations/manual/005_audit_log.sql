-- ACH-020 compliance-privacidade: AuditLog — registro de quem acessou/alterou
-- dados pessoais. LGPD art. 37 exige capacidade de demonstrar tratamento.
-- Também serve ao endpoint `privacy.accessLog` (ACH-001).

CREATE TABLE IF NOT EXISTS "AuditLog" (
  id           TEXT PRIMARY KEY,
  tenant_id    TEXT NOT NULL,
  actor_id     TEXT,                    -- null para ações de sistema
  actor_type   TEXT NOT NULL,           -- 'user' | 'system' | 'worker' | 'admin'
  action       TEXT NOT NULL,           -- 'read' | 'create' | 'update' | 'delete' | 'export' | 'anonymize'
  resource     TEXT NOT NULL,           -- 'Client' | 'Account' | 'Sale' | etc.
  resource_id  TEXT,                    -- null quando ação é de listagem
  ip_address   INET,
  user_agent   TEXT,
  diff         JSONB,                   -- { before: {...}, after: {...} } quando aplicável
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_tenant_time_idx
  ON "AuditLog" (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_resource_idx
  ON "AuditLog" (tenant_id, resource, resource_id);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx
  ON "AuditLog" (tenant_id, actor_id, created_at DESC);

-- RLS.
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_log_tenant_isolation ON "AuditLog";
CREATE POLICY audit_log_tenant_isolation ON "AuditLog"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
