-- ACH-009 seguranca: track last successful login + dormant notification
-- timestamp on Account so the scheduler can flag idle accounts.
ALTER TABLE "accounts"
  ADD COLUMN "lastLoginAt" TIMESTAMP(3),
  ADD COLUMN "dormantNotifiedAt" TIMESTAMP(3);

CREATE INDEX "accounts_lastLoginAt_idx" ON "accounts" ("lastLoginAt");
