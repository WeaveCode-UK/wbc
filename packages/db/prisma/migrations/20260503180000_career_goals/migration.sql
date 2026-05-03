-- Item 53 da spec: tracker de carreira/níveis (CareerGoal).
-- A consultora cadastra metas de manutenção/promoção por marca; o cron
-- diário compara o progresso e emite Notification quando faltar pouco.

CREATE TABLE "career_goals" (
  "id"            UUID         NOT NULL DEFAULT gen_random_uuid(),
  "tenantId"      UUID         NOT NULL,
  "brandName"     TEXT         NOT NULL,
  "levelName"     TEXT         NOT NULL,
  "targetRevenue" DECIMAL(12,2) NOT NULL,
  "targetByDate"  TIMESTAMP(3) NOT NULL,
  "startsAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notifiedAt"    TIMESTAMP(3),
  "isActive"      BOOLEAN      NOT NULL DEFAULT TRUE,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "career_goals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "career_goals_tenantId_isActive_idx"
  ON "career_goals" ("tenantId", "isActive");

ALTER TABLE "career_goals"
  ADD CONSTRAINT "career_goals_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- RLS policy: tenant isolation via tenantId equality with the
-- session-scoped current_tenant_id setting (same pattern as the
-- 20260421000005_rls_policies migration).
ALTER TABLE "career_goals" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "career_goals_tenant_isolation" ON "career_goals";
CREATE POLICY "career_goals_tenant_isolation" ON "career_goals"
  USING ("tenantId" = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK ("tenantId" = current_setting('app.current_tenant_id', true)::uuid);
