# Progresso da Correção

## Identificação
- dominio: dados-persistencia
- run_id: 2026-04-18_23-03-36
- branch: fix/dados-persistencia/2026-04-18_23-03-36
- data_inicio: 2026-04-21 00:35:00
- ultima_atualizacao: 2026-04-21 01:30:00
- fase_atual: revisor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 22
- corrigidos_executor: 22
- revisados_revisor: 0
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 0
- nao_aprovados: 0
- pendentes: 0

## Mapa commit_executor por achado (Fase Executor concluída)
- ACH-002: 3abb596 — claimPending com FOR UPDATE SKIP LOCKED
- ACH-011: a2203d0 — ProcessedEvent table + withIdempotentHandler helper
- ACH-012: d4e80aa — CashbackRedemption table para idempotency
- ACH-001: e512d26 — confirmSale atômico (Serializable tx)
- ACH-005+006+007+013: c420da8 — índices + CHECK Sale.total + Brand unique + Sale composite
- ACH-003: 4975d2e — optimistic locking (version field + helper + incrementAIUsage)
- ACH-009+020+021: 310d026 — OpportunityStatus enum + Decimal(14,2) + Referral onDelete
- ACH-004: 73a973d — test harness RLS isolation + doc CI
- ACH-015: fdfedc1 — migrations manual/ integradas
- ACH-014: 32ce86b — consolida queries tag-repository
- ACH-017: 7c94936 — DLQ archive >90d + depth alert >100
- ACH-008+010+016+018+019+022: 3e04ec0 — docs + stubs batch

## Achados

### ACH-001
- titulo: confirmSale publica evento sem validar estoque na mesma transação
- severidade: critico
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: e512d26
- commit_revisor: none
- arquivos_alterados:
  - packages/business/sales/ports/sale-repository.ts (interface ConfirmAtomicParams)
  - packages/business/sales/adapters/prisma-sale-repository.ts (confirmAtomic via $transaction Serializable)
  - packages/business/sales/use-cases/confirm-sale.ts
- descricao_correcao: SaleRepository.confirmAtomic envolve status update + cashback create + stock decrement + outbox event em uma única $transaction Serializable. Decremento de stock usa updateMany com where quantity >= N (rejeita oversell).

### ACH-002
- titulo: claimPending do outbox sem FOR UPDATE SKIP LOCKED
- severidade: critico
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 3abb596
- commit_revisor: none
- arquivos_alterados:
  - packages/db/src/outbox/prisma-outbox-repository.ts
- descricao_correcao: $queryRaw único com UPDATE ... WHERE id IN (SELECT ... FOR UPDATE SKIP LOCKED) RETURNING — atômico, sem race window; respeita nextRetryAt.

### ACH-003
- titulo: Increments concorrentes sem lock nem version field
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 4975d2e
- commit_revisor: none
- arquivos_alterados:
  - packages/db/prisma/schema.prisma (version em Subscription + Campaign)
  - packages/db/prisma/migrations/20260421000003_optimistic_lock_versions/
  - packages/shared/src/persistence/optimistic-update.ts (novo helper + OptimisticLockError)
  - packages/shared/src/index.ts
  - packages/business/auth/adapters/prisma-subscription-repository.ts (incrementAIUsage usa CAS)
- descricao_correcao: campo version Int default 0 + helper optimisticUpdate com retry; incrementAIUsage migrado como seed. Restante dos callers é follow-up.
- observacoes: parcial — Campaign stats increments ainda usam { increment: 1 } sem CAS; migração é follow-up

### ACH-004
- titulo: RLS sem teste automatizado de isolamento
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 73a973d
- commit_revisor: none
- arquivos_alterados:
  - packages/db/src/__tests__/rls-isolation.test.ts (novo)
  - docs/architecture/rls-testing.md
- descricao_correcao: vitest test que popula 2 tenants, verifica isolamento via SET app.current_tenant_id; 3 assertions (visível para A, invisível para B, nada sem GUC); doc com CI workflow template
- observacoes: parcial — opt-in via TEST_DATABASE_URL; só testa tabela clients; outras 18 tabelas são follow-up

### ACH-005
- titulo: 10+ modelos sem índice em caminhos críticos
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: c420da8
- commit_revisor: none
- arquivos_alterados:
  - packages/db/prisma/schema.prisma (@@index em 11 modelos)
  - packages/db/prisma/migrations/20260421000002_indexes_and_constraints/
- descricao_correcao: índices em SaleItem(saleId), Return(saleId), PostSaleFlow(saleId), BrandOrder(tenantId,status), BrandOrderItem(brandOrderId), Sample(tenantId,clientId), CommunityTemplate(tenantId), QuickReply(tenantId), TeamTask(teamId,memberId), Delivery(status)+(clientId), GiftSuggestor(tenantId,clientId). IF NOT EXISTS idempotent.

### ACH-006
- titulo: Sale.total sem CHECK constraint
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: c420da8
- commit_revisor: none
- arquivos_alterados:
  - packages/db/prisma/migrations/20260421000002_indexes_and_constraints/ (constraint sale_total_nonneg)
- descricao_correcao: CHECK (total >= 0) via ALTER TABLE ADD CONSTRAINT; DROP IF EXISTS antes para idempotência

### ACH-007
- titulo: Brand sem @unique(name)
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: c420da8
- commit_revisor: none
- arquivos_alterados:
  - packages/db/prisma/schema.prisma (@@unique([name]))
  - packages/db/prisma/migrations/20260421000002_indexes_and_constraints/
- descricao_correcao: CREATE UNIQUE INDEX IF NOT EXISTS brands_name_key on brands(name)
- observacoes: se já existem duplicatas, migration falha em produção — merge dados é pendência humana

### ACH-008
- titulo: Soft-delete incoerente
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 3e04ec0
- commit_revisor: none
- arquivos_alterados:
  - docs/architecture/delete-policy.md
- descricao_correcao: doc política "hard-delete + archive"; TenantMember.deletedAt mantém como exceção documentada
- observacoes: parcial — aplicação da política (se houver novos soft-deletes no code base) é follow-up

### ACH-009
- titulo: Opportunity.status String livre
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 310d026
- commit_revisor: none
- arquivos_alterados:
  - packages/db/prisma/schema.prisma (enum OpportunityStatus)
  - packages/db/prisma/migrations/20260421000004_opportunity_enum_referral_decimals/
- descricao_correcao: enum {PENDING,IN_PROGRESS,WON,LOST}; migration normaliza valores (upper + fallback para PENDING) antes do cast

### ACH-010
- titulo: PrismaClient global
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 3e04ec0
- commit_revisor: none
- arquivos_alterados:
  - docs/architecture/composition-root.md
- descricao_correcao: doc status do seed entregue em codigo-manutenibilidade/ACH-003 + ACH-017/apis-integracoes; constructor-inject em ~30 adapters é follow-up
- observacoes: parcial — refactor real dos adapters é follow-up até primeira integration test landing

### ACH-011
- titulo: Handlers do outbox não idempotentes
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: a2203d0
- commit_revisor: none
- arquivos_alterados:
  - packages/db/prisma/schema.prisma (model ProcessedEvent)
  - packages/db/prisma/migrations/20260421000000_processed_events/
  - packages/db/src/outbox/processed-event-repository.ts (novo)
  - packages/db/src/index.ts
  - packages/shared/src/events/with-idempotent-handler.ts (novo helper)
  - packages/shared/src/index.ts
- descricao_correcao: table (eventId, handlerName) PK; ProcessedEventRepository.claim retorna bool; withIdempotentHandler wrapper; handler calls passam ProcessedEventClaimer
- observacoes: parcial — aplicação em cada handler de negócio (sale-confirmed-handler, post-sale, messaging) é follow-up documentado

### ACH-012
- titulo: Cashback sem idempotencyKey
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: d4e80aa
- commit_revisor: none
- arquivos_alterados:
  - packages/db/prisma/schema.prisma (model CashbackRedemption)
  - packages/db/prisma/migrations/20260421000001_cashback_redemptions/
  - packages/business/sales/ports/cashback-repository.ts
  - packages/business/sales/adapters/prisma-cashback-repository.ts
- descricao_correcao: (tenantId, idempotencyKey) PK; use() aceita key opcional; insert na tx + P2002 = no-op

### ACH-013
- titulo: Sem @@index([tenantId, status, createdAt]) em Sale
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: c420da8
- commit_revisor: none
- arquivos_alterados:
  - packages/db/prisma/schema.prisma
  - packages/db/prisma/migrations/20260421000002_indexes_and_constraints/
- descricao_correcao: composite index sales_tenantId_status_createdAt_idx para dashboard status+period

### ACH-014
- titulo: Queries redundantes em tag-repository
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 32ce86b
- commit_revisor: none
- arquivos_alterados:
  - packages/business/clients/adapters/prisma-tag-repository.ts
- descricao_correcao: delete via deleteMany+count; tagClient via try/catch P2003; untagClient via nested where; bulkTag eliminou findFirst pre-flight do tag

### ACH-015
- titulo: Migrations manual/ não integradas
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: fdfedc1
- commit_revisor: none
- arquivos_alterados:
  - packages/db/prisma/migrations/20260421000005_rls_policies/
  - docs/architecture/db-migrations.md
- descricao_correcao: conteúdo de manual/001 e manual/002 combinado em migration Prisma timestamped com DROP POLICY IF EXISTS + CREATE POLICY (idempotente); doc workflow "prisma migrate deploy" como fonte única
- observacoes: parcial — deletar pasta manual/ depois que staging/prod rodarem o novo migration é follow-up

### ACH-016
- titulo: Baseline migration vazio
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 3e04ec0
- commit_revisor: none
- arquivos_alterados:
  - docs/architecture/db-baseline.md
- descricao_correcao: doc com opção A (backfill via db push + pg_dump) vs B (rely on backups); decisão: B até restore drill rodar mensalmente
- observacoes: parcial — backfill real do baseline é follow-up opcional

### ACH-017
- titulo: DLQ sem rotação nem alerta
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 7c94936
- commit_revisor: none
- arquivos_alterados:
  - apps/worker/src/processors/dlq-archive.ts (novo)
  - apps/worker/src/index.ts
- descricao_correcao: archiveDlqEntriesOlderThan (default 90d) + reportDlqDepth (default threshold 100); wired no worker loop com env overrides

### ACH-018
- titulo: Backup sem cron/drill
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 3e04ec0
- commit_revisor: none
- arquivos_alterados:
  - docs/architecture/backup-and-recovery.md
- descricao_correcao: doc com RPO≤1h/RTO≤4h targets; runbook mensal de restore drill; lista de follow-ups (upload remoto, PITR, CI nightly restore)
- observacoes: cron local já existia (deploy/backup/install-cron.sh); upload remoto + drill mensal são follow-ups humanos

### ACH-019
- titulo: Retenção/archive ausente
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 3e04ec0
- commit_revisor: none
- arquivos_alterados:
  - packages/db/src/archive/base-archiver.ts (novo stub)
  - docs/architecture/data-retention.md
- descricao_correcao: BaseArchiver abstract + política de retenção por entidade; primeiro archiver é follow-up

### ACH-020
- titulo: Decimal(10,2) estoura
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 310d026
- commit_revisor: none
- arquivos_alterados:
  - packages/db/prisma/schema.prisma (Sale discount/total/cashbackUsed/cashbackGenerated para Decimal(14,2))
  - packages/db/prisma/migrations/20260421000004_opportunity_enum_referral_decimals/
- descricao_correcao: ALTER COLUMN TYPE DECIMAL(14,2) em 4 colunas de Sale; superset de (10,2), sem perda de dados

### ACH-021
- titulo: Referral.onDelete assimétrico
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 310d026
- commit_revisor: none
- arquivos_alterados:
  - packages/db/prisma/schema.prisma (referred onDelete: Restrict)
  - packages/db/prisma/migrations/20260421000004_opportunity_enum_referral_decimals/
- descricao_correcao: DROP CONSTRAINT + ADD CONSTRAINT com ON DELETE RESTRICT em referredTenantId fkey

### ACH-022
- titulo: pg_stat_statements não habilitado
- severidade: baixo
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 3e04ec0
- commit_revisor: none
- arquivos_alterados:
  - deploy/postgres/init.sql (novo)
  - docs/architecture/db-observability.md
- descricao_correcao: CREATE EXTENSION no init.sql + doc com flags docker-compose (shared_preload_libraries) + query semanal + reset cadence
- observacoes: parcial — integração com Grafana / alerta mean_exec_time é follow-up
