# Progresso da Correção

## Identificação
- dominio: dados-persistencia
- run_id: 2026-04-18_23-03-36
- branch: fix/dados-persistencia/2026-04-18_23-03-36
- data_inicio: 2026-04-21 00:35:00
- ultima_atualizacao: 2026-04-21 00:35:00
- fase_atual: executor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 22
- corrigidos_executor: 0
- revisados_revisor: 0
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 0
- nao_aprovados: 0
- pendentes: 22

## Achados

### ACH-001
- titulo: confirmSale publica evento sem validar estoque na mesma transação
- severidade: critico
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-002
- titulo: claimPending do outbox sem FOR UPDATE SKIP LOCKED
- severidade: critico
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-003
- titulo: Increments concorrentes sem lock nem version field
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-004
- titulo: RLS presente mas sem teste automatizado de isolamento
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-005
- titulo: 10+ modelos sem índice em caminhos críticos
- severidade: alto
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-006
- titulo: Sale.total calculado na aplicação sem CHECK constraint
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-007
- titulo: Brand sem @unique(name) e sem @@index
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-008
- titulo: Soft-delete incoerente entre modelos
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-009
- titulo: Opportunity.status é String livre em vez de enum
- severidade: baixo
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-010
- titulo: PrismaClient global; adapters não recebem client por construtor
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-011
- titulo: Handlers do outbox não são idempotentes
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-012
- titulo: Cashback usa Serializable mas sem idempotencyKey
- severidade: alto
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-013
- titulo: Sem @@index([tenantId, status, createdAt]) em Sale
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-014
- titulo: Queries redundantes de validação de tenant em repositórios
- severidade: baixo
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-015
- titulo: Migrations em manual/ não integradas ao workflow Prisma
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-016
- titulo: Baseline migration vazio — schema inicial via db push
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-017
- titulo: DLQ do outbox sem rotação nem alerta
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-018
- titulo: Backup existe mas sem cron nem restore drill
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-019
- titulo: Sem política de retenção/archive para dados antigos
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-020
- titulo: Decimal(10,2) em campos de agregação pode estourar
- severidade: baixo
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-021
- titulo: onDelete assimétrico em Referral
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none

### ACH-022
- titulo: Sem pg_stat_statements habilitado
- severidade: baixo
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
