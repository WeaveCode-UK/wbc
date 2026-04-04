# Relatório — dados-persistencia

## Identificação
- dominio: dados-persistencia
- run_id: 2026-03-26_02-20-00
- status: concluido

## Resumo
Corrigidos 4 achados: operações multi-step em $transaction, unique constraint no Stock, cleanup job para outbox events, e RLS policies complementares. 3 achados requerem decisões humanas (locking, onDelete, versioning). 2 achados de infraestrutura/processo. 1 achado positivo.

## Achados Corrigidos
- ACH-001 (alto) — $transaction em decrementForSale e cashback.use
- ACH-004 (medio) — @@unique([tenantId, productId]) no Stock
- ACH-006 (medio) — Cleanup job 30 dias para OutboxEvent PROCESSED
- ACH-003 (medio, parcial) — SQL com RLS para 9 tabelas faltantes

## Parciais (validação humana)
- ACH-002 — Serializable isolation precisa de análise de deadlock
- ACH-005 — onDelete: Cascade vs SetNull precisa de decisão por FK
- ACH-007 — Modelos para optimistic locking precisa de decisão

## Não Corrigíveis
- ACH-008 — Backup/retention: decisão de infra
- ACH-009 — Migrations: decisão de workflow
- ACH-010 — Achado positivo

## Commits
1. 47ad6ca init | 2. 700a9e8 ACH-001 | 3. ea4261c ACH-004
4. 725d82f ACH-006 | 5. 8483969 ACH-003

## Merge
- status: pendente
