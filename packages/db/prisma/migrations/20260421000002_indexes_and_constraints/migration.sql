-- ACH-005 + ACH-006 + ACH-007 + ACH-013 dados-persistencia.
-- Indexes on critical paths + CHECK constraints + Brand.name UNIQUE.
-- `IF NOT EXISTS` keeps the migration idempotent; safe to replay.
--
-- Uses `CREATE INDEX IF NOT EXISTS` (no CONCURRENTLY inside a migration
-- block because Prisma wraps each file in a transaction and
-- CREATE INDEX CONCURRENTLY can't run in a tx). Run on off-peak hours
-- for large tables; rewrite with CONCURRENTLY + migrate via raw psql
-- if lock contention becomes a problem.

-- ACH-006: Sale.total non-negative check.
ALTER TABLE "sales" DROP CONSTRAINT IF EXISTS "sale_total_nonneg";
ALTER TABLE "sales" ADD CONSTRAINT "sale_total_nonneg" CHECK ("total" >= 0);

-- ACH-007: Brand.name unique across all tenants (Brand is a global
-- catalog, not tenant-scoped).
CREATE UNIQUE INDEX IF NOT EXISTS "brands_name_key" ON "brands"("name");

-- ACH-013: Sale composite for the status-range dashboard query.
CREATE INDEX IF NOT EXISTS "sales_tenantId_status_createdAt_idx"
  ON "sales"("tenantId", "status", "createdAt");

-- ACH-005: FK / tenant lookups missing indexes.
CREATE INDEX IF NOT EXISTS "sale_items_saleId_idx"
  ON "sale_items"("saleId");
CREATE INDEX IF NOT EXISTS "returns_saleId_idx"
  ON "returns"("saleId");
CREATE INDEX IF NOT EXISTS "post_sale_flows_saleId_idx"
  ON "post_sale_flows"("saleId");
CREATE INDEX IF NOT EXISTS "brand_orders_tenantId_status_idx"
  ON "brand_orders"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "brand_order_items_brandOrderId_idx"
  ON "brand_order_items"("brandOrderId");
CREATE INDEX IF NOT EXISTS "samples_tenantId_clientId_idx"
  ON "samples"("tenantId", "clientId");
CREATE INDEX IF NOT EXISTS "community_templates_tenantId_idx"
  ON "community_templates"("tenantId");
CREATE INDEX IF NOT EXISTS "quick_replies_tenantId_idx"
  ON "quick_replies"("tenantId");
CREATE INDEX IF NOT EXISTS "team_tasks_teamId_memberId_idx"
  ON "team_tasks"("teamId", "memberId");
CREATE INDEX IF NOT EXISTS "deliveries_status_idx"
  ON "deliveries"("status");
CREATE INDEX IF NOT EXISTS "deliveries_clientId_idx"
  ON "deliveries"("clientId");
CREATE INDEX IF NOT EXISTS "gift_suggestors_tenantId_clientId_idx"
  ON "gift_suggestors"("tenantId", "clientId");
