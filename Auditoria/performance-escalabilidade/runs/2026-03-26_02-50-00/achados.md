# Achados da Auditoria

## Identificação
- dominio: performance-escalabilidade
- run_id: 2026-03-26_02-50-00
- ultima_atualizacao: 2026-03-26 03:10:00

## Achados Registrados

### ACH-001
- titulo: N+1 critico em ABC classification — loop de 1000+ UPDATE queries individuais
- severidade: alto
- categoria: eficiencia de dados
- status: confirmado
- resumo: calculateABCClassification carrega todos os clientes com sales incluidas, ordena em JS, e depois faz loop com prisma.client.update individual para cada cliente. Para 1000 clientes = 1001 queries (1 select + 1000 updates).

#### Evidencia
- arquivo_ou_area: packages/business/analytics/use-cases/get-stats.ts linhas 65-101
- detalhe: findMany com include: { sales } carrega todos, sort em JS, loop for com await prisma.client.update({ where: { id } }) individual.

#### Impacto
- tecnico: Operacao extremamente custosa. Pode levar minutos com base crescente. Bloqueia thread da API.
- negocio: Dashboard de analytics lento. Classificacao ABC impraticavel para tenants com muitos clientes.

#### Recomendacao
- acao_sugerida: Substituir loop por updateMany ou raw query de UPDATE com CASE WHEN. Usar aggregate() para calcular totais no banco ao inves de carregar sales em memoria.
- prioridade: alta

#### Observacoes
- none

---

### ACH-002
- titulo: Sales stats carrega todos os registros do mes em memoria para agregar em JS
- severidade: alto
- categoria: eficiencia de dados
- status: confirmado
- resumo: getSalesStats faz findMany de TODAS as vendas do mes com include: { items, client } e depois agrega (count, sum, reduce) em JavaScript. Deveria usar Prisma aggregate() ou groupBy().

#### Evidencia
- arquivo_ou_area: packages/business/analytics/use-cases/get-stats.ts linhas 7-14
- detalhe: prisma.sale.findMany com include items+client, seguido de sales.length, sales.reduce(sum total).

#### Impacto
- tecnico: Tenant com 10.000 vendas/mes carrega tudo em memoria. Risco de OOM. Latencia alta no dashboard.
- negocio: Dashboard de analytics lento e pesado.

#### Recomendacao
- acao_sugerida: Usar prisma.sale.aggregate({ _count, _sum: { total: true } }) e prisma.saleItem.groupBy() para calculos no banco.
- prioridade: alta

#### Observacoes
- none

---

### ACH-003
- titulo: Queries unbounded sem paginacao em tags, appointments e reminders
- severidade: alto
- categoria: eficiencia de dados
- status: confirmado
- resumo: listTags(), listAppointments() e listReminders() fazem findMany sem take/skip. Tenants com muitos registros carregam todos em memoria sem limite.

#### Evidencia
- arquivo_ou_area: packages/business/clients/adapters/prisma-tag-repository.ts linhas 16-18, packages/business/schedule/use-cases/manage-appointments.ts (listAppointments, listReminders)
- detalhe: prisma.tag.findMany({ where: { tenantId } }) sem take. prisma.reminder.findMany({ where }) sem take. prisma.appointment.findMany sem take.

#### Impacto
- tecnico: Risco de OOM com datasets crescentes. Respostas lentas. Payload excessivo na rede.
- negocio: App mobile pode travar ao carregar listas longas.

#### Recomendacao
- acao_sugerida: Adicionar paginacao (take/skip) com limite default de 100. Para tags, considerar cache com TTL curto.
- prioridade: alta

#### Observacoes
- none

---

### ACH-004
- titulo: Cache layer implementado mas praticamente nao utilizado
- severidade: medio
- categoria: cache e otimizacao
- status: confirmado
- resumo: apps/api/src/lib/cache.ts possui cacheGet/cacheSet/cacheInvalidate com TTLs definidos (60s, 300s, 900s), mas apenas entitlements.ts usa. Dashboard de analytics, listas de clientes e produtos nao usam cache.

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/cache.ts (implementacao completa), apps/api/src/lib/entitlements.ts (unico consumidor)
- detalhe: Grep por cacheGet/cacheSet retorna apenas 2 arquivos: cache.ts (definicao) e entitlements.ts (uso). Zero uso em routers ou use-cases.

#### Impacto
- tecnico: Queries repetidas batem no banco desnecessariamente. Dashboard analytics recalcula a cada request.
- negocio: Latencia maior que necessaria. Custo de banco mais alto.

#### Recomendacao
- acao_sugerida: Cachear analytics.getDashboard (300s), clients.list (180s), products.list (600s). Estimar 60-70% hit rate.
- prioridade: media

#### Observacoes
- cacheInvalidatePattern usa redis.keys() que e O(n) — substituir por SCAN ou pattern-based approach.

---

### ACH-005
- titulo: BullMQ queues definidas mas nao integradas — processamento sincrono no hot path
- severidade: medio
- categoria: filas e paralelismo
- status: confirmado
- resumo: 6 filas BullMQ definidas em worker/queues/index.ts mas sem processors nem job submissions. Operacoes que deveriam ser assincronas (campaigns, messaging, analytics recalculation) rodam sincronamente na API.

#### Evidencia
- arquivo_ou_area: apps/worker/src/queues/index.ts (6 filas definidas), apps/worker/src/index.ts (apenas outbox polling a cada 5s)
- detalhe: Nenhum processor registrado. Nenhum job.add() encontrado em routers ou use-cases. Outbox processor roda via setInterval, nao via BullMQ.

#### Impacto
- tecnico: Operacoes pesadas (recalcular ABC, enviar campanha) bloqueiam a thread da API. Sem retry nem DLQ.
- negocio: Latencia em endpoints que deveriam ser fire-and-forget.

#### Recomendacao
- acao_sugerida: Integrar BullMQ: mover calculateABCClassification, campaign send e message send para queues com processors dedicados.
- prioridade: media

#### Observacoes
- Overlap com achado de arquitetura (ACH-004 da run anterior). Aqui o angulo e de performance no hot path.

---

### ACH-006
- titulo: Ausencia total de monitoramento de performance — sem SLOs, metricas ou dashboards
- severidade: medio
- categoria: sinais de performance
- status: confirmado
- resumo: Nao existem SLOs, SLIs, metricas de latencia/throughput, dashboards de performance nem endpoints Prometheus. Sentry cobre apenas erros com 10% de trace sampling. Logging middleware registra duracao mas sem agregacao.

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/sentry.ts (tracesSampleRate: 0.1), apps/api/src/trpc/logging-middleware.ts (log de duracao sem agregacao)
- detalhe: Busca por "prometheus", "metrics", "slo", "sli", "datadog", "grafana" retorna zero resultados.

#### Impacto
- tecnico: Impossivel identificar degradacao de performance proativamente. Diagnostico reativo apenas.
- negocio: Problemas de performance so sao descobertos quando usuarios reclamam.

#### Recomendacao
- acao_sugerida: Adicionar metricas basicas (p50, p95, p99 latencia por endpoint). Considerar Prometheus + Grafana ou equivalent.
- prioridade: media

#### Observacoes
- none

---

### ACH-007
- titulo: Frontend web sem code splitting, dynamic imports ou otimizacao de bundle
- severidade: medio
- categoria: frontend e experiencia percebida
- status: confirmado
- resumo: next.config.mjs nao configura code splitting, dynamic imports, image optimization ou bundle analysis. Nenhum uso de next/dynamic ou React.lazy encontrado. Bundle provavelmente monolitico.

#### Evidencia
- arquivo_ou_area: apps/web/next.config.mjs (apenas transpilePackages), busca por "dynamic", "lazy", "next/image" sem resultados
- detalhe: Next.js faz code splitting automatico por rota, mas nao ha otimizacao explicita para componentes pesados ou lazy loading de features.

#### Impacto
- tecnico: Bundle inicial maior que necessario. TTI (Time to Interactive) mais lento.
- negocio: Experiencia de primeiro load prejudicada.

#### Recomendacao
- acao_sugerida: Usar next/dynamic para features pesadas (analytics charts, campaign editor). Adicionar @next/bundle-analyzer para diagnostico.
- prioridade: media

#### Observacoes
- Next.js 15 faz route-based splitting automatico, o que mitiga parcialmente.

---

### ACH-008
- titulo: Redis como instancia unica sem clustering — SPOF para cache e filas
- severidade: medio
- categoria: escalabilidade
- status: confirmado
- resumo: Redis configurado como instancia unica (redis://localhost:6379/0) sem Sentinel, Cluster ou failover. E SPOF para cache e futuras filas BullMQ.

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/redis.ts (new Redis com URL simples), docker-compose.yml (redis:7-alpine single instance)
- detalhe: maxRetriesPerRequest: 3 e retry strategy com backoff configurados, mas sem redundancia.

#### Impacto
- tecnico: Se Redis cair, cache falha e filas param. Sem failover automatico.
- negocio: Risco de indisponibilidade parcial em producao.

#### Recomendacao
- acao_sugerida: Para producao, usar Redis gerenciado com replicacao (ex: AWS ElastiCache, Redis Cloud). Configurar Sentinel ou Cluster.
- prioridade: media

#### Observacoes
- Risco ja reportado na auditoria de arquitetura. Aqui o angulo e de escalabilidade.

---

### ACH-009
- titulo: Prisma sem configuracao de connection pool — default de 7 conexoes
- severidade: baixo
- categoria: escalabilidade
- status: confirmado
- resumo: Prisma usa pool default de 7 conexoes. Nao ha configuracao explicita de connection_limit na DATABASE_URL nem no Prisma client. Insuficiente para carga elevada ou multiplas instancias.

#### Evidencia
- arquivo_ou_area: packages/db/src/index.ts (new PrismaClient sem pool config), .env.example (DATABASE_URL sem connection_limit)
- detalhe: Default Prisma: 2 * num_physical_cpus + 1 (geralmente ~7). Sem ajuste para producao.

#### Impacto
- tecnico: Com carga alta ou multiplas instancias, pool saturado causa queue time e timeouts.
- negocio: Impacto em producao sob carga.

#### Recomendacao
- acao_sugerida: Adicionar ?connection_limit=20 na DATABASE_URL de producao. Ajustar conforme numero de instancias e carga esperada.
- prioridade: baixa

#### Observacoes
- none

---

### ACH-010
- titulo: Uso adequado de Promise.all para paralelismo em dashboard — ponto forte
- severidade: informativo
- categoria: eficiencia
- status: confirmado
- resumo: analytics.getDashboard usa Promise.all com 4 queries paralelas. clients.list usa Promise.all para count + findMany. Padrao correto de paralelismo onde aplicavel.

#### Evidencia
- arquivo_ou_area: packages/business/analytics/use-cases/get-dashboard.ts, packages/business/clients/adapters/prisma-client-repository.ts
- detalhe: const [a, b, c, d] = await Promise.all([...]) usado para queries independentes.

#### Impacto
- tecnico: Latencia reduzida em queries paralelas. Padrao correto.
- negocio: Dashboard mais rapido que execucao sequencial.

#### Recomendacao
- acao_sugerida: Manter padrao. Expandir para outros endpoints com queries independentes.
- prioridade: baixa

#### Observacoes
- none
