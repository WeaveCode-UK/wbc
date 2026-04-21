-- ACH-012 dados-persistencia: idempotent cashback redemption.
-- (tenantId, idempotencyKey) as PK; conflict = already redeemed = no-op.

CREATE TABLE "cashback_redemptions" (
  "tenantId" UUID NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "clientId" UUID NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "cashback_redemptions_pkey" PRIMARY KEY ("tenantId", "idempotencyKey")
);

CREATE INDEX "cashback_redemptions_tenantId_clientId_idx" ON "cashback_redemptions"("tenantId", "clientId");
