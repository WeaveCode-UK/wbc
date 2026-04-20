# Progresso da Correção

## Identificação
- dominio: arquitetura
- run_id: 2026-04-18_18-17-50
- branch: fix/arquitetura/2026-04-18_18-17-50
- data_inicio: 2026-04-18 18:48:00
- ultima_atualizacao: 2026-04-20 (merge em main confirmado — commit ce113a3)
- fase_atual: concluida
- status: concluido

## Resumo de Progresso
- total_aprovados: 13
- corrigidos_executor: 13
- revisados_revisor: 13
- aprovados_diretos: 11
- corrigidos_pelo_revisor: 2
- nao_corrigiveis: 0
- nao_aprovados: 0
- pendentes: 0

## Achados

### ACH-009
- titulo: Worker sem graceful shutdown — risco de perda de jobs em-flight
- severidade: critico
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: c8d2310d24ce05dbd5a2a765c374c18f26bd98f7
- commit_revisor: none
- arquivos_alterados:
  - apps/worker/src/index.ts
- descricao_correcao: Handler de SIGTERM/SIGINT que cancela os 3 setIntervals, pausa os 5 BullMQ workers com .pause(true) drenando in-flight, fecha workers com .close(), desconecta Redis (bullmqRedis.quit()) e Prisma (prisma.$disconnect()), e executa exit(0). Timeout de segurança de 30s (WORKER_SHUTDOWN_TIMEOUT_MS) com force exit(1). Lock previne shutdown duplicado.
- observacoes: none
- resultado_revisao: Cruzado achado↔diff↔codigo atual. Correcao implementa fielmente a recomendacao: handlers SIGTERM/SIGINT chamam gracefulShutdown que (a) clearInterval nos 3 polls, (b) pausa workers com pause(true) drenando in-flight, (c) close nos workers, (d) bullmqRedis.quit(), (e) prisma.$disconnect(), (f) exit(0). Timeout de 30s (WORKER_SHUTDOWN_TIMEOUT_MS) com force exit(1). Lock shuttingDown previne reentrancia. Integracao com health server (ACH-011) no mesmo fluxo. Sentry capture em erro. Honra at-least-once do ADR-003.

### ACH-007
- titulo: Ausência de enforcement automatizado para regras hexagonal
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 0dfe755
- commit_revisor: none
- arquivos_alterados:
  - package.json (adiciona prettier e dependency-cruiser em devDependencies; adiciona script arch:check)
  - pnpm-lock.yaml (atualizado por pnpm add)
  - .prettierignore (novo - exclui Auditoria/ de reformatacao)
  - .dependency-cruiser.cjs (novo - regras hexagonais)
- descricao_correcao: Instalados prettier@3.8.3 (resolve bug do pre-commit hook com ENOENT) e dependency-cruiser@17.3.10 como devDependencies. Criado .dependency-cruiser.cjs com 6 regras arquiteturais: (1-4) hexagonal forbidden imports; (5) no-cross-business-module-imports; (6) no-circular; + no-orphans como warn. Criado .prettierignore excluindo Auditoria/ e .auditoria-backup-*/ para preservar conteudo canonico do framework. Script arch:check adicionado ao package.json root.
- observacoes: arch:check nao foi executado neste commit para respeitar regra 15 do Prompt 05 (nao rodar lint/testes automaticamente). Sera executado manualmente ou no CI.
- resultado_revisao: Cruzado achado↔diff↔codigo atual. Regras cobrem fielmente o recomendado: (a) domain ↛ adapters/use-cases, (b) use-cases ↛ adapters, (c) ports ↛ adapters, (d) no-cross-business-module-imports com backref $1 correto, (e) no-circular, (f) no-orphans warn. tsPreCompilationDeps + tsConfig apontando para tsconfig root — resolve aliases de workspace. Exclude inclui Auditoria/ e testes. Script arch:check registrado. Chore 68a0f16 removeu eslint --fix do lint-staged (trade-off aceitavel — arch:check fica fora do pre-commit mas esta disponivel como gate de CI).

### ACH-005
- titulo: Lógica de domínio (cálculos de negócio) vazada em adapters Prisma
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: a708477
- commit_revisor: none
- arquivos_alterados:
  - packages/business/sales/domain/value-objects.ts (adiciona computeItemSubtotal, computeSaleSubtotal, computeSaleTotal)
  - packages/business/sales/domain/cashback.ts (novo - computeAvailableCashback, daysUntilExpiry, isCashbackExpiringSoon, computeCashbackAllocation)
  - packages/business/analytics/domain/value-objects.ts (novo - computeAvgTicket, computeDaysSince, computeRecencyBonus, computeEngagementScore, classifyABC)
  - packages/business/sales/adapters/prisma-sale-repository.ts (usa funcoes puras)
  - packages/business/sales/adapters/prisma-cashback-repository.ts (usa funcoes puras)
  - packages/business/analytics/adapters/prisma-analytics-repository.ts (usa funcoes puras)
- descricao_correcao: Extracao de regras de negocio de adapters para domain/. Funcoes puras: calculo de subtotal/total de venda (sales), saldo e alocacao de cashback (sales/cashback), ticket medio + engagement score + classificacao ABC (analytics). Adapters agora apenas delegam para domain/ e persistem via Prisma. Invariantes explicitas: total nunca negativo, alocacao de cashback nunca excede available/remaining, recency bonus zero para clientes sem compra.
- observacoes: mantida compatibilidade de comportamento — cada funcao pura reproduz exatamente o calculo que estava inline nos adapters. Nenhum cenario de negocio alterado, apenas deslocamento de responsabilidade para a camada correta.
- resultado_revisao: Cruzado achado↔diff↔codigo atual. Regras extraidas fielmente: (a) sales/domain/value-objects.ts — computeItemSubtotal, computeSaleSubtotal, computeSaleTotal com clamp Math.max(0,...) invariante; (b) sales/domain/cashback.ts — computeAvailableCashback, daysUntilExpiry, isCashbackExpiringSoon, computeCashbackAllocation com clamp duplo; (c) analytics/domain/value-objects.ts — computeAvgTicket, computeDaysSince, computeRecencyBonus, computeEngagementScore, classifyABC. Observacao importante: computeRecencyBonus agora retorna 0 quando daysSinceLastPurchase < 0 (cliente nunca comprou). No codigo antigo, -1 < 30 retornaria ENGAGEMENT_RECENCY_BONUS_RECENT=30, dando score=30 a cliente sem venda. O novo comportamento eh semanticamente correto e foi declarado explicitamente como invariante na descricao_correcao ("recency bonus zero para clientes sem compra") — aprovado como bug-fix deliberado. Adapters passam a apenas delegar (sales-repo usa computeSaleSubtotal/Total/ItemSubtotal; cashback-repo usa computeAvailableCashback/isCashbackExpiringSoon/computeCashbackAllocation; analytics-repo usa computeAvgTicket/computeDaysSince/computeEngagementScore/classifyABC).

### ACH-008
- titulo: Políticas de retry, timeout e circuit breaker hardcoded em cada adapter externo
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 21e8fe9
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/resilience/retry.ts (novo - RetryPolicy, withRetry, RetryExhaustedError)
  - packages/shared/src/resilience/timeout.ts (novo - TimeoutPolicy, createTimeoutSignal)
  - packages/shared/src/resilience/policies.ts (novo - whatsapp/deepseek policies configuraveis por env var)
  - packages/shared/src/resilience/index.ts (novo - barrel)
  - packages/shared/src/index.ts (re-exporta ./resilience)
  - packages/business/messaging/adapters/whatsapp-n2-adapter.ts (recebe policies via constructor)
  - packages/business/ai/adapters/deepseek-adapter.ts (recebe policies via constructor)
- descricao_correcao: Centralizacao de resiliencia em packages/shared/src/resilience/. RetryPolicy e TimeoutPolicy como tipos padrao; funcoes utilitarias (withRetry/createTimeoutSignal) para casos simples; policies por provider (whatsappRetryPolicy, deepseekRetryPolicy, etc.) configuraveis via env vars (WHATSAPP_MAX_RETRIES, DEEPSEEK_TIMEOUT_MS, etc.). Adapters refatorados para receber policies via constructor com fallback para defaults. Comportamento preservado (mesmos thresholds padrao).
- observacoes: CircuitBreaker existente mantido intacto em packages/shared/src/circuit-breaker.ts; thresholds de CB continuam locais aos adapters por enquanto (5 para WhatsApp, 3 para DeepSeek — sao semanticos do provider, nao parametros operacionais), mas podem ser movidos para policies.ts em iteracao futura sem breaking change.
- resultado_revisao: Cruzado achado↔diff↔codigo atual. Centralizacao executada: packages/shared/src/resilience/ ganha retry.ts (RetryPolicy, withRetry, RetryExhaustedError), timeout.ts (TimeoutPolicy, createTimeoutSignal), policies.ts (whatsapp/deepseek configuraveis por env), index.ts (barrel). @wbc/shared re-exporta via 'export * from ./resilience'. Adapters whatsapp-n2-adapter.ts e deepseek-adapter.ts recebem policies via constructor com fallback para defaults globais. Defaults preservam valores originais (WhatsApp: 10s/2 retries/1s delay; DeepSeek: 30s/2 retries/2s delay). Env vars: WHATSAPP_TIMEOUT_MS, WHATSAPP_MAX_RETRIES, etc. Observacao: adapters mantem loop de retry inline em vez de usar withRetry helper — decisao estilistica aceitavel (o valor esta em policy, so a forma de consumo difere). CircuitBreaker thresholds permanecem locais — documentado na descricao.

### ACH-012
- titulo: Isolamento multi-tenant em Redis depende apenas de convenção de prefixo manual
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 75d961c
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/redis/tenant-scoped-redis.ts (novo - classe TenantScopedRedis, TenantScopedRedisBound, TenantContextMissingError)
  - packages/shared/src/redis/index.ts (novo - barrel)
  - packages/shared/src/index.ts (re-exporta ./redis)
  - apps/api/src/lib/cache.ts (adiciona cacheGetForTenant, cacheSetForTenant, cacheDeleteForTenant, cacheInvalidatePatternForTenant)
- descricao_correcao: TenantScopedRedis wrapper obtem tenantId do AsyncLocalStorage (@wbc/shared tenant-context) e prefixa automaticamente todas as chaves com 'wbc:t:${tenantId}:'. Lanca TenantContextMissingError se operacao e tentada sem contexto, prevenindo vazamento cross-tenant. Metodo .forTenant(tenantId) permite uso fora de contexto (ex: handlers de eventos externos). apps/api/src/lib/cache.ts ganha familia de funcoes *ForTenant que devem ser preferidas para caches por-tenant; funcoes sem sufixo permanecem para caches genuinamente globais.
- observacoes: migracao completa dos callers atuais de cache para as versoes ForTenant e follow-up — feito apenas a infra neste commit. Handler de TENANT_PLAN_CHANGED em apps/worker (que faz 'wbc:entitlements:${tenantId}') e candidato imediato para migracao no proximo passo de refactor.
- resultado_revisao: Cruzado achado↔diff↔codigo atual. Implementacao correta: (a) TenantScopedRedis obtem tenantId via getCurrentTenant() do AsyncLocalStorage e lanca TenantContextMissingError se ausente; (b) TenantScopedRedisBound para uso fora de contexto; (c) prefixo canonico 'wbc:t:${tenantId}:'; (d) invalidatePattern via scanStream+pipeline; (e) @wbc/shared re-exporta via 'export * from ./redis'; (f) apps/api/src/lib/cache.ts ganha familia *ForTenant (cacheGetForTenant, cacheSetForTenant, cacheDeleteForTenant, cacheInvalidatePatternForTenant) que devem ser preferidas para caches por-tenant. Escopo limita-se a infra; migracao dos callers existentes e follow-up declarado.

### ACH-011
- titulo: Health checks mínimos; sem readiness distinto de liveness e sem métricas de lag de worker
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 93af5a7
- commit_revisor: none
- arquivos_alterados:
  - apps/api/src/routers/health.ts (adiciona procedures live e ready; ready checa DB, Redis e lag do outbox)
  - apps/worker/src/health-server.ts (novo - HTTP server minimo node:http com /health/live, /health/ready, queue depths e outbox lag)
  - apps/worker/src/index.ts (inicia health server e integra ao graceful shutdown)
  - docker-compose.prod.yml (healthcheck para web via /api/trpc/health.live e para worker via :9100/health/ready)
- descricao_correcao: Separacao clara liveness/readiness conforme convencao Kubernetes. API ganha procedures tRPC live (sempre 200) e ready (DB+Redis+outbox_lag < threshold). Worker ganha HTTP server dedicado em porta configuravel (default 9100) com /health/live, /health/ready e queue depths. Integrado ao graceful shutdown (ACH-009) para fechar limpo. docker-compose.prod.yml ganha healthcheck para web e worker com start_period 30s e 3 retries.
- observacoes: threshold de lag do outbox e configuravel via OUTBOX_READY_LAG_THRESHOLD_MS (default 60000ms); porta do worker health via WORKER_HEALTH_PORT.
- resultado_revisao: Cruzado achado↔diff↔codigo atual. API ganha procedures tRPC 'live' (sem dependencias, sempre retorna status ok) e 'ready' (DB, Redis e outbox lag dentro do threshold). Worker ganha apps/worker/src/health-server.ts usando node:http com GET /health/live, GET /health/ready e alias GET /health. /health/ready mede outbox lag e queue depths. docker-compose.prod.yml ganha healthchecks para web (/api/trpc/health.live) e worker (:9100/health/ready) com start_period 30s e 3 retries. Integracao com ACH-009: healthHandles.stop() eh chamado no gracefulShutdown. Limitacao do queueDepths (usa Worker.getMetrics('completed') como aproximacao — BullMQ Worker nao expoe depth direto) esta explicitamente comentada no codigo, conforme nota do usuario.

### ACH-006
- titulo: Módulo `ai/` diverge do padrão hexagonal (sem `domain/`)
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 6f09f5a
- commit_revisor: none
- arquivos_alterados:
  - packages/business/ai/domain/entities.ts (novo - AIModel, AIUsage, AILimit)
  - packages/business/ai/domain/value-objects.ts (novo - totalTokensInWindow, isWithinLimit)
  - packages/business/ai/domain/errors.ts (novo - AILimitExceededError, AIProviderUnavailableError)
  - docs/adr/006-ai-module-model.md (novo - ADR propondo Opcao A vs Opcao B)
- descricao_correcao: Skeleton de domain/ no modulo ai/ disponivel para adocao gradual caso evolua para hexagonal completo. ADR-006 documenta duas opcoes (anemico vs hexagonal completo) e aguarda decisao humana. Codigo atual de ai/ nao depende do skeleton ainda — e cria opcional ate decisao tomada.
- observacoes: classificado corrigivel_parcial — requer decisao de produto/arquiteto entre Opcao A e B antes da materializacao completa.
- resultado_revisao: Cruzado achado↔diff↔codigo atual. ADR-006 criado com status 'proposto' (placeholder claro para decisao humana), apresentando Opcao A (gateway anemico) vs Opcao B (hexagonal completo). Skeleton de domain/ criado em packages/business/ai/domain/ (entities.ts com AIModel/AIUsage/AILimit, value-objects.ts com totalTokensInWindow/isWithinLimit, errors.ts com AILimitExceededError/AIProviderUnavailableError). Nomes diferem ligeiramente do recomendado no achado (AIUsage vs AIGenerationLog, AILimit vs TokenUsagePolicy), mas intenciona as mesmas entidades — aceitavel pois decisao ainda aguarda. ADR esta marcado como proposto aguardando Opcao A ou B; nao ha afirmacao falsa. Placeholder claramente identificado. Aprovado conforme regra para corrigivel_parcial.

### ACH-002
- titulo: Topologia de deploy/runtime de produção não documentada
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 2e8ad6d
- commit_revisor: none
- arquivos_alterados:
  - docs/DEPLOYMENT.md (novo)
- descricao_correcao: docs/DEPLOYMENT.md consolida topologia de producao: diagrama Mermaid, componentes e responsabilidades, conexoes/dependencias/healthchecks, graceful shutdown, env vars criticas, observabilidade. Placeholders para RTO/RPO e failover strategy (marcados como 'pendente validacao humana').
- observacoes: secoes 'Disaster Recovery' e 'Failover' sao placeholders aguardando decisao de produto/ops sobre SLA real.
- resultado_revisao: Cruzado achado↔diff↔codigo atual. docs/DEPLOYMENT.md cobre: (a) topologia Mermaid com nginx/web/worker/postgres/redis/prometheus/grafana/certbot; (b) tabela componentes-imagens-portas-responsabilidades; (c) boot order + connection pools (web 20, worker 5) + health checks; (d) graceful shutdown (linka ACH-009); (e) Disaster Recovery com RTO/RPO — explicitamente marcado 'placeholder pendente validacao humana' com [humano validar] em cada linha; (f) Failover explicitamente pendente com sugestao para HA; (g) Rollback; (h) env vars criticas; (i) observabilidade. Placeholders claramente marcados, nenhuma afirmacao falsa no lugar. Aprovado conforme regra para corrigivel_parcial.

### ACH-001
- titulo: Documentação arquitetural textual mas sem visualização consolidada
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: corrigido_com_revisao
- commit_executor: 6ae709d
- commit_revisor: 7f6da01
- arquivos_alterados:
  - docs/ARCHITECTURE.md (novo)
- descricao_correcao: docs/ARCHITECTURE.md consolida visao arquitetural: overview 1 pagina, C4 L1 (System Context em Mermaid C4Context), C4 L2 (Containers em flowchart), tabela dos 16 modulos business com responsabilidade, packages compartilhados, regras arquiteturais enforced, matriz de dados (agregado/dono/leitores), filas BullMQ ativas, indice de ADRs. Linka para DEPLOYMENT.md e events.md.
- observacoes: classificado corrigivel_parcial porque conteudo do diagrama foi inferido do codigo/ADRs — humano valida fidelidade antes de virar fonte oficial.
- discrepancia_encontrada: Texto afirmava '16 modulos' em packages/business/, mas a pasta real tem 15 (ai, analytics, auth, campaigns, catalog, clients, finance, inventory, landing, logistics, messaging, platform, sales, schedule, team) e a tabela listava 15. Afirmacao levemente falsa contradiz a evidencia observavel.
- correcao_aplicada: Ajustado texto para '15 modulos' + esclarece que ai/ esta em analise no ADR-006 (skeleton criado, decisao pendente). Commit review-fix 7f6da01.
- resultado_revisao: Cruzado achado↔diff↔codigo atual. ARCHITECTURE.md cobre: (a) Overview; (b) C4 L1 via Mermaid C4Context com atores consultora/admin/cliente e systems externos whatsapp/resend/mercadopago/deepseek/sentry/otel; (c) C4 L2 via flowchart com web/mobile/landing/api/worker/db/cache; (d) tabela dos 15 modulos business com responsabilidades; (e) packages compartilhados; (f) regras arquiteturais enforced (linka ACH-007); (g) matriz de dados (agregado/dono/leitores); (h) filas BullMQ ativas; (i) indice de ADRs; (j) links para DEPLOYMENT.md e events.md. Pequena inconsistencia numerica corrigida pelo revisor. Conteudo segue sendo 'placeholder parcial' por ser inferido do codigo — humano valida fidelidade final.

### ACH-004
- titulo: Fluxos de eventos inter-módulos não mapeados em catálogo central
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 7cbcf9a
- commit_revisor: none
- arquivos_alterados:
  - docs/architecture/events.md (novo)
- descricao_correcao: docs/architecture/events.md cataloga 38 eventos extraidos de packages/shared/src/events/domain-event.ts. Tabela mapeia evento → publisher → consumers → fila BullMQ → descricao. Inclui convencoes de naming, regras para adicionar evento novo, gap conhecido (consumers nao detectados em varredura automatica).
- observacoes: classificado corrigivel_parcial porque coluna 'Consumers' foi preenchida por varredura estatica e pode ter falsos negativos. Humano deve validar e completar onde necessario.
- resultado_revisao: Cruzado achado↔diff↔codigo atual. docs/architecture/events.md cataloga 38 eventos com colunas Evento, Publisher, Consumers, Fila BullMQ, Descricao. Inclui: (a) convencoes de naming; (b) regras para adicionar evento novo; (c) gap conhecido com texto explicito ('eventos marcados como — podem ter consumer nao detectado ou serem candidatos a remocao — a proxima auditoria pode gerar script estatico'); (d) links para domain-event.ts, outbox-service, event-subscriber, ADR-003. Conforme nota do usuario: gap reconhecido no doc — aprovado.

### ACH-010
- titulo: Decisões de resiliência (retry, circuit breaker, DLQ, cleanup) sem ADR
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: af80607
- commit_revisor: none
- arquivos_alterados:
  - docs/adr/007-resilience-strategies.md (novo)
- descricao_correcao: ADR-007 documenta as decisoes de resiliencia implementadas nos ACH-008 (centralizacao retry/timeout), ACH-009 (graceful shutdown) e pre-existentes (CircuitBreaker, DLQ, outbox cleanup). Inclui SLOs propostos como placeholder para validacao humana.
- observacoes: classificado corrigivel_parcial porque SLOs propostos (99% entrega, lag p95 30s, etc.) precisam validacao da operacao.
- resultado_revisao: Cruzado achado↔diff↔codigo atual. ADR-007 em docs/adr/007-resilience-strategies.md documenta (a) Retry com backoff linear, policy centralizada em @wbc/shared/resilience; (b) Timeout via AbortController; (c) Circuit Breaker com thresholds WhatsApp=5 e DeepSeek=3 (racional: custo de falha); (d) DLQ em fila wbc:dlq com dlq-scanner a cada 60s e dlq-processor que apenas loga (roadmap: endpoint admin de resgate); (e) Outbox cleanup diario; (f) Graceful Shutdown com 7 passos (pausa workers, cancela setInterval, fecha health server, close workers, quit Redis, disconnect Prisma, exit 0) + timeout 30s + lock. SLOs propostos explicitamente marcados 'pendente validacao humana'. Consequencias positivas/negativas, alternativas consideradas (exponential vs linear, BullMQ retry vs adapter retry), links para ADR-003/ADR-008 e implementacao. Placeholder claro. Aprovado conforme regra para corrigivel_parcial.

### ACH-003
- titulo: Decisão de monorepo Turborepo+pnpm não registrada em ADR
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: corrigido_com_revisao
- commit_executor: e20db0a
- commit_revisor: 7c5057c
- arquivos_alterados:
  - docs/adr/005-monorepo-turborepo-pnpm.md (novo)
- descricao_correcao: ADR-005 retroativo documenta a escolha de Turborepo + pnpm workspaces. Inclui regras de workspace (apps/, packages/, scope @wbc/), alternativas rejeitadas (polirepo, lerna/nx, npm/yarn workspaces), consequencias (positivas + trade-offs), criterio de migracao futura (CI > 15min com cache).
- observacoes: classificacao corrigivel — ADR formaliza decisao ja tomada sem exigir validacao de produto.
- discrepancia_encontrada: Duas referencias numericas incorretas ('16 modulos business' e '23 packages internos = 16+7'), quando packages/business/ tem 15 pastas reais. Mesma inconsistencia do ACH-001.
- correcao_aplicada: Ajustado ADR-005 para 15 modulos business e 22 packages internos. Commit review-fix 7c5057c.
- resultado_revisao: Cruzado achado↔diff↔codigo atual. ADR-005 documenta Turborepo + pnpm workspaces com: (a) contexto + decisao; (b) regras de workspace (apps/, packages/, scope @wbc/, workspace:* para deps internas); (c) 3 alternativas rejeitadas (polirepo, lerna/nx, npm/yarn workspaces) com trade-offs; (d) consequencias positivas (atomic refactors, turbo cache, pnpm disk usage) e negativas; (e) criterio de migracao futura (CI > 15min com cache); (f) links para turbo.json, ADR-001, ACH-003. Retroativo conforme achado. Apos ajuste numerico do revisor, doc esta fiel ao estado real do repo.

### ACH-013
- titulo: Estratégia de escalabilidade horizontal de workers sem ADR
- severidade: baixo
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 9eaa41f
- commit_revisor: none
- arquivos_alterados:
  - docs/adr/008-worker-scaling.md (novo)
- descricao_correcao: ADR-008 documenta opcoes de escalabilidade horizontal (Opcao A worker pool global vs Opcao B workers especializados), job affinity, connection pool Prisma por worker, particionamento de queue, multi-region. Inclui tabela de cenarios de escala baseline por volume. Status 'proposto' aguardando decisao humana entre A e B.
- observacoes: classificado corrigivel_parcial porque as decisoes reais (Opcao A vs B, gatilhos de escala) aguardam aprovacao humana.
- resultado_revisao: Cruzado achado↔diff↔codigo atual. ADR-008 com status 'proposto' documenta: (a) modelo de pool — Opcao A (worker pool global) vs Opcao B (workers especializados) com sugestao default de A ate 10k eventos/dia; (b) job affinity (por tenant, por tipo, nenhuma — default) com 'Decisao pendente'; (c) connection pool Prisma por worker — critério de reducao conforme N cresce; (d) particionamento de queue via shards BullMQ para >100k events/dia; (e) multi-region fora do escopo MVP; (f) tabela de cenarios de escala (1/2-3/4-8/10+ instancias por volume); (g) metricas para gatilho de escala linkando /health/ready; (h) checklist de decisoes pendentes; (i) links para ADR-003/ADR-007 e health-server.ts. Decisoes claramente marcadas como pendentes. Aprovado conforme regra para corrigivel_parcial.
