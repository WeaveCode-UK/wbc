-- ACH-015 dados-persistencia: integrated RLS policies.
--
-- Combined content of the previous `manual/001_rls_policies.sql` and
-- `manual/002_rls_policies_complement.sql` so `prisma migrate deploy`
-- brings a fresh environment up to a fully-RLS-covered schema without
-- the out-of-band psql step.
--
-- Idempotent: `ENABLE ROW LEVEL SECURITY` is a no-op on an already-
-- enabled table; the DROP POLICY IF EXISTS + CREATE POLICY dance used
-- below ensures rerunning the migration doesn't fail on existing
-- policies.
--
-- Review-fix (Fase Revisor): the original integrated SQL built the
-- policy off `"tenantId"` for every table, but several second-wave
-- tables don't carry that column (they inherit tenancy via their
-- parent — `post_sale_flows.saleId`, `deliveries.saleId`,
-- `team_members.teamId`, `team_tasks.teamId`, `referrals.referrerTenantId`).
-- Attempting `CREATE POLICY ... USING ("tenantId" = ...)` on a table
-- without that column fails immediately, which would brick
-- `prisma migrate deploy` on a fresh environment. The policy
-- expression is now chosen per table: direct `"tenantId"` when it
-- exists, parent-derived subquery otherwise.

DO $$
DECLARE
  -- (table, tenant expression) pairs. The expression is spliced into
  -- both `USING` and `WITH CHECK`; it must evaluate to the row's
  -- effective tenant so `current_setting('app.current_tenant_id')`
  -- matches the owning tenant of the row.
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT *
    FROM (VALUES
      -- First wave (was manual/001): all carry `tenantId` directly.
      ('clients',             '"tenantId"'),
      ('tags',                '"tenantId"'),
      ('products',            '"tenantId"'),
      ('showcases',           '"tenantId"'),
      ('sales',               '"tenantId"'),
      ('cashbacks',           '"tenantId"'),
      ('stocks',              '"tenantId"'),
      ('brand_orders',        '"tenantId"'),
      ('samples',             '"tenantId"'),
      ('campaigns',           '"tenantId"'),
      ('scheduled_messages',  '"tenantId"'),
      ('message_templates',   '"tenantId"'),
      ('quick_replies',       '"tenantId"'),
      ('expenses',            '"tenantId"'),
      ('financial_reports',   '"tenantId"'),
      ('appointments',        '"tenantId"'),
      ('reminders',           '"tenantId"'),
      ('opportunities',       '"tenantId"'),
      ('ai_generations',      '"tenantId"'),
      -- Second wave (was manual/002): mix of direct and derived.
      ('landing_pages',       '"tenantId"'),
      ('notifications',       '"tenantId"'),
      ('onboarding_progress', '"tenantId"'),
      ('community_templates', '"tenantId"'),
      -- Derived via parent sale (`sales.tenantId`).
      ('post_sale_flows',     '(SELECT "tenantId" FROM "sales" WHERE "sales"."id" = "post_sale_flows"."saleId")'),
      ('deliveries',          '(SELECT "tenantId" FROM "sales" WHERE "sales"."id" = "deliveries"."saleId")'),
      -- Derived via team (`teams.tenantId`).
      ('team_members',        '(SELECT "tenantId" FROM "teams" WHERE "teams"."id" = "team_members"."teamId")'),
      ('team_tasks',          '(SELECT "tenantId" FROM "teams" WHERE "teams"."id" = "team_tasks"."teamId")'),
      -- Derived: referrals are scoped by the referrer tenant.
      ('referrals',           '"referrerTenantId"')
    ) AS t(tbl, tenant_expr)
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', rec.tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON %I', rec.tbl, rec.tbl);
    EXECUTE format(
      'CREATE POLICY tenant_isolation_%I ON %I
       USING (%s = current_setting(''app.current_tenant_id'', true)::uuid)
       WITH CHECK (%s = current_setting(''app.current_tenant_id'', true)::uuid)',
      rec.tbl, rec.tbl, rec.tenant_expr, rec.tenant_expr
    );
  END LOOP;
END $$;
