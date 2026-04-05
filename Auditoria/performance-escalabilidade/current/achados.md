# Achados da Auditoria

## Identificacao
- dominio: performance-escalabilidade
- run_id: 2026-04-05_18-00-00
- ultima_atualizacao: 2026-04-05 18:30:00

## Severidades Permitidas
- critico, alto, medio, baixo, informativo

## Status Permitidos
- aberto, confirmado, mitigado, resolvido, aceito, nao_aplicavel

## Achados Registrados

### ACH-PE-001
- titulo: Redis cache com graceful degradation no analytics
- severidade: informativo
- categoria: caching
- status: confirmado
- resumo: O analytics router implementa cache Redis com TTL de 300s para dashboard e 180s para sales stats. O cache helper (cache.ts) tem graceful degradation: falhas de leitura/escrita sao logadas e ignoradas, sem impactar a request.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/analytics.ts:13-19, apps/api/src/lib/cache.ts
- detalhe: `cacheGet/cacheSet` wrapped em try/catch. Cache TTL constants: SHORT(60s), MEDIUM(300s), LONG(900s).

#### Impacto
- tecnico: Reduz carga no DB para queries pesadas. Cache failure nao derruba o servico.
- negocio: Dashboard responsivo.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-PE-002
- titulo: BullMQ para ABC recalculation e campaigns
- severidade: informativo
- categoria: background-processing
- status: confirmado
- resumo: Operacoes pesadas como recalculate ABC sao enfileiradas via BullMQ (wbc:analytics queue) em vez de executadas sincronamente. Campaigns tambem usam queue dedicada (wbc:campaigns).

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/analytics.ts:45-48, apps/api/src/lib/queues.ts
- detalhe: 3 queues: wbc:analytics, wbc:campaigns, wbc:messaging. Lazy initialization com singletons.

#### Impacto
- tecnico: API nao bloqueia em operacoes pesadas.
- negocio: UX fluida, processamento em background.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-PE-003
- titulo: paginatedQuery helper previne fetch de tabelas inteiras
- severidade: informativo
- categoria: queries
- status: confirmado
- resumo: O helper paginatedQuery de @wbc/shared e usado em todos os endpoints de listagem, garantindo limit/offset e evitando findMany sem limit.

#### Evidencia
- arquivo_ou_area: packages/business/clients/adapters/prisma-client-repository.ts:31, apps/api/src/routers/clients.ts:27
- detalhe: paginationSchema exige page e limit com defaults e maximos.

#### Impacto
- tecnico: Previne queries que retornam milhares de registros.
- negocio: Performance previsivel.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-PE-004
- titulo: cacheInvalidatePattern usa KEYS que nao escala
- severidade: medio
- categoria: caching
- status: confirmado
- resumo: O metodo cacheInvalidatePattern em cache.ts usa `redis.keys(pattern)` para encontrar chaves e depois `redis.del`. O comando KEYS bloqueia o Redis e tem complexidade O(N) sobre todas as chaves, nao adequado para producao com muitas chaves.

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/cache.ts:42-51
- detalhe: `const keys = await redis.keys(prefixKey(pattern)); if (keys.length > 0) await redis.del(...keys);`

#### Impacto
- tecnico: KEYS pode causar latencia no Redis sob carga alta.
- negocio: Lentidao geral do sistema se Redis ficar bloqueado.

#### Recomendacao
- acao_sugerida: Substituir KEYS por SCAN com cursor para invalidacao incremental, ou usar estrategia de prefix-based invalidation com TTL.
- prioridade: media

---

### ACH-PE-005
- titulo: Connection pooling configurado no Docker Compose
- severidade: informativo
- categoria: database
- status: confirmado
- resumo: As connection strings no docker-compose.prod.yml incluem `connection_limit=20&pool_timeout=10` para web e `connection_limit=5&pool_timeout=10` para worker, diferenciando a carga.

#### Evidencia
- arquivo_ou_area: docker-compose.prod.yml:48, :70
- detalhe: Web: connection_limit=20. Worker: connection_limit=5.

#### Impacto
- tecnico: Pool sizing adequado para VPS single-server.
- negocio: nenhum impacto direto.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-PE-006
- titulo: Redis configurado com maxmemory e eviction policy
- severidade: informativo
- categoria: caching
- status: confirmado
- resumo: Redis no docker-compose.prod.yml configurado com `--maxmemory 256mb --maxmemory-policy allkeys-lru`, adequado para cache com eviction automatico.

#### Evidencia
- arquivo_ou_area: docker-compose.prod.yml:26
- detalhe: `redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 256mb --maxmemory-policy allkeys-lru`

#### Impacto
- tecnico: Redis nao consome memoria indefinidamente.
- negocio: nenhum impacto direto.

#### Recomendacao
- acao_sugerida: Nenhuma para MVP. Monitorar hit rate quando em producao.
- prioridade: nenhuma

---

### ACH-PE-007
- titulo: Indices compostos tenantId-first otimizados para queries multi-tenant
- severidade: informativo
- categoria: database
- status: confirmado
- resumo: Todos os indices relevantes usam tenantId como primeiro campo do indice composto (ex: @@index([tenantId, status])), o que e eficiente para queries filtradas por tenant.

#### Evidencia
- arquivo_ou_area: packages/db/prisma/schema.prisma
- detalhe: Client, Sale, Campaign, Expense, Appointment, Reminder, Opportunity todos tem indices com tenantId como prefixo.

#### Impacto
- tecnico: Query planner pode usar indice eficientemente para tenant-scoped queries.
- negocio: nenhum impacto direto.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma
