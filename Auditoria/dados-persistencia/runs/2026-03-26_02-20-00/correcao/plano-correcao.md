# Plano de Correção — dados-persistencia

## Identificação
- dominio: dados-persistencia
- run_id: 2026-03-26_02-20-00
- total: 10, corrigiveis: 3, parciais: 4, nao_corrigiveis: 3

## Ordem
1. ACH-001 (alto) — $transaction em confirmSale, stock decrement, cashback.use
2. ACH-004 (medio) — @@unique([tenantId, productId]) no Stock
3. ACH-006 (medio) — Cleanup job para OutboxEvent
4. ACH-003 (medio, parcial) — RLS policies para tabelas faltantes
5. ACH-002 (alto, parcial) — Serializable transaction para concurrency
6. ACH-005 (medio, parcial) — onDelete em FKs
7. ACH-007 (medio, parcial) — Optimistic locking

## Não Corrigíveis
- ACH-008 — backup/retention (infraestrutura)
- ACH-009 — migrations workflow (decisão de processo)
- ACH-010 — achado positivo
