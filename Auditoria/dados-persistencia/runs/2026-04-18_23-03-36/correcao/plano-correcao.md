# Plano de Correção

## Identificação
- dominio: dados-persistencia
- run_id: 2026-04-18_23-03-36
- data_geracao: 2026-04-21 00:35:00
- total_achados: 22
- corrigiveis: 9
- corrigiveis_parciais: 13
- nao_corrigiveis: 0

## Ordem de Execução (por dependência + severidade)

### 1. ACH-002 — claimPending do outbox sem FOR UPDATE SKIP LOCKED [critico, corrigivel]
- arquivo: packages/db/src/outbox/prisma-outbox-repository.ts
- acao: substituir findMany+updateMany por `$queryRaw` `UPDATE ... WHERE id IN (SELECT ... FOR UPDATE SKIP LOCKED) RETURNING *`
- risco: baixo — query atômica

### 2. ACH-011 — Handlers do outbox não idempotentes [alto, corrigivel_parcial]
- arquivos: packages/db/prisma/schema.prisma; packages/db/src/outbox/processed-event-repository.ts (novo); packages/shared/src/events/with-idempotent-handler.ts (novo)
- acao: tabela `ProcessedEvent(eventId PK, handlerName, processedAt)` + helper `withIdempotentHandler(eventId, handlerName, fn)` que insere na tx; conflict = no-op; 2-3 handlers migrados como seed
- risco: médio — requer migration; aplicação completa em todos handlers é follow-up

### 3. ACH-012 — Cashback sem idempotencyKey [alto, corrigivel]
- arquivos: schema.prisma; packages/business/sales/adapters/prisma-cashback-repository.ts
- acao: campo `Cashback.usedByIdempotencyKey String? @unique`; `use()` aceita key opcional e trata P2002 como no-op
- risco: baixo

### 4. ACH-001 — confirmSale sem tx [critico, corrigivel]
- arquivos: packages/business/sales/use-cases/confirm-sale.ts; packages/business/sales/adapters/prisma-sale-repository.ts
- acao: envolver update+cashback+stock check em `prisma.$transaction([...], { isolationLevel: 'Serializable' })`; publish fica fora (outbox no mesmo tx via `save()`)
- dependencias: ACH-012 (cashback idempotency)
- risco: médio — tx failure requer testar

### 5. ACH-006 — Sale.total sem CHECK [medio, corrigivel]
- arquivo: schema.prisma (migration manual com raw SQL)
- acao: `ALTER TABLE "Sale" ADD CONSTRAINT "sale_total_nonneg" CHECK ("total" >= 0)`
- risco: baixo

### 6. ACH-005 + ACH-013 + ACH-007 — índices + Brand unique [alto+medio, corrigivel]
- arquivo: schema.prisma
- acao: migration `add-missing-indexes` — @@index em SaleItem(saleId), Return(saleId), PostSaleFlow(saleId), BrandOrder([tenantId,status]), BrandOrderItem(brandOrderId), Sample([tenantId,clientId]), CommunityTemplate(tenantId), QuickReply(tenantId), Team(tenantId), TeamMember([teamId,memberId]), TeamTask([teamId,memberId]), Delivery([tenantId,status]), GiftSuggestor([tenantId,clientId]); `@@unique` em Brand([tenantId,name]); `Sale([tenantId,status,createdAt])`
- risco: médio — migration em tabelas grandes; usar `CONCURRENTLY` onde possível

### 7. ACH-003 — Optimistic locking ausente [alto, corrigivel_parcial]
- arquivos: schema.prisma; packages/business/auth/adapters/prisma-subscription-repository.ts; packages/shared/src/persistence/optimistic-update.ts (novo)
- acao: `version Int @default(0)` em Subscription + Campaign; helper `optimisticUpdate`; aplicação em `incrementAiGenerationsUsed`
- risco: médio — callers precisam retry loop; restante é follow-up

### 8. ACH-009 — Opportunity.status como String [baixo, corrigivel]
- arquivo: schema.prisma
- acao: `enum OpportunityStatus { NEW, IN_PROGRESS, WON, LOST }`; migration com default+conversão string→enum
- risco: baixo

### 9. ACH-020 — Decimal(10,2) estoura em agregados [baixo, corrigivel]
- arquivo: schema.prisma
- acao: Decimal(14,2) em Sale.total, Payment.amount, Cashback.amount, Subscription.priceMonthly, etc.
- risco: baixo — compatível com dados existentes

### 10. ACH-021 — Referral.onDelete assimétrico [medio, corrigivel]
- arquivo: schema.prisma
- acao: ambos FKs com `onDelete: Restrict`
- risco: baixo

### 11. ACH-004 — RLS sem teste [alto, corrigivel_parcial]
- arquivo: packages/db/src/__tests__/rls-isolation.test.ts (novo); docs/architecture/rls-testing.md
- acao: test harness vitest que popula dois tenants e verifica isolamento; doc com como rodar em CI
- risco: médio — requer Postgres real com RLS (CI follow-up)

### 12. ACH-015 — Migrations manual/ [alto, corrigivel_parcial]
- arquivo: packages/db/prisma/migrations/[timestamp]_rls_policies/migration.sql (novo); docs/architecture/db-migrations.md
- acao: copiar `001_rls_policies.sql` para migration Prisma timestamped; remover da pasta manual; doc workflow `prisma migrate deploy`
- risco: médio — garantir que migration novo pule se policies já aplicadas

### 13. ACH-016 — Baseline vazio [medio, corrigivel_parcial]
- arquivo: docs/architecture/db-baseline.md
- acao: doc para reconstruir baseline real com `prisma migrate dev --from-empty`; script de validação
- risco: baixo — documental

### 14. ACH-017 — DLQ sem rotação [medio, corrigivel]
- arquivo: apps/worker/src/processors/dlq-archive.ts (novo); scripts/alert-dlq-depth.mjs (novo)
- acao: worker archive para entradas FAILED/DLQ > 90d; query periódica para alerta >= 100 entries
- risco: baixo

### 15. ACH-018 — Backup sem cron [alto, corrigivel_parcial]
- arquivo: deploy/backup/crontab (novo); docs/DEPLOYMENT.md atualizado
- acao: cron template para backup.sh diário 03:00 + upload S3/GCS opcional; doc RPO≤1h/RTO≤4h + drill mensal
- risco: baixo — infra humana

### 16. ACH-019 — Retenção/archive ausente [medio, corrigivel_parcial]
- arquivo: docs/architecture/data-retention.md; packages/db/src/archive/base-archiver.ts (novo stub)
- acao: doc com política de retenção por entidade; stub de framework `archiveOlderThan(daysByEntity)`
- risco: baixo — doc + stub

### 17. ACH-022 — pg_stat_statements não habilitado [baixo, corrigivel_parcial]
- arquivo: deploy/postgres/init.sql (novo); docs/DEPLOYMENT.md
- acao: `CREATE EXTENSION IF NOT EXISTS pg_stat_statements` no init; doc query semanal
- risco: baixo

### 18. ACH-008 — Soft-delete incoerente [medio, corrigivel_parcial]
- arquivo: docs/architecture/delete-policy.md
- acao: doc com política — hard-delete + archive table para compliance; exceção documentada em TenantMember (audit trail)
- risco: baixo — doc

### 19. ACH-010 — PrismaClient via constructor [medio, corrigivel_parcial]
- arquivo: docs/architecture/composition-root.md (atualizar)
- acao: atualizar doc — seed já em composition-root (codigo-manutenibilidade/ACH-003); restante é follow-up
- risco: baixo — doc

### 20. ACH-014 — Queries redundantes tag-repository [baixo, corrigivel]
- arquivo: packages/business/clients/adapters/prisma-tag-repository.ts
- acao: substituir verify+insert por insert direto com tratamento P2003 (FK violation) / P2025 (record not found)
- risco: baixo

## Achados Não Corrigíveis
Nenhum.

## Resumo do Plano
- Total a corrigir: 9
- Total parcial: 13
- Total não corrigível: 0
- Estimativa de commits: ~18 (alguns agrupados por migration)
