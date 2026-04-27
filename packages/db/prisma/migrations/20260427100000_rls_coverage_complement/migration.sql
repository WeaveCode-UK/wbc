-- ACH-014 seguranca: extends row-level security to the eleven tenant-scoped
-- tables that 20260421000005_rls_policies missed. Five carry `tenantId`
-- directly; the remaining six derive it from a parent row, so the policy
-- expression is a SELECT against the parent's tenantId column.
--
-- Mirrors the parent migration's idempotent pattern (DROP POLICY IF EXISTS
-- + CREATE POLICY + ENABLE ROW LEVEL SECURITY) so a re-run on a
-- partially-applied environment does not fail.

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT * FROM (
      VALUES
        -- Direct tenantId on the row.
        ('tenant_members',      '"tenantId"'),
        ('invites',              '"tenantId"'),
        ('client_wishlists',     '"tenantId"'),
        ('gift_suggestors',      '"tenantId"'),
        ('teams',                '"tenantId"'),
        -- Parent-derived tenancy.
        ('client_tags',
          '(SELECT "tenantId" FROM "clients" WHERE "clients"."id" = "client_tags"."clientId")'),
        ('showcase_products',
          '(SELECT "tenantId" FROM "showcases" WHERE "showcases"."id" = "showcase_products"."showcaseId")'),
        ('sale_items',
          '(SELECT "tenantId" FROM "sales" WHERE "sales"."id" = "sale_items"."saleId")'),
        ('payments',
          '(SELECT "tenantId" FROM "sales" WHERE "sales"."id" = "payments"."saleId")'),
        ('returns',
          '(SELECT "tenantId" FROM "sales" WHERE "sales"."id" = "returns"."saleId")'),
        ('brand_order_items',
          '(SELECT "tenantId" FROM "brand_orders" WHERE "brand_orders"."id" = "brand_order_items"."brandOrderId")'),
        ('campaign_recipients',
          '(SELECT "tenantId" FROM "campaigns" WHERE "campaigns"."id" = "campaign_recipients"."campaignId")')
    ) AS t(tbl, tenant_expr)
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', rec.tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON %I', rec.tbl, rec.tbl);
    EXECUTE format(
      'CREATE POLICY tenant_isolation_%I ON %I USING (%s = current_setting(''app.current_tenant_id'', true)::uuid) WITH CHECK (%s = current_setting(''app.current_tenant_id'', true)::uuid)',
      rec.tbl, rec.tbl, rec.tenant_expr, rec.tenant_expr
    );
  END LOOP;
END $$;
