-- DR Smoke Tests — SQL suite executed after restore
--
-- ACH-004 documentacao-runbooks + ACH-010 infraestrutura-deploy-config:
-- conjunto de queries que valida se um dump restaurado está coerente.
-- Usado pelo runbook docs/runbooks/dr.md e (futuramente) pelo workflow
-- .github/workflows/dr-drill.yml com reporting detalhado.
--
-- Cada assertion segue o padrão "RAISE EXCEPTION se inválida" para
-- abortar o drill na primeira falha. Resultados positivos ficam em RAISE NOTICE.
--
-- Uso:
--   psql -h localhost -U wbc -d wbc_drill -f deploy/dr/smoke-tests.sql

\set ON_ERROR_STOP on

DO $$
DECLARE
  v_tenants     int;
  v_clients     int;
  v_sales       int;
  v_appts       int;
  v_outbox      int;
  v_outbox_proc int;
  v_now         timestamptz := now();
  v_last_sale   timestamptz;
BEGIN
  -- 1. Existência das tabelas core (erra imediatamente se faltou alguma)
  PERFORM 'tenants'::regclass;
  PERFORM 'accounts'::regclass;
  PERFORM 'clients'::regclass;
  PERFORM 'sales'::regclass;
  PERFORM 'appointments'::regclass;
  PERFORM 'outbox_events'::regclass;
  RAISE NOTICE '[dr-smoke] ✓ Core tables exist';

  -- 2. Contagens básicas (tenant é pré-requisito; sem tenant, backup inútil)
  SELECT COUNT(*) INTO v_tenants FROM tenants;
  IF v_tenants = 0 THEN
    RAISE EXCEPTION '[dr-smoke] ✗ No tenants in restored DB — backup is empty or corrupt';
  END IF;
  RAISE NOTICE '[dr-smoke] ✓ % tenants restored', v_tenants;

  SELECT COUNT(*) INTO v_clients FROM clients;
  RAISE NOTICE '[dr-smoke] ✓ % clients restored', v_clients;

  SELECT COUNT(*) INTO v_sales FROM sales;
  SELECT COUNT(*) INTO v_appts FROM appointments;
  RAISE NOTICE '[dr-smoke] ✓ % sales / % appointments restored', v_sales, v_appts;

  -- 3. Freshness — dump não pode ser antigo demais (> 48h sugere backup travado)
  SELECT MAX(created_at) INTO v_last_sale FROM sales;
  IF v_last_sale IS NOT NULL AND v_last_sale < v_now - interval '48 hours' THEN
    RAISE WARNING '[dr-smoke] ⚠ last sale is % old (> 48h) — verify backup freshness',
      v_now - v_last_sale;
  END IF;

  -- 4. Outbox health — % de PROCESSED deve ser alto em backup saudável
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'PROCESSED')
    INTO v_outbox, v_outbox_proc
    FROM outbox_events;
  IF v_outbox > 0 THEN
    IF (v_outbox_proc::float / v_outbox) < 0.5 THEN
      RAISE WARNING '[dr-smoke] ⚠ outbox processed ratio %.2f (< 0.5) — possible worker lag at backup time',
        (v_outbox_proc::float / v_outbox);
    ELSE
      RAISE NOTICE '[dr-smoke] ✓ outbox processed ratio %.2f OK',
        (v_outbox_proc::float / v_outbox);
    END IF;
  END IF;

  -- 5. Multi-tenancy invariant — no cross-tenant leakage
  -- Qualquer client/sale com tenantId não-existente = corrupção silenciosa.
  IF EXISTS (
    SELECT 1 FROM clients c
    LEFT JOIN tenants t ON t.id = c."tenantId"
    WHERE t.id IS NULL
  ) THEN
    RAISE EXCEPTION '[dr-smoke] ✗ orphan clients detected (tenantId references nonexistent tenant)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM sales s
    LEFT JOIN tenants t ON t.id = s."tenantId"
    WHERE t.id IS NULL
  ) THEN
    RAISE EXCEPTION '[dr-smoke] ✗ orphan sales detected';
  END IF;
  RAISE NOTICE '[dr-smoke] ✓ no orphan tenants references';

  -- 6. Sessions não podem estar todas expiradas (Backup tirado durante janela quieta?)
  IF EXISTS (SELECT 1 FROM sessions WHERE expires > v_now) THEN
    RAISE NOTICE '[dr-smoke] ✓ active sessions present';
  ELSE
    RAISE WARNING '[dr-smoke] ⚠ no active sessions — backup may be from idle window';
  END IF;

  -- 7. Migration table consistency — todas applied?
  IF EXISTS (
    SELECT 1 FROM _prisma_migrations
    WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION '[dr-smoke] ✗ _prisma_migrations has pending or rolled-back entries';
  END IF;
  RAISE NOTICE '[dr-smoke] ✓ all prisma migrations finished clean';

  RAISE NOTICE '[dr-smoke] === ALL CHECKS PASSED ===';
END $$;
