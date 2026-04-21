# Relatório de Correção

## Identificação
- dominio: dados-persistencia
- run_id: 2026-04-18_23-03-36
- branch: fix/dados-persistencia/2026-04-18_23-03-36
- data_inicio: 2026-04-21 00:35:00
- data_conclusao: 2026-04-21 02:30:00
- ultima_atualizacao: 2026-04-21 02:30:00
- status: concluido

## Resumo Executivo
22/22 achados processados. 20 aprovados pelo Revisor sem alteração; 2 receberam correção adicional (ACH-015: bug herdado de `manual/002` que criava policies RLS em tabelas sem coluna `tenantId`; ACH-014: helper não-usado deixado pelo Executor). Type-check e build passaram sem tentativas adicionais (após regeneração do Prisma Client). Changeset cobre 6 migrations Prisma novas (ProcessedEvent, CashbackRedemption, indexes+constraints, optimistic_lock_versions, opportunity_enum_referral_decimals, rls_policies integrado) e várias infra/doc.

## Estatísticas
- total_achados_na_run: 22
- aprovados_para_correcao: 22
- corrigidos_pelo_executor: 22
- aprovados_pelo_revisor_sem_alteracao: 20
- corrigidos_pelo_revisor: 2
- falha_executor_resolvida_pelo_revisor: 0
- nao_corrigiveis: 0
- nao_aprovados: 0
- falha_total: 0
- taxa_de_acerto_do_executor: 91%

## Validação Técnica
- type_check: passou
- build: passou
- tentativas_de_correcao_build: 0
- bloqueio_build: nao
- erro_persistente: nenhum

## Achados Corrigidos (Executor acertou de primeira)
- ACH-001 (critico) — confirmSale atômico
- ACH-002 (critico) — claimPending SKIP LOCKED
- ACH-003 (alto) — optimistic locking
- ACH-004 (alto) — RLS test harness
- ACH-005 (alto) — índices em 11 modelos
- ACH-006 (medio) — CHECK Sale.total
- ACH-007 (medio) — Brand unique
- ACH-008 (medio) — delete policy doc
- ACH-009 (baixo) — OpportunityStatus enum
- ACH-010 (medio) — composition-root doc
- ACH-011 (alto) — ProcessedEvent + withIdempotentHandler
- ACH-012 (alto) — CashbackRedemption idempotency
- ACH-013 (medio) — Sale composite index
- ACH-016 (medio) — db-baseline doc
- ACH-017 (medio) — DLQ archive + alert
- ACH-018 (alto) — backup doc
- ACH-019 (medio) — retention framework + BaseArchiver
- ACH-020 (baixo) — Decimal(14,2)
- ACH-021 (medio) — Referral onDelete
- ACH-022 (baixo) — pg_stat_statements

## Achados Corrigidos com Intervenção do Revisor
- ACH-015 (alto) — Migrations manual/ integradas
  - discrepancia: a migração integrada herdava bug de `manual/002_rls_policies_complement.sql` que tentava aplicar `CREATE POLICY ... WHERE "tenantId" = ...` em tabelas sem coluna `tenantId` (post_sale_flows, deliveries, team_members, team_tasks, referrals). Postgres valida colunas em tempo de `CREATE POLICY`, então `prisma migrate deploy` em ambiente fresh quebraria.
  - correcao_revisor (commit 2129c82): reescrita como mapa `(tabela, expressão-tenant)` via `(VALUES ...)`, com subquery ao pai em sales/teams e coluna real `"referrerTenantId"` para referrals.

- ACH-014 (baixo) — Queries tag-repository consolidadas
  - discrepancia: Executor deixou `function isNotFound` + linha sentinela `void isNotFound;` para silenciar warning de unused. Função não é chamada em nenhum lugar.
  - correcao_revisor (commit d56a895): removido helper + linha sentinela; mantido apenas `isFKViolation`.

## Achados Parciais (requerem validação humana)
- ACH-003 — Campaign stats (viewed/replied/sales) ainda usam `{ increment: 1 }` sem CAS; migração para `optimisticUpdate` helper é follow-up
- ACH-004 — test harness só valida tabela `clients`; extensão para outras 18 tabelas + integração CI + considerar `FORCE ROW LEVEL SECURITY` no owner são follow-ups
- ACH-008 — política de hard-delete documentada; aplicação em código (se surgir novo soft-delete) é follow-up
- ACH-010 — refactor de adapters para `constructor(prisma: PrismaClient)` é follow-up até primeiro integration test
- ACH-011 — helper + table disponíveis; aplicação em cada handler de negócio é follow-up
- ACH-015 — delete da pasta `manual/` depois que staging/prod rodem nova migration é follow-up
- ACH-016 — backfill do baseline via Option A (pg_dump + checksum) é follow-up opcional
- ACH-018 — upload remoto do backup + drill mensal + PITR são follow-ups humanos/infra
- ACH-019 — primeiro archiver concreto (NotificationArchiver) + cold store (S3) é follow-up
- ACH-022 — integração com Grafana / Alertmanager rule para mean_exec_time é follow-up

## Achados Não Corrigíveis
Nenhum.

## Achados Não Aprovados pelo Usuário
Nenhum.

## Achados com Falha Total
Nenhum.

## Commits Gerados

### Inicialização (1)
- 6e9580a — chore(auditoria): inicializar correção da run 2026-04-18_23-03-36 do domínio dados-persistencia

### Fase Executor (22 achados em 12 commits)
- 3abb596 — fix(auditoria): ACH-002 — claimPending com FOR UPDATE SKIP LOCKED
- a2203d0 — fix(auditoria): ACH-011 — ProcessedEvent table + withIdempotentHandler helper
- d4e80aa — fix(auditoria): ACH-012 — CashbackRedemption table para idempotency em use()
- e512d26 — fix(auditoria): ACH-001 — confirmSale atômico (Serializable tx cobre sale+cashback+stock+outbox)
- c420da8 — fix(auditoria): ACH-005/006/007/013 — índices + CHECK total + Brand unique
- 4975d2e — fix(auditoria): ACH-003 — optimistic locking (version field + helper + incrementAIUsage)
- 310d026 — fix(auditoria): ACH-009/020/021 — OpportunityStatus enum, Decimal(14,2), Referral onDelete uniforme
- 73a973d — fix(auditoria): ACH-004 — test harness RLS isolation + doc CI workflow
- fdfedc1 — fix(auditoria): ACH-015 — migrations manual/ integradas ao pipeline Prisma
- 32ce86b — fix(auditoria): ACH-014 — consolida queries de validação em prisma-tag-repository
- 7c94936 — fix(auditoria): ACH-017 — DLQ archive (>90d) + depth alert (>100 threshold)
- 3e04ec0 — fix(auditoria): ACH-008/010/016/018/019/022 — docs + stubs para backup/retenção/baseline/obs

### Transição (1)
- e5f69c8 — chore(auditoria): fase executor concluída — transição para revisor (dados-persistencia)

### Fase Revisor (2 review-fix)
- 2129c82 — review-fix(auditoria): ACH-015 — per-table tenant expression no migration RLS integrado
- d56a895 — review-fix(auditoria): ACH-014 — remove helper isNotFound não usado

### Finalização (1)
- be4a31f — chore(auditoria): atualizar progresso revisor (dados-persistencia)

Total: 17 commits.

## Merge
- status_merge: pendente
- branch_origem: fix/dados-persistencia/2026-04-18_23-03-36
- branch_destino: main
- aprovado_por_usuario: nao
