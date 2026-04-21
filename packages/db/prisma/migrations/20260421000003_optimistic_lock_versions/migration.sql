-- ACH-003 dados-persistencia: add `version` to Subscription and Campaign
-- for optimistic locking on fields updated by concurrent async handlers.

ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 0;
