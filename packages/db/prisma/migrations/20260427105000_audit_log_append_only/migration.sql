-- ACH-065 seguranca: enforce append-only on the audit_logs table at the
-- database level. Application-side discipline already discourages
-- UPDATE/DELETE, but a malicious DBA or a compromised application role
-- could rewrite history without this. The trigger below raises a clear
-- error on UPDATE/DELETE, leaving a single legal mutation: INSERT.

CREATE OR REPLACE FUNCTION wbc_audit_logs_append_only()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION
    'audit_logs is append-only; % rejected (ACH-065)', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_block_update ON audit_logs;
CREATE TRIGGER audit_logs_block_update
  BEFORE UPDATE ON audit_logs
  FOR EACH STATEMENT
  EXECUTE FUNCTION wbc_audit_logs_append_only();

DROP TRIGGER IF EXISTS audit_logs_block_delete ON audit_logs;
CREATE TRIGGER audit_logs_block_delete
  BEFORE DELETE ON audit_logs
  FOR EACH STATEMENT
  EXECUTE FUNCTION wbc_audit_logs_append_only();

-- ACH-065: hash-chain column. Each row's hash digests
--   prev_hash + id + tenantId + accountId + action + resource +
--   resourceId + status + createdAt
-- so a tampered or removed row breaks the chain in a way the retention
-- worker (also ACH-065) can detect.
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS prev_hash TEXT,
  ADD COLUMN IF NOT EXISTS row_hash TEXT;

CREATE OR REPLACE FUNCTION wbc_audit_logs_hash_chain()
RETURNS trigger AS $$
DECLARE
  last_hash TEXT;
BEGIN
  SELECT row_hash INTO last_hash
    FROM audit_logs
    WHERE row_hash IS NOT NULL
    ORDER BY "createdAt" DESC
    LIMIT 1;
  NEW.prev_hash := COALESCE(last_hash, '');
  NEW.row_hash := encode(
    digest(
      COALESCE(NEW.prev_hash, '') || '|' ||
      NEW.id::text || '|' ||
      COALESCE(NEW."tenantId"::text, '') || '|' ||
      COALESCE(NEW."accountId"::text, '') || '|' ||
      NEW.action || '|' ||
      NEW.resource || '|' ||
      COALESCE(NEW."resourceId", '') || '|' ||
      NEW.status || '|' ||
      to_char(NEW."createdAt", 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_hash_chain ON audit_logs;
CREATE TRIGGER audit_logs_hash_chain
  BEFORE INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION wbc_audit_logs_hash_chain();
