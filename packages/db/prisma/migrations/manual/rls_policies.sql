-- RLS Policies for multi-tenant isolation
-- Run after starting the database: psql $DATABASE_URL -f this_file.sql
-- Sets app.current_tenant_id via SET LOCAL before each transaction

-- Enable RLS on all tables with tenant_id column

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_clients ON clients FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_tags ON tags FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE client_tags ENABLE ROW LEVEL SECURITY;
-- client_tags does not have tenantId directly, skip RLS (protected via FK to clients)

ALTER TABLE client_wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_client_wishlists ON client_wishlists FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE gift_suggestors ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_gift_suggestors ON gift_suggestors FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_products ON products FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE showcases ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_showcases ON showcases FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_sales ON sales FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE cashbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_cashbacks ON cashbacks FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_stocks ON stocks FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE brand_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_brand_orders ON brand_orders FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE samples ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_samples ON samples FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_campaigns ON campaigns FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_scheduled_messages ON scheduled_messages FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_message_templates ON message_templates FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid OR "tenantId" IS NULL) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid OR "tenantId" IS NULL);

ALTER TABLE community_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_community_templates ON community_templates FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_quick_replies ON quick_replies FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_expenses ON expenses FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_financial_reports ON financial_reports FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_appointments ON appointments FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_tenant_members ON tenant_members FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_invites ON invites FOR ALL USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid) WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);

-- Tables WITHOUT RLS (no tenantId or system-level):
-- accounts, oauth_accounts, sessions, brands, otp_codes, subscriptions, tenants
-- sale_items, payments, returns (protected via FK to tenant-scoped parent)
-- showcase_products, brand_order_items, campaign_recipients, post_sale_flows (protected via FK)
