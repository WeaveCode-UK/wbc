-- ACH-003 compliance-privacidade: ConsentLog table for LGPD art. 7.I consent
-- tracking. Records every grant and revocation of consent by type (e.g.
-- 'privacy_policy_v1', 'marketing', 'international_transfer').
--
-- Applied via deploy/deploy.sh::apply_manual_migrations (ACH-012 infra).

CREATE TABLE IF NOT EXISTS "ConsentLog" (
  id           TEXT PRIMARY KEY,
  tenant_id    TEXT NOT NULL,
  account_id   TEXT NOT NULL,
  type         TEXT NOT NULL,           -- 'privacy_policy_v1' | 'marketing' | etc.
  version      TEXT NOT NULL,           -- '1.0.0' — allows tracking policy version at consent time
  granted_at   TIMESTAMPTZ,             -- null when status starts as 'not-granted'
  revoked_at   TIMESTAMPTZ,             -- null while active
  source       TEXT NOT NULL,           -- 'onboarding' | 'settings' | 'api' | etc.
  ip_address   INET,                    -- evidence
  user_agent   TEXT,                    -- evidence
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT consent_log_pk CHECK (granted_at IS NOT NULL OR revoked_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS consent_log_tenant_account_idx
  ON "ConsentLog" (tenant_id, account_id, type);
CREATE INDEX IF NOT EXISTS consent_log_active_idx
  ON "ConsentLog" (tenant_id, account_id, type) WHERE revoked_at IS NULL;

-- RLS: tenant must only see its own consent records.
ALTER TABLE "ConsentLog" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS consent_log_tenant_isolation ON "ConsentLog";
CREATE POLICY consent_log_tenant_isolation ON "ConsentLog"
  USING (tenant_id = current_setting('app.current_tenant_id', true));
