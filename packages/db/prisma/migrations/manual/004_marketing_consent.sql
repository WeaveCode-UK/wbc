-- ACH-012 compliance-privacidade: marketing consent columns on Client.
-- Campaigns must check `marketingConsent = true` before sending any
-- recipient a promotional message.

ALTER TABLE "Client"
  ADD COLUMN IF NOT EXISTS "marketingConsent" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "marketingConsentSource" TEXT,
  ADD COLUMN IF NOT EXISTS "marketingConsentGrantedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "marketingConsentRevokedAt" TIMESTAMPTZ;

-- Partial index — fast lookup of opted-in recipients only.
CREATE INDEX IF NOT EXISTS client_marketing_optin_idx
  ON "Client" ("tenantId") WHERE "marketingConsent" = TRUE;
