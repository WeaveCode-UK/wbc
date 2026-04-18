# Achados da Auditoria

## Identificação
- dominio: dados-persistencia
- run_id: 2026-04-18_23-03-36
- ultima_atualizacao: 2026-04-18 23:20:00

## Regras de Registro
- Registrar apenas achados reais com evidência observável.
- Não registrar opinião vaga sem base no repositório.
- Cada achado deve ter ID único dentro da run.
- Cada achado deve ter severidade definida.

## Severidades Permitidas
- critico · alto · medio · baixo · informativo

## Status Permitidos
- aberto · confirmado · mitigado · resolvido · aceito · nao_aplicavel

## Achados Registrados

### ACH-001
- titulo: `confirmSale` publica evento sem validar estoque na mesma transação
- severidade: critico
- categoria: transacao-e-consistencia
- status: confirmado
- resumo: O use-case `confirmSale` muda o status da venda e publica `SALE_CONFIRMED` no outbox; o handler assíncrono (`sale-confirmed-handler`) é quem decrementa estoque. Se o handler falhar, a venda fica CONFIRMED sem baixar estoque — overselling garantido.

#### Evidencia
- arquivo_ou_area: packages/business/sales/use-cases/confirm-sale.ts:9-43; packages/business/inventory/handlers/sale-confirmed-handler.ts
- detalhe: Sem `prisma.$transaction` englobando validação de estoque + confirmação

#### Impacto
- tecnico: Divergência entre Postgres e realidade operacional
- negocio: Venda confirmada sem produto; reclamação de cliente e risco fiscal

#### Recomendacao
- acao_sugerida: Englobar confirmação + dedução de estoque em `prisma.$transaction({ isolationLevel: 'Serializable' })`; só então publicar evento via outbox no mesmo tx
- prioridade: alta

---

### ACH-002
- titulo: `claimPending` do outbox sem `FOR UPDATE SKIP LOCKED`
- severidade: critico
- categoria: transacao-e-consistencia
- status: confirmado
- resumo: `PrismaOutboxRepository.claimPending` executa `findMany` seguido de `updateMany`. Dois workers concorrentes podem reclamar o mesmo batch e processar o mesmo evento duas vezes.

#### Evidencia
- arquivo_ou_area: packages/db/src/outbox/prisma-outbox-repository.ts:35-60
- detalhe: Janela entre SELECT e UPDATE permite race

#### Impacto
- tecnico: Duplicidade de ações
- negocio: Impacto financeiro direto em multi-worker

#### Recomendacao
- acao_sugerida: `$queryRaw` atômico com `FOR UPDATE SKIP LOCKED`; ou colunas `claimedBy/claimedAt` com CAS
- prioridade: alta

---

### ACH-003
- titulo: Incrementos concorrentes sem lock nem version field
- severidade: alto
- categoria: concorrencia
- status: confirmado
- resumo: `Subscription.aiGenerationsUsed` e `Campaign.stats*` usam `{ increment: 1 }` fora de transação isolada. Validação prévia de limite (ex.: quota ESSENTIAL/PRO) pode ser bypassada.

#### Evidencia
- arquivo_ou_area: packages/business/auth/adapters/prisma-subscription-repository.ts:44; schema.prisma (Campaign stats)
- detalhe: Sem campo `version` nem `$transaction`

#### Impacto
- tecnico: Lost updates e bypass de quota
- negocio: Abuso de plano; métricas imprecisas

#### Recomendacao
- acao_sugerida: Transação Serializable com read-modify-write; ou optimistic locking (`version Int`)
- prioridade: alta

---

### ACH-004
- titulo: RLS presente mas sem teste automatizado de isolamento
- severidade: alto
- categoria: multi-tenant
- status: confirmado
- resumo: `packages/db/prisma/migrations/manual/001_rls_policies.sql` cria policies restritivas. Não há teste em CI que valide o isolamento — uma regressão silenciosa pode eliminá-lo.

#### Evidencia
- arquivo_ou_area: packages/db/prisma/migrations/manual/001_rls_policies.sql; .github/workflows/ci.yml
- detalhe: Sem suite de regressão

#### Impacto
- tecnico: Leak cross-tenant sem detecção
- negocio: Risco LGPD

#### Recomendacao
- acao_sugerida: Suite CI que popula dois tenants e verifica isolamento com e sem middleware
- prioridade: alta

---

### ACH-005
- titulo: 10+ modelos sem índice em caminhos críticos
- severidade: alto
- categoria: indices-e-queries
- status: confirmado
- resumo: Modelos sem @@index em campos de tenant ou em FKs frequentes: SaleItem(saleId), Return(saleId), PostSaleFlow(saleId), BrandOrder(tenantId,status), BrandOrderItem(brandOrderId), Sample(tenantId,clientId), CommunityTemplate(tenantId), QuickReply(tenantId), Team(tenantId), TeamMember(teamId,memberId), TeamTask(teamId,memberId), Delivery(tenantId,status), GiftSuggestor(tenantId,clientId).

#### Evidencia
- arquivo_ou_area: packages/db/prisma/schema.prisma
- detalhe: Full-table-scan em queries frequentes

#### Impacto
- tecnico: Latência cresce com N
- negocio: UX deteriora em tenants grandes

#### Recomendacao
- acao_sugerida: Migration adicionando índices; `EXPLAIN ANALYZE` antes do deploy
- prioridade: alta

---

### ACH-006
- titulo: `Sale.total` calculado na aplicação sem CHECK constraint
- severidade: medio
- categoria: integridade
- status: confirmado

#### Evidencia
- arquivo_ou_area: packages/business/sales/adapters/prisma-sale-repository.ts:81-82

#### Impacto
- tecnico: Drift entre `total` e soma dos itens
- negocio: Faturamento incorreto

#### Recomendacao
- acao_sugerida: CHECK (`total >= 0`); teste diário de reconciliação
- prioridade: media

---

### ACH-007
- titulo: `Brand` sem `@unique(name)` e sem `@@index`
- severidade: medio
- categoria: integridade
- status: confirmado

#### Evidencia
- arquivo_ou_area: schema.prisma (Brand)

#### Impacto
- tecnico: Duplicatas; relatórios incoerentes
- negocio: Catálogo poluído

#### Recomendacao
- acao_sugerida: `@unique name` + `@@index([name])`; merge de duplicatas existentes
- prioridade: media

---

### ACH-008
- titulo: Soft-delete incoerente entre modelos
- severidade: medio
- categoria: integridade-e-evolucao
- status: confirmado

#### Evidencia
- arquivo_ou_area: schema.prisma (apenas TenantMember com deletedAt); repositórios

#### Impacto
- tecnico: Semântica confusa
- negocio: LGPD / retenção

#### Recomendacao
- acao_sugerida: Política global (hard delete + archive ou soft delete com middleware)
- prioridade: media

---

### ACH-009
- titulo: `Opportunity.status` é String livre em vez de enum
- severidade: baixo
- categoria: integridade

#### Evidencia
- arquivo_ou_area: schema.prisma (Opportunity)

#### Impacto
- tecnico: Valores malformados possíveis
- negocio: Métricas de pipeline erradas

#### Recomendacao
- acao_sugerida: Enum `OpportunityStatus` + migração de dados
- prioridade: baixa

---

### ACH-010
- titulo: `PrismaClient` global; adapters não recebem client por construtor
- severidade: medio
- categoria: evolucao-e-testabilidade
- status: confirmado

#### Evidencia
- arquivo_ou_area: packages/db/src/index.ts; packages/business/**/adapters/prisma-*.ts

#### Impacto
- tecnico: Dificulta evolução de schema e testes

#### Recomendacao
- acao_sugerida: Composition root; ver ACH-003 codigo-manutenibilidade
- prioridade: media

---

### ACH-011
- titulo: Handlers do outbox não são idempotentes
- severidade: alto
- categoria: transacao-e-consistencia

#### Evidencia
- arquivo_ou_area: packages/business/**/handlers/*.ts

#### Impacto
- tecnico: Dupla execução em retry
- negocio: Estoque, cashback, envio de msg duplicados

#### Recomendacao
- acao_sugerida: Tabela `processed_events(event_id PK)` + insert no mesmo tx; conflict = no-op
- prioridade: alta

---

### ACH-012
- titulo: Cashback usa Serializable mas sem `idempotencyKey`
- severidade: alto
- categoria: integridade-financeira

#### Evidencia
- arquivo_ou_area: packages/business/sales/adapters/prisma-cashback-repository.ts:44-67

#### Impacto
- tecnico: Consumo duplicado em retry
- negocio: Perda financeira

#### Recomendacao
- acao_sugerida: Campo `usedByIdempotencyKey`; conflito = no-op
- prioridade: alta

---

### ACH-013
- titulo: Sem `@@index([tenantId, status, createdAt])` em `Sale`
- severidade: medio
- categoria: indices-e-queries

#### Evidencia
- arquivo_ou_area: schema.prisma (Sale); analytics adapters

#### Impacto
- tecnico: Dashboard lento
- negocio: UX em horário de pico

#### Recomendacao
- acao_sugerida: Índice composto; monitorar `pg_stat_statements`
- prioridade: media

---

### ACH-014
- titulo: Queries redundantes de validação de tenant em repositórios
- severidade: baixo
- categoria: performance-de-persistencia

#### Evidencia
- arquivo_ou_area: packages/business/clients/adapters/prisma-tag-repository.ts:32-39

#### Impacto
- tecnico: RTT extra em operações frequentes

#### Recomendacao
- acao_sugerida: Consolidar em create + tratamento P2003/P2025
- prioridade: baixa

---

### ACH-015
- titulo: Migrations em `manual/` não integradas ao workflow Prisma
- severidade: alto
- categoria: evolucao-de-schema

#### Evidencia
- arquivo_ou_area: packages/db/prisma/migrations/manual/*; .github/workflows/ci.yml

#### Impacto
- tecnico: Drift silencioso entre ambientes
- negocio: Segurança (RLS) e features podem estar ausentes em staging/prod

#### Recomendacao
- acao_sugerida: Converter manuais em migrations `prisma`; `prisma migrate deploy` no pipeline
- prioridade: alta

---

### ACH-016
- titulo: Baseline migration vazio — schema inicial via `db push`
- severidade: medio
- categoria: evolucao-de-schema

#### Evidencia
- arquivo_ou_area: packages/db/prisma/migrations/0_baseline/migration.sql

#### Impacto
- tecnico: Não reconstruir banco do zero

#### Recomendacao
- acao_sugerida: Gerar baseline real com `prisma migrate dev`; testar em staging
- prioridade: media

---

### ACH-017
- titulo: DLQ do outbox sem rotação nem alerta
- severidade: medio
- categoria: ciclo-de-vida

#### Evidencia
- arquivo_ou_area: apps/worker/src/processors/{outbox-cleanup,dlq-scanner}.ts

#### Impacto
- tecnico: Crescimento silencioso
- negocio: Falhas críticas não notadas

#### Recomendacao
- acao_sugerida: Alerta ≥100 FAILED; archive após 90d; painel Grafana
- prioridade: media

---

### ACH-018
- titulo: Backup existe mas sem cron nem restore drill
- severidade: alto
- categoria: recuperacao

#### Evidencia
- arquivo_ou_area: deploy/backup/backup.sh, restore.sh; docs/DEPLOYMENT.md:65-76

#### Impacto
- tecnico: RPO/RTO desconhecidos
- negocio: Continuidade em incidente comprometida

#### Recomendacao
- acao_sugerida: Cron; upload remoto; drill mensal; documentar RPO≤1h e RTO≤4h
- prioridade: alta

---

### ACH-019
- titulo: Sem política de retenção/archive para dados antigos
- severidade: medio
- categoria: ciclo-de-vida

#### Evidencia
- arquivo_ou_area: ausência de workers de archive; apenas outbox tem cleanup de PROCESSED

#### Impacto
- tecnico: Disco cresce; backups maiores; índices degradam
- negocio: Custo sobe, performance cai

#### Recomendacao
- acao_sugerida: Retenção por entidade + worker de archive para S3/GCS
- prioridade: media

---

### ACH-020
- titulo: `Decimal(10,2)` em campos de agregação pode estourar
- severidade: baixo
- categoria: integridade

#### Evidencia
- arquivo_ou_area: schema.prisma (vários Decimal(10,2))

#### Impacto
- tecnico: Overflow em agregados grandes

#### Recomendacao
- acao_sugerida: `Decimal(14,2)` em campos usados em consolidações
- prioridade: baixa

---

### ACH-021
- titulo: `onDelete` assimétrico em `Referral` (Restrict vs SetNull)
- severidade: medio
- categoria: integridade

#### Evidencia
- arquivo_ou_area: schema.prisma (Referral)

#### Impacto
- tecnico: Queries precisam IS NOT NULL; dangling referrals
- negocio: Métricas de indicação distorcidas

#### Recomendacao
- acao_sugerida: Uniformizar (`Restrict` em ambos)
- prioridade: baixa

---

### ACH-022
- titulo: Sem `pg_stat_statements` habilitado
- severidade: baixo
- categoria: observabilidade-de-persistencia

#### Evidencia
- arquivo_ou_area: docker-compose.prod.yml (Postgres sem extension); ausência de script de coleta

#### Impacto
- tecnico: Decisões de índice no escuro

#### Recomendacao
- acao_sugerida: Habilitar extension; snapshot semanal
- prioridade: baixa
