-- ACH-009 + ACH-020 + ACH-021 dados-persistencia.

-- ACH-009: Opportunity.status from free-form String to typed enum.
-- Create type idempotently; convert existing values before switching
-- the column type.
DO $$ BEGIN
  CREATE TYPE "OpportunityStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'WON', 'LOST');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Normalise existing lower-case values so the cast doesn't fail.
UPDATE "opportunities"
  SET "status" = upper("status")
  WHERE "status" IS NOT NULL;
UPDATE "opportunities"
  SET "status" = 'PENDING'
  WHERE "status" NOT IN ('PENDING','IN_PROGRESS','WON','LOST');

ALTER TABLE "opportunities"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "OpportunityStatus" USING "status"::"OpportunityStatus",
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- ACH-020: widen Sale aggregate columns to Decimal(14,2). Safe on
-- existing data (superset of (10,2)).
ALTER TABLE "sales" ALTER COLUMN "discount" TYPE DECIMAL(14,2);
ALTER TABLE "sales" ALTER COLUMN "total" TYPE DECIMAL(14,2);
ALTER TABLE "sales" ALTER COLUMN "cashbackUsed" TYPE DECIMAL(14,2);
ALTER TABLE "sales" ALTER COLUMN "cashbackGenerated" TYPE DECIMAL(14,2);

-- ACH-021: uniform onDelete on both Referral FKs (both Restrict).
-- The `referrer` FK is already Restrict; this flips `referred` from
-- SetNull to Restrict.
ALTER TABLE "referrals" DROP CONSTRAINT IF EXISTS "referrals_referredTenantId_fkey";
ALTER TABLE "referrals"
  ADD CONSTRAINT "referrals_referredTenantId_fkey"
  FOREIGN KEY ("referredTenantId") REFERENCES "tenants"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
