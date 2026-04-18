# Relatório Final da Auditoria

## Identificação
- dominio: dados-persistencia
- run_id: 2026-04-18_23-03-36
- status_run: ready_for_finalize
- iniciado_em: 2026-04-18 23:03:36
- finalizado_em: none
- ultima_atualizacao: 2026-04-18 23:20:00

## Objetivo da Run
Avaliar a camada de dados do WBC Platform (PostgreSQL + Prisma 6 + Redis/BullMQ + outbox) em integridade, concorrência, índices, migrations e recuperação.

## Escopo Executado
- `packages/db/prisma/schema.prisma` — 48 models
- Middleware multi-tenant (`TENANT_SCOPED_MODELS`)
- Migrations automáticas e manuais (inclui `001_rls_policies.sql`, `auth_v2_schema.sql`)
- Adapters Prisma em packages/business/**/adapters/prisma-*.ts
- Workers: outbox-processor, outbox-cleanup, dlq-scanner, sale-confirmed-handler
- Scripts de deploy/backup (`deploy/backup/backup.sh`, `restore.sh`)
- `docs/DEPLOYMENT.md`

## Escopo Nao Coberto ou Parcial
- `EXPLAIN ANALYZE` em queries representativas
- Schema drift efetivo em staging/prod
- Validação empírica de RLS com duas conexões concorrentes
- Performance de agregações (cross-ref `performance-escalabilidade`)

## Resumo Executivo
A camada de dados do WBC tem fundação robusta — schema rico, multi-tenant via middleware Prisma + RLS no Postgres, Serializable isolation em cashback. Porém, a run identificou 2 achados críticos e 8 altos que tornam a postura insegura para produção com carga real: o fluxo de confirmar venda publica evento sem envolver baixa de estoque em transação; `claimPending` do outbox é racy; handlers não são idempotentes; incrementos de quotas não têm lock/version; RLS não tem teste automatizado em CI; 10+ modelos não possuem índice em caminhos críticos; migrations manuais não passam pelo workflow do Prisma e o baseline é vazio; backup não tem cron automatizado nem drill de restore. Avaliação geral: `preocupante`.

## Principais Achados
1. ACH-001 (critico) confirmSale sem tx de estoque
2. ACH-002 (critico) claimPending sem FOR UPDATE SKIP LOCKED
3. ACH-003 (alto) incrementos sem lock/version
4. ACH-004 (alto) RLS sem teste de isolamento
5. ACH-005 (alto) 10+ modelos sem índice
6. ACH-011 (alto) handlers não idempotentes
7. ACH-012 (alto) cashback sem idempotencyKey
8. ACH-015 (alto) migrations manuais fora do workflow Prisma
9. ACH-018 (alto) backup sem cron/drill
10. ACH-017 (medio) DLQ sem rotação/alerta

## Distribuicao por Severidade
- critico: 2
- alto: 8
- medio: 9
- baixo: 3
- informativo: 0

## Riscos Prioritarios
1. Overselling em confirmSale (ACH-001 + ACH-011)
2. Duplicidade em retry do outbox (ACH-002 + ACH-011 + ACH-012)
3. Leak cross-tenant silencioso por regressão de RLS (ACH-004 + ACH-015)
4. Queries lentas em tenants grandes (ACH-005 + ACH-013)
5. DR não validado (ACH-018)
6. Evolução de schema desordenada (ACH-015 + ACH-016)

## Recomendacoes Prioritarias
1. Transação Serializable englobando confirmSale + baixa de estoque; publicar evento no mesmo tx (ACH-001).
2. `$queryRaw` atômico com `FOR UPDATE SKIP LOCKED` em claimPending (ACH-002).
3. Handlers idempotentes via tabela `processed_events` (ACH-011, ACH-012).
4. Suite CI de isolamento multi-tenant com RLS (ACH-004).
5. Migration adicionando índices em Sale, SaleItem, Return, PostSaleFlow, BrandOrder, Sample, CommunityTemplate, QuickReply, Team, TeamMember, TeamTask, Delivery, GiftSuggestor (ACH-005, ACH-013).
6. Converter migrations `manual/` em `prisma migrate`, gerar baseline real, `prisma migrate status/deploy` no CI/CD (ACH-015, ACH-016).
7. Automatizar backup com cron + storage remoto + drill mensal; RPO/RTO documentados (ACH-018).
8. Política de retenção e archive; alerta DLQ ≥100 FAILED (ACH-017, ACH-019).
9. Corrigir integridade: Brand unique, CHECK em Sale.total, enum em Opportunity.status, ampliar Decimal(14,2), uniformizar onDelete em Referral (ACH-006, ACH-007, ACH-009, ACH-020, ACH-021).
10. Soft-delete uniforme e composition root para PrismaClient (ACH-008, ACH-010).

## Avaliacao Geral do Dominio
- avaliacao: preocupante

Justificativa: boas fundações, mas concorrência/outbox e ausência de índices/drill criam risco alto para operação em escala.

## Prontidao para Encerramento
- pronto_para_finalizar: sim
- justificativa: 7 fases concluídas; 22 achados consolidados; sem bloqueios.

## Observacoes Finais
- ACH-002, ACH-011, ACH-012 se conectam com ACH-001 de `apis-integracoes` (idempotência).
- ACH-004 toca `compliance-privacidade` e `testes-qualidade`.
- ACH-005/013 alimentam `performance-escalabilidade`.
- ACH-015/016/018 alimentam `infraestrutura-deploy-config`.
- ACH-017/019 alimentam `observabilidade-operacao` e `custos-finops`.
