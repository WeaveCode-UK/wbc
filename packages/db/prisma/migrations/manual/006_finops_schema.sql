-- Post-audit 2026-04-24 (pós-campanha dos 15 domínios).
-- Follow-up dos parciais ACH-001, ACH-002, ACH-003, ACH-010 de custos-finops.
--
-- Migração ADDITIVE e REVERSÍVEL:
--   - Novas colunas em `subscriptions` são NULLABLE (ou têm DEFAULT).
--   - Novas tabelas são independentes; DROP TABLE as reverte.
--   - Nenhuma coluna existente é removida ou renomeada.
--
-- Deploy aplicado automaticamente por `deploy/deploy.sh apply_manual_migrations`
-- (introduzido em infraestrutura-deploy-config ACH-012). Seed de PlanQuota
-- roda no app via `pnpm db:seed` OU via script explícito após 1ª aplicação.

BEGIN;

-- ═════ 1. Colunas nullable em `subscriptions` ══════════════════════════════
ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "monthlyCostBudgetUSD"      NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS "monthlyCostAccumulatedUSD" NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "monthlyCostBlockedAt"      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "billingCycleStart"         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "billingCycleEnd"           TIMESTAMPTZ;

-- ═════ 2. plan_quotas ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "plan_quotas" (
  "id"                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "plan"                        TEXT        NOT NULL,
  "aiGenerationsLimit"          INTEGER     NOT NULL,
  "whatsappUtilityLimit"        INTEGER     NOT NULL,
  "whatsappMarketingLimit"      INTEGER     NOT NULL,
  "clientsLimit"                INTEGER     NOT NULL,
  "usersLimit"                  INTEGER     NOT NULL,
  "workspacesLimit"             INTEGER     NOT NULL,
  "defaultMonthlyCostBudgetUSD" NUMERIC(10, 2) NOT NULL,
  "updatedAt"                   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "plan_quotas_plan_key"
  ON "plan_quotas" ("plan");

-- ═════ 3. message_costs ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "message_costs" (
  "id"        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"  UUID        NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "messageId" TEXT        NOT NULL,
  "category"  TEXT        NOT NULL,
  "costUsd"   NUMERIC(10, 6) NOT NULL,
  "sentAt"    TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "message_costs_messageId_key"
  ON "message_costs" ("messageId");
CREATE INDEX IF NOT EXISTS "message_costs_tenantId_sentAt_idx"
  ON "message_costs" ("tenantId", "sentAt");

-- ═════ 4. tenant_monthly_whatsapp_costs ════════════════════════════════════
CREATE TABLE IF NOT EXISTS "tenant_monthly_whatsapp_costs" (
  "id"           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"     UUID        NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "period"       TEXT        NOT NULL, -- "YYYY-MM"
  "utilityUsd"   NUMERIC(10, 4) NOT NULL,
  "marketingUsd" NUMERIC(10, 4) NOT NULL,
  "authUsd"      NUMERIC(10, 4) NOT NULL,
  "totalUsd"     NUMERIC(10, 4) NOT NULL,
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_monthly_whatsapp_costs_tenantId_period_key"
  ON "tenant_monthly_whatsapp_costs" ("tenantId", "period");

-- ═════ 5. tenant_cost_snapshots ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "tenant_cost_snapshots" (
  "id"         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"   UUID        NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "provider"   TEXT        NOT NULL,
  "period"     TEXT        NOT NULL,
  "totalUsd"   NUMERIC(10, 4) NOT NULL,
  "breakdown"  JSONB,
  "eventCount" INTEGER     NOT NULL,
  "closedAt"   TIMESTAMPTZ NOT NULL,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_cost_snapshots_tenantId_provider_period_key"
  ON "tenant_cost_snapshots" ("tenantId", "provider", "period");
CREATE INDEX IF NOT EXISTS "tenant_cost_snapshots_period_idx"
  ON "tenant_cost_snapshots" ("period");

-- ═════ 6. provider_invoices ════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "provider_invoices" (
  "id"         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "provider"   TEXT        NOT NULL,
  "period"     TEXT        NOT NULL,
  "totalUsd"   NUMERIC(10, 4) NOT NULL,
  "breakdown"  JSONB,
  "receivedAt" TIMESTAMPTZ NOT NULL,
  "sourceUri"  TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS "provider_invoices_provider_period_key"
  ON "provider_invoices" ("provider", "period");

-- ═════ 7. reconciliations ══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "reconciliations" (
  "id"               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  "provider"         TEXT        NOT NULL,
  "period"           TEXT        NOT NULL,
  "snapshotTotalUsd" NUMERIC(10, 4) NOT NULL,
  "invoiceTotalUsd"  NUMERIC(10, 4) NOT NULL,
  "diffUsd"          NUMERIC(10, 4) NOT NULL,
  "diffPct"          NUMERIC(6, 4) NOT NULL,
  "tolerancePct"     NUMERIC(6, 4) NOT NULL,
  "status"           TEXT        NOT NULL,
  "resolvedAt"       TIMESTAMPTZ,
  "resolution"       TEXT,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "reconciliations_provider_period_key"
  ON "reconciliations" ("provider", "period");

-- ═════ 8. Seed inicial de PlanQuota (ratificar valores em docs/PRICING.md) ═
-- Valores propostos em docs/FINOPS-PLAN-LIMITS.md. Humano revisa antes de
-- ativar o CostBudgetService em block mode.
INSERT INTO "plan_quotas" (
  "plan", "aiGenerationsLimit",
  "whatsappUtilityLimit", "whatsappMarketingLimit",
  "clientsLimit", "usersLimit", "workspacesLimit",
  "defaultMonthlyCostBudgetUSD"
) VALUES
  ('ESSENTIAL', 30,  500,     0,   500, 1, 1,  1.00),
  ('PRO',       300, 3000, 1000,  5000, 5, 3, 10.00)
ON CONFLICT ("plan") DO NOTHING;

COMMIT;

-- ══════════════════════════════════════════════════════════════════════════
-- Rollback (se necessário):
--   BEGIN;
--   DROP TABLE IF EXISTS "reconciliations";
--   DROP TABLE IF EXISTS "provider_invoices";
--   DROP TABLE IF EXISTS "tenant_cost_snapshots";
--   DROP TABLE IF EXISTS "tenant_monthly_whatsapp_costs";
--   DROP TABLE IF EXISTS "message_costs";
--   DROP TABLE IF EXISTS "plan_quotas";
--   ALTER TABLE "subscriptions"
--     DROP COLUMN IF EXISTS "billingCycleEnd",
--     DROP COLUMN IF EXISTS "billingCycleStart",
--     DROP COLUMN IF EXISTS "monthlyCostBlockedAt",
--     DROP COLUMN IF EXISTS "monthlyCostAccumulatedUSD",
--     DROP COLUMN IF EXISTS "monthlyCostBudgetUSD";
--   COMMIT;
-- ══════════════════════════════════════════════════════════════════════════
