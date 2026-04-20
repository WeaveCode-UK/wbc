-- ACH-015 dados-persistencia: integrated RLS policies.
--
-- Combined content of the previous `manual/001_rls_policies.sql` and
-- `manual/002_rls_policies_complement.sql` so `prisma migrate deploy`
-- brings a fresh environment up to a fully-RLS-covered schema without
-- the out-of-band psql step.
--
-- Idempotent: `ENABLE ROW LEVEL SECURITY` is a no-op on an already-
-- enabled table; `CREATE POLICY IF NOT EXISTS` (PG 15+) or the
-- DROP-then-CREATE dance used below ensures rerunning the migration
-- doesn't fail on existing policies.

-- ---- First wave (was manual/001_rls_policies.sql) ----

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'clients', 'tags', 'products', 'showcases', 'sales', 'cashbacks',
    'stocks', 'brand_orders', 'samples', 'campaigns', 'scheduled_messages',
    'message_templates', 'quick_replies', 'expenses', 'financial_reports',
    'appointments', 'reminders', 'opportunities', 'ai_generations',
    -- Second-wave tables (were in manual/002)
    'team_members', 'team_tasks', 'deliveries', 'landing_pages',
    'notifications', 'referrals', 'onboarding_progress',
    'post_sale_flows', 'community_templates'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON %I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY tenant_isolation_%I ON %I
       USING ("tenantId" = current_setting(''app.current_tenant_id'', true)::uuid)
       WITH CHECK ("tenantId" = current_setting(''app.current_tenant_id'', true)::uuid)',
      tbl, tbl
    );
  END LOOP;
END $$;
