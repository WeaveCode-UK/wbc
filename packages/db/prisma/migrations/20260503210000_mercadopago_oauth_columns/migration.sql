-- Bloco 10 do plano: feature #79 — Mercado Pago OAuth real.
-- Adiciona 3 colunas no tenant para guardar o access token retornado
-- pelo OAuth flow + identificador MP do usuário + timestamp da conexão.
--
-- O token é texto plain por hora (protegido pelo RLS do tenant). Mover
-- pra pgcrypto column-level encryption é follow-up de segurança.

ALTER TABLE "tenants"
  ADD COLUMN "mercadoPagoAccessToken" TEXT,
  ADD COLUMN "mercadoPagoUserId" TEXT,
  ADD COLUMN "mercadoPagoConnectedAt" TIMESTAMP(3);
