# ADR-008: Worker Scaling & Job Affinity

- **Status:** proposto (aguardando decisões humanas — ACH-013 da auditoria de arquitetura)
- **Data:** 2026-04-18

## Contexto

O app `apps/worker` é um container Node separado que roda 5 workers BullMQ (messaging, campaigns, schedule, analytics, dlq) + outbox processor + cleanup + DLQ scanner. No MVP atual, existe **uma única instância** do container.

A auditoria de arquitetura (ACH-013) registrou o gap: a separação API/Worker em containers distintos permite escala independente, mas não há documento ou decisão explícita sobre:

- Como escalar horizontalmente (mais instâncias do worker).
- Se usar um worker pool global ou workers especializados por tipo de job.
- Estratégia de job affinity / particionamento (ex: por tenant).
- Limites de pool Prisma quando há N workers.
- Multi-region (se/quando expandir).

## Decisões (placeholders — aguardando validação)

### 1. Modelo de pool

> **Decisão pendente.** Duas opções:

**Opção A — Worker pool global (simples)**

Cada instância do container `apps/worker` roda **todos os 5 workers BullMQ**. Escalar = subir N instâncias idênticas. BullMQ distribui jobs entre consumers via Redis.

- ✅ Simples: 1 Dockerfile, 1 imagem, 1 deployment.
- ✅ Balanceamento automático via BullMQ.
- ⚠️ Se um job type tiver carga desbalanceada, capacidade ociosa dos outros workers.

**Opção B — Workers especializados por tipo**

Dockerfiles separados: `Dockerfile.worker.messaging`, `Dockerfile.worker.analytics`, etc. Cada container roda apenas 1 tipo de worker. Escala independente por tipo.

- ✅ Escala proporcional à carga de cada tipo.
- ✅ Falha isolada (DLQ não afeta messaging).
- ⚠️ Mais deployments para gerenciar.

**Sugestão default:** A até 10k events/dia; migrar para B quando um tipo específico monopolizar >70% da carga.

### 2. Job affinity

> **Decisão pendente.** Jobs atuais não têm affinity — qualquer worker pega qualquer job do tenant.

Opções para o futuro:

- **Por tenant:** jobs do tenant X sempre vão para worker X (sticky). Útil para cache quente por worker. Implementa via prefixo de queue.
- **Por tipo de dado:** jobs de inventory sempre no mesmo worker para reduzir contenção de locks em produtos.
- **Nenhuma (default):** mantém simplicidade; BullMQ distribui round-robin.

**Sugestão default:** nenhuma até observar contenção ou cache-miss relevante.

### 3. Connection pool Prisma por worker

Hoje: `connection_limit=5` no worker, `connection_limit=20` na API.

- Se escalar para N workers, pool total = `N * 5` conexões Postgres. Com `N=10`, 50 conexões só do worker — dentro do limite default do Postgres (100) mas aperta.
- **Critério:** revisar `connection_limit` para `max(3, 20/N)` se `N >= 5`. Documentar.

### 4. Particionamento de queue

Para volumes altos (>100k events/dia), BullMQ permite sharding nativo via múltiplas queues. Exemplo:

- `wbc:messaging:shard0`, `wbc:messaging:shard1`, ... com hash(tenantId) escolhendo shard.
- Cada worker assina um subset de shards.

**Sugestão:** não implementar até observar throughput < demanda.

### 5. Multi-region

Fora do escopo do MVP. Requer:

- Redis multi-region com replicação (ou 1 cluster por região + eventual consistency).
- Postgres com replicação ou particionamento geográfico.
- Affinity de tenant para região (latência).

**Decisão:** reavaliar quando houver tenants fora do Brasil e latência virar SLO.

## Cenários de escala sugeridos (baseline)

| Carga estimada | Instâncias worker | Connection pool por worker | Shards | Observações                              |
| -------------- | ----------------- | -------------------------- | ------ | ---------------------------------------- |
| Até 10k ev/dia | 1 (MVP atual)     | 5                          | 1      | Single-container                         |
| 10k–50k        | 2–3               | 5                          | 1      | Escalar horizontal via compose           |
| 50k–200k       | 4–8               | 3                          | 1      | Revisar pool; talvez migrar para Opção B |
| > 200k         | 10+               | 3                          | 2+     | Avaliar Opção B + particionamento        |

## Métricas para gatilho de escala

Do health endpoint do worker (`:9100/health/ready`, ACH-011):

- `outboxLagMs` > 60s sustentado → aumentar número de workers.
- `queueDepths[*]` crescendo > threshold → escalar o tipo específico.

Do Prometheus (quando expor métricas):

- CPU > 70% sustentado.
- Memory > 80%.

## Consequências

### Se mantiver MVP (1 instância):

- Simplicidade máxima. Bom até volume justificar.
- SPOF: se o worker cair, outbox cresce até readiness degradar (ACH-011 já deteta).

### Se adotar Opção A (N instâncias idênticas):

- Scaling linear até gargalo do Redis/Postgres.
- Redeploy coordenado (todas instâncias baixam ao mesmo tempo se usar `restart: always`).

### Se adotar Opção B (workers especializados):

- Mais fine-grained scaling.
- Mais deployments; CI/CD mais complexo.
- Cada worker menor consome menos RAM.

## Decisões pendentes

- [ ] Aprovar Opção A ou B como baseline.
- [ ] Definir gatilhos concretos para escalar (SLO de `outboxLagMs`).
- [ ] Decidir se manter `connection_limit` fixo ou derivado de N.
- [ ] Atualizar este ADR para `aceito` após validação.

## Links

- ADR-003 — Outbox Pattern + BullMQ
- ADR-007 — Resilience Strategies
- `docs/DEPLOYMENT.md` — topologia atual
- `apps/worker/src/health-server.ts` — métricas de lag e queue depths (ACH-011)
- ACH-013 — Auditoria de arquitetura
