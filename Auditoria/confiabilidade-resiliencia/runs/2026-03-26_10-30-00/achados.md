# Achados da Auditoria

## Identificacao
- dominio: confiabilidade-resiliencia
- run_id: 2026-03-26_10-30-00
- ultima_atualizacao: 2026-03-26 10:45:00

## Regras de Registro
- Registrar apenas achados reais com evidencia observavel.
- Nao registrar opiniao vaga sem base no repositorio.
- Cada achado deve ter ID unico dentro da run.
- Cada achado deve ter severidade definida.
- Se o item nao for confirmado, registrar como hipotese com justificativa.

## Severidades Permitidas
- critico
- alto
- medio
- baixo
- informativo

## Status Permitidos
- aberto
- confirmado
- mitigado
- resolvido
- aceito
- nao_aplicavel

## Achados Registrados

---

### ACH-001
- titulo: PostgreSQL single instance sem replicacao — ponto unico de falha
- severidade: medio
- categoria: ponto-unico-de-falha
- status: confirmado
- resumo: O docker-compose.yml define uma unica instancia PostgreSQL sem replicacao, failover ou backup automatizado. Se este container falhar, toda a plataforma para.

#### Evidencia
- arquivo_ou_area: docker-compose.yml
- detalhe: Servico `postgres` e uma unica instancia `postgres:16-alpine` sem replica ou cluster. Healthcheck presente (pg_isready) mas sem mecanismo de failover.

#### Impacto
- tecnico: Indisponibilidade total do sistema em caso de falha do banco
- negocio: Todas as consultoras perdem acesso simultaneamente; transacoes em andamento podem ser perdidas

#### Recomendacao
- acao_sugerida: Configurar replicacao streaming ou managed database (RDS/Cloud SQL) com failover automatico para producao
- prioridade: alta

#### Observacoes
- Aceitavel para desenvolvimento; critico para producao

---

### ACH-002
- titulo: Redis single instance sem persistencia configurada — ponto unico de falha
- severidade: medio
- categoria: ponto-unico-de-falha
- status: confirmado
- resumo: Redis 7 configurado como instancia unica sem replicacao. Volume montado mas sem configuracao explicita de persistencia (RDB/AOF). Perda de cache e filas BullMQ em caso de falha.

#### Evidencia
- arquivo_ou_area: docker-compose.yml
- detalhe: Servico `redis` e uma instancia `redis:7-alpine` com volume `wbc_redis_data:/data` mas sem redis.conf com politica de persistencia explicita.

#### Impacto
- tecnico: Perda de cache de entitlements, filas BullMQ, sessoes; possivel perda de eventos em transito
- negocio: Jobs nao processados, campanhas perdidas, lembretes nao disparados

#### Recomendacao
- acao_sugerida: Configurar AOF com fsync everysec e considerar Redis Sentinel ou managed Redis para producao
- prioridade: media

#### Observacoes
- BullMQ depende do Redis para estado dos jobs; perda do Redis = perda de jobs pendentes

---

### ACH-003
- titulo: Isolamento multi-tenant apenas via middleware Prisma — sem RLS no banco
- severidade: alto
- categoria: blast-radius
- status: confirmado
- resumo: O isolamento de tenants depende exclusivamente do middleware Prisma que injeta tenantId nas queries. Nao ha Row Level Security (RLS) no PostgreSQL como barreira de defesa em profundidade. Bug no middleware ou bypass direto ao Prisma pode expor dados entre tenants.

#### Evidencia
- arquivo_ou_area: packages/db/src/middleware/tenant-middleware.ts
- detalhe: Middleware injeta tenantId em WHERE/CREATE para modelos listados em TENANT_SCOPED_MODELS. Se tenantId for undefined, o middleware permite a query sem filtro (`if (!tenantId) { return next(params); }`). Sem RLS no schema.prisma.

#### Impacto
- tecnico: Qualquer falha no contexto do tenant (AsyncLocalStorage) pode resultar em queries sem filtro de tenant, expondo dados de todos os tenants
- negocio: Vazamento de dados entre consultoras — risco regulatorio (LGPD) e reputacional

#### Recomendacao
- acao_sugerida: Implementar RLS no PostgreSQL como segunda camada de protecao; considerar alterar o middleware para rejeitar queries quando tenantId for undefined em modelos tenant-scoped
- prioridade: alta

#### Observacoes
- O padrao `if (!tenantId) { return next(params); }` e o ponto mais fragil — permite queries globais silenciosamente

---

### ACH-004
- titulo: Chamadas HTTP externas sem timeout configurado
- severidade: alto
- categoria: dependencia-fragil
- status: confirmado
- resumo: Os adapters de DeepSeek AI e WhatsApp N2 usam fetch() sem timeout. Uma resposta lenta ou pendurada bloqueia o request indefinidamente, podendo exaurir recursos do servidor.

#### Evidencia
- arquivo_ou_area: packages/business/ai/adapters/deepseek-adapter.ts, packages/business/messaging/adapters/whatsapp-n2-adapter.ts
- detalhe: Ambos os adapters fazem `await fetch(url, { method: 'POST', ... })` sem AbortController, sem signal de timeout, sem wrapper com prazo maximo.

#### Impacto
- tecnico: Requests pendurados acumulam, esgotam connection pool e event loop; possivel cascading failure
- negocio: Lentidao generalizada ou indisponibilidade do sistema por causa de um unico servico externo lento

#### Recomendacao
- acao_sugerida: Implementar AbortController com timeout (ex: 10s para DeepSeek, 15s para WhatsApp) em todas as chamadas fetch externas
- prioridade: alta

#### Observacoes
- Node.js fetch nativo suporta signal de AbortController desde v18

---

### ACH-005
- titulo: Event dispatcher executa handlers sequencialmente sem timeout por handler
- severidade: medio
- categoria: blast-radius
- status: confirmado
- resumo: O event-subscriber.ts executa handlers de evento sequencialmente em um for-loop. Um handler lento ou travado bloqueia todos os handlers subsequentes e atrasa o processamento do outbox inteiro.

#### Evidencia
- arquivo_ou_area: packages/shared/src/events/event-subscriber.ts
- detalhe: `for (const handler of eventHandlers) { await handler(event); }` — execucao sequencial, sem timeout, sem isolamento entre handlers.

#### Impacto
- tecnico: Um handler com falha ou lento atrasa o pipeline inteiro de eventos; sem timeout, pode travar indefinidamente
- negocio: Atrasos em cascata — ex: evento de venda confirmada nao dispara cashback porque o handler de notificacao travou

#### Recomendacao
- acao_sugerida: Executar handlers com Promise.allSettled e timeout individual (ex: 30s por handler); registrar falhas individuais sem bloquear os demais
- prioridade: media

#### Observacoes
- O mecanismo de deduplicacao (processedEvents Set) so marca como processado apos TODOS os handlers — se um falhar, o evento sera reprocessado inteiro

---

### ACH-006
- titulo: Deduplicacao de eventos em memoria — nao sobrevive a restart
- severidade: alto
- categoria: idempotencia
- status: confirmado
- resumo: O event-subscriber.ts usa um Set em memoria para deduplicar eventos processados. Se o worker reiniciar, todos os IDs sao perdidos e eventos ja processados podem ser reexecutados.

#### Evidencia
- arquivo_ou_area: packages/shared/src/events/event-subscriber.ts
- detalhe: `const processedEvents = new Set<string>();` — armazenamento volatil. Alem disso, o Set tem limite de 10000 entries com eviction FIFO manual.

#### Impacto
- tecnico: Reprocessamento de eventos apos restart do worker; handlers executados multiplas vezes
- negocio: Duplicacao de cashback, campanhas reenviadas, mensagens duplicadas para clientes

#### Recomendacao
- acao_sugerida: Persistir IDs de eventos processados no banco ou Redis; o campo `processedAt` no outbox ja marca eventos processados — verificar este campo no dispatch ao inves de depender do Set em memoria
- prioridade: alta

#### Observacoes
- O outbox-repository ja tem markProcessed(); a deduplicacao deveria consultar o status do evento no banco antes de reexecutar

---

### ACH-007
- titulo: WhatsApp adapter engole todos os erros silenciosamente
- severidade: medio
- categoria: falha-silenciosa
- status: confirmado
- resumo: O catch block do whatsapp-n2-adapter.ts captura qualquer excecao e retorna `{ success: false }` sem logging, sem metricas, sem contexto do erro.

#### Evidencia
- arquivo_ou_area: packages/business/messaging/adapters/whatsapp-n2-adapter.ts
- detalhe: `catch { return { success: false }; }` — sem logar o erro, sem repassar para Sentry, sem identificar se e erro de rede, rate limit, token expirado ou outro.

#### Impacto
- tecnico: Impossivel diagnosticar falhas de envio; sem visibilidade sobre rate limiting ou token expirado da API do WhatsApp
- negocio: Mensagens nao entregues sem alerta; campanhas parecem concluidas mas mensagens nao chegaram

#### Recomendacao
- acao_sugerida: Logar o erro com contexto (phone, error type, status code); categorizar erros (transitorios vs permanentes); reportar para Sentry
- prioridade: media

#### Observacoes
- O mesmo padrao pode existir em outros adapters — verificar

---

### ACH-008
- titulo: Outbox processor sem backoff em falhas repetidas
- severidade: alto
- categoria: amplificacao-de-falha
- status: confirmado
- resumo: O outbox-processor.ts roda a cada 5 segundos fixos via setInterval. Quando um evento falha, ele e marcado como FAILED e o attempts e incrementado, mas nao ha backoff — o mesmo evento falho sera reprocessado no proximo ciclo de 5 segundos indefinidamente.

#### Evidencia
- arquivo_ou_area: apps/worker/src/processors/outbox-processor.ts
- detalhe: `setInterval(async () => { await processOutbox(); }, 5000);` — intervalo fixo. O `getPending` busca status PENDING; eventos FAILED nao sao rebuscados diretamente, mas tambem nao sao movidos para DLQ apos N falhas.

#### Impacto
- tecnico: Eventos com falha permanente (ex: handler com bug) ficam marcados como FAILED sem reprocessamento nem DLQ, podendo criar acumulo silencioso
- negocio: Eventos criticos (sale.confirmed, payment.received) podem ficar presos sem processamento

#### Recomendacao
- acao_sugerida: Implementar retry com backoff exponencial para eventos FAILED; mover para DLQ apos N tentativas (ex: 5); alertar quando DLQ cresce
- prioridade: alta

#### Observacoes
- A fila `wbc:dlq` existe em queues/index.ts mas nao ha processor associado nem logica de movimentacao para ela

---

### ACH-009
- titulo: Ausencia de rate limiting nos endpoints da API
- severidade: alto
- categoria: overload
- status: confirmado
- resumo: Nenhum endpoint tRPC possui rate limiting. O endpoint de OTP (send-otp) esta exposto como route publica sem nenhuma protecao contra abuso.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/*.ts, apps/web/src/app/api/send-otp/route.ts
- detalhe: Nao ha middleware de rate limiting em nenhum router tRPC. A rota send-otp e um POST publico sem throttle, CAPTCHA ou limitacao por IP/phone.

#### Impacto
- tecnico: Vulneravel a brute force no OTP, DDoS na API, exaustao de recursos do banco/Redis
- negocio: Custos de SMS/WhatsApp descontrolados; indisponibilidade por abuso

#### Recomendacao
- acao_sugerida: Implementar rate limiting por IP e por tenant (ex: express-rate-limit ou rate-limiter-flexible com Redis); limitar OTP a 3 tentativas/hora por telefone
- prioridade: alta

#### Observacoes
- Rate limiting e pré-requisito para producao; sem ele, qualquer endpoint publico e vetor de ataque

---

### ACH-010
- titulo: Ausencia de circuit breaker para servicos externos
- severidade: alto
- categoria: cascading-failure
- status: confirmado
- resumo: Os adapters de DeepSeek e WhatsApp nao implementam circuit breaker. Se o servico externo ficar fora, cada request do usuario continuara tentando conectar, acumulando timeouts e degradando o sistema inteiro.

#### Evidencia
- arquivo_ou_area: packages/business/ai/adapters/deepseek-adapter.ts, packages/business/messaging/adapters/whatsapp-n2-adapter.ts
- detalhe: Nenhum mecanismo de circuit breaker (open/half-open/closed) nem fail-fast. Cada chamada tenta conectar independentemente, sem considerar falhas anteriores.

#### Impacto
- tecnico: Cascading failure — servico externo indisponivel causa acumulo de requests lentos, exaustao de recursos internos
- negocio: Funcionalidades que dependem de AI ou WhatsApp degradam todo o sistema ao inves de falhar isoladamente

#### Recomendacao
- acao_sugerida: Implementar circuit breaker (ex: opossum, cockatiel) nos adapters externos; abrir circuito apos N falhas consecutivas; retornar fallback ou erro rapido
- prioridade: alta

#### Observacoes
- O DeepSeek adapter ja tem um fallback de dev (`if (!this.apiKey)`) — esse padrao pode ser estendido como fallback quando circuit breaker esta aberto

---

### ACH-011
- titulo: Pool de conexoes Prisma sem configuracao explicita
- severidade: medio
- categoria: saturacao
- status: confirmado
- resumo: O PrismaClient e instanciado sem configuracao de pool de conexoes. Em cenario de carga, o pool default do Prisma pode ser insuficiente ou excessivo, causando exaustao de conexoes no PostgreSQL.

#### Evidencia
- arquivo_ou_area: packages/db/src/index.ts
- detalhe: `new PrismaClient({ log: [...] })` — sem parametro `connection_limit` na DATABASE_URL e sem configuracao explicita de pool. O .env.example mostra DATABASE_URL sem parametros de pool.

#### Impacto
- tecnico: Sob carga, conexoes podem se esgotar ou exceder o limite do PostgreSQL; sem configuracao, o comportamento depende de defaults internos do Prisma
- negocio: Queries lentas ou falhando em horarios de pico

#### Recomendacao
- acao_sugerida: Adicionar `?connection_limit=10&pool_timeout=10` na DATABASE_URL; ajustar conforme carga esperada; considerar PgBouncer para producao
- prioridade: media

#### Observacoes
- O Prisma default e ~num_cpus*2+1 conexoes; para multi-tenant com muitos tenants simultaneos, pode ser insuficiente

---

### ACH-012
- titulo: DLQ definida mas sem handler — eventos mortos acumulam silenciosamente
- severidade: medio
- categoria: recuperacao
- status: confirmado
- resumo: A fila `wbc:dlq` e criada em queues/index.ts mas nao ha nenhum processor, alerta ou mecanismo de revisao para eventos que caem nela. Alem disso, nenhuma logica atual move eventos para a DLQ.

#### Evidencia
- arquivo_ou_area: apps/worker/src/queues/index.ts
- detalhe: `export const dlqQueue = new Queue('wbc:dlq', { connection });` — definida mas sem worker consumindo. O outbox-processor marca eventos como FAILED mas nao os move para a DLQ.

#### Impacto
- tecnico: Eventos permanentemente falhos ficam presos no status FAILED na tabela outbox sem tratamento; a DLQ existente e inutilizada
- negocio: Eventos criticos de negocio (pagamentos, vendas) podem ser perdidos permanentemente sem alerta

#### Recomendacao
- acao_sugerida: Implementar logica de movimentacao para DLQ apos N tentativas; criar processor de DLQ para alertar e permitir reprocessamento manual; monitorar tamanho da DLQ
- prioridade: media

#### Observacoes
- A existencia da DLQ mostra intencao correta; falta a implementacao do pipeline completo

---

### ACH-013
- titulo: Cache de entitlements sem invalidacao por evento
- severidade: baixo
- categoria: estado-inconsistente
- status: confirmado
- resumo: Entitlements de tenant sao cacheados por 5 minutos no Redis. Quando o plano do tenant muda, a funcao invalidateEntitlements existe mas nao e chamada automaticamente via evento. O usuario pode continuar acessando features do plano anterior por ate 5 minutos.

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/entitlements.ts, apps/api/src/lib/cache.ts
- detalhe: `CACHE_TTL.ENTITLEMENTS = 300` (5 min). A funcao `invalidateEntitlements(tenantId)` existe mas nao ha subscriber para o evento `tenant.plan_changed` que a chame.

#### Impacto
- tecnico: Stale cache permite acesso a features apos downgrade por ate 5 minutos
- negocio: Impacto baixo — janela de 5 minutos; mas pode ser explorado se houver features com custo (AI generations)

#### Recomendacao
- acao_sugerida: Registrar subscriber para `tenant.plan_changed` que chame invalidateEntitlements(); considerar reduzir TTL para 60s
- prioridade: baixa

#### Observacoes
- O padrao de invalidacao esta pronto (funcao existe); falta conectar ao evento

---

### ACH-014
- titulo: Sentry com sampling de 10% em producao
- severidade: baixo
- categoria: readiness-operacional
- status: confirmado
- resumo: O Sentry esta configurado com tracesSampleRate de 0.1 em producao, o que significa que 90% das traces sao descartadas. Erros raros ou intermitentes podem nao ser capturados.

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/sentry.ts
- detalhe: `tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0` — 10% em producao.

#### Impacto
- tecnico: Traces de erros intermitentes podem ser perdidas; dificuldade de diagnostico em producao
- negocio: Tempo maior para identificar e corrigir problemas em producao

#### Recomendacao
- acao_sugerida: Considerar aumentar para 0.3-0.5 ou usar sampling adaptativo; garantir que error events (nao traces) tenham 100% de captura
- prioridade: baixa

#### Observacoes
- Sentry diferencia traces (sampling) de error events (geralmente 100%); verificar se errors estao com sampling separado

---

### ACH-015
- titulo: Ausencia de runbooks e documentacao operacional
- severidade: baixo
- categoria: readiness-operacional
- status: confirmado
- resumo: Nao foram encontrados runbooks, procedimentos de incidente, ou documentacao operacional para cenarios de falha (banco fora, Redis fora, servico externo fora, filas acumuladas).

#### Evidencia
- arquivo_ou_area: raiz do repositorio, docs/, begin/
- detalhe: Os documentos em begin/ cobrem arquitetura e implementacao, mas nao ha documentacao de operacao, recuperacao ou resposta a incidentes.

#### Impacto
- tecnico: Equipe de operacao sem guia para diagnostico e recuperacao; tempo de resposta a incidentes mais longo
- negocio: Downtime estendido em caso de falha por falta de procedimentos documentados

#### Recomendacao
- acao_sugerida: Criar runbooks basicos para: banco fora, Redis fora, servico externo fora, filas acumulando, deploy rollback
- prioridade: baixa

#### Observacoes
- Projeto ainda em desenvolvimento; runbooks podem ser criados mais perto do lancamento
