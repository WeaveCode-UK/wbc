# Progresso da Correção

## Identificação
- dominio: arquitetura
- run_id: 2026-04-18_18-17-50
- branch: fix/arquitetura/2026-04-18_18-17-50
- data_inicio: 2026-04-18 18:48:00
- ultima_atualizacao: 2026-04-18 19:30:00
- fase_atual: executor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 13
- corrigidos_executor: 11
- revisados_revisor: 0
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 0
- nao_aprovados: 0
- pendentes: 2

## Achados

### ACH-009
- titulo: Worker sem graceful shutdown — risco de perda de jobs em-flight
- severidade: critico
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: c8d2310d24ce05dbd5a2a765c374c18f26bd98f7
- commit_revisor: none
- arquivos_alterados:
  - apps/worker/src/index.ts
- descricao_correcao: Handler de SIGTERM/SIGINT que cancela os 3 setIntervals, pausa os 5 BullMQ workers com .pause(true) drenando in-flight, fecha workers com .close(), desconecta Redis (bullmqRedis.quit()) e Prisma (prisma.$disconnect()), e executa exit(0). Timeout de segurança de 30s (WORKER_SHUTDOWN_TIMEOUT_MS) com force exit(1). Lock previne shutdown duplicado.
- observacoes: none

### ACH-007
- titulo: Ausência de enforcement automatizado para regras hexagonal
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: pending (sera preenchido apos commit)
- commit_revisor: none
- arquivos_alterados:
  - package.json (adiciona prettier e dependency-cruiser em devDependencies; adiciona script arch:check)
  - pnpm-lock.yaml (atualizado por pnpm add)
  - .prettierignore (novo - exclui Auditoria/ de reformatacao)
  - .dependency-cruiser.cjs (novo - regras hexagonais)
- descricao_correcao: Instalados prettier@3.8.3 (resolve bug do pre-commit hook com ENOENT) e dependency-cruiser@17.3.10 como devDependencies. Criado .dependency-cruiser.cjs com 6 regras arquiteturais: (1-4) hexagonal forbidden imports; (5) no-cross-business-module-imports; (6) no-circular; + no-orphans como warn. Criado .prettierignore excluindo Auditoria/ e .auditoria-backup-*/ para preservar conteudo canonico do framework. Script arch:check adicionado ao package.json root.
- observacoes: arch:check nao foi executado neste commit para respeitar regra 15 do Prompt 05 (nao rodar lint/testes automaticamente). Sera executado manualmente ou no CI.

### ACH-005
- titulo: Lógica de domínio (cálculos de negócio) vazada em adapters Prisma
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: pending
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

### ACH-008
- titulo: Políticas de retry, timeout e circuit breaker hardcoded em cada adapter externo
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: pending
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

### ACH-012
- titulo: Isolamento multi-tenant em Redis depende apenas de convenção de prefixo manual
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: pending
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/redis/tenant-scoped-redis.ts (novo - classe TenantScopedRedis, TenantScopedRedisBound, TenantContextMissingError)
  - packages/shared/src/redis/index.ts (novo - barrel)
  - packages/shared/src/index.ts (re-exporta ./redis)
  - apps/api/src/lib/cache.ts (adiciona cacheGetForTenant, cacheSetForTenant, cacheDeleteForTenant, cacheInvalidatePatternForTenant)
- descricao_correcao: TenantScopedRedis wrapper obtem tenantId do AsyncLocalStorage (@wbc/shared tenant-context) e prefixa automaticamente todas as chaves com 'wbc:t:${tenantId}:'. Lanca TenantContextMissingError se operacao e tentada sem contexto, prevenindo vazamento cross-tenant. Metodo .forTenant(tenantId) permite uso fora de contexto (ex: handlers de eventos externos). apps/api/src/lib/cache.ts ganha familia de funcoes *ForTenant que devem ser preferidas para caches por-tenant; funcoes sem sufixo permanecem para caches genuinamente globais.
- observacoes: migracao completa dos callers atuais de cache para as versoes ForTenant e follow-up — feito apenas a infra neste commit. Handler de TENANT_PLAN_CHANGED em apps/worker (que faz 'wbc:entitlements:${tenantId}') e candidato imediato para migracao no proximo passo de refactor.

### ACH-011
- titulo: Health checks mínimos; sem readiness distinto de liveness e sem métricas de lag de worker
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: pending
- commit_revisor: none
- arquivos_alterados:
  - apps/api/src/routers/health.ts (adiciona procedures live e ready; ready checa DB, Redis e lag do outbox)
  - apps/worker/src/health-server.ts (novo - HTTP server minimo node:http com /health/live, /health/ready, queue depths e outbox lag)
  - apps/worker/src/index.ts (inicia health server e integra ao graceful shutdown)
  - docker-compose.prod.yml (healthcheck para web via /api/trpc/health.live e para worker via :9100/health/ready)
- descricao_correcao: Separacao clara liveness/readiness conforme convencao Kubernetes. API ganha procedures tRPC live (sempre 200) e ready (DB+Redis+outbox_lag < threshold). Worker ganha HTTP server dedicado em porta configuravel (default 9100) com /health/live, /health/ready e queue depths. Integrado ao graceful shutdown (ACH-009) para fechar limpo. docker-compose.prod.yml ganha healthcheck para web e worker com start_period 30s e 3 retries.
- observacoes: threshold de lag do outbox e configuravel via OUTBOX_READY_LAG_THRESHOLD_MS (default 60000ms); porta do worker health via WORKER_HEALTH_PORT.

### ACH-006
- titulo: Módulo `ai/` diverge do padrão hexagonal (sem `domain/`)
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: pending
- commit_revisor: none
- arquivos_alterados:
  - packages/business/ai/domain/entities.ts (novo - AIModel, AIUsage, AILimit)
  - packages/business/ai/domain/value-objects.ts (novo - totalTokensInWindow, isWithinLimit)
  - packages/business/ai/domain/errors.ts (novo - AILimitExceededError, AIProviderUnavailableError)
  - docs/adr/006-ai-module-model.md (novo - ADR propondo Opcao A vs Opcao B)
- descricao_correcao: Skeleton de domain/ no modulo ai/ disponivel para adocao gradual caso evolua para hexagonal completo. ADR-006 documenta duas opcoes (anemico vs hexagonal completo) e aguarda decisao humana. Codigo atual de ai/ nao depende do skeleton ainda — e cria opcional ate decisao tomada.
- observacoes: classificado corrigivel_parcial — requer decisao de produto/arquiteto entre Opcao A e B antes da materializacao completa.

### ACH-002
- titulo: Topologia de deploy/runtime de produção não documentada
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: pending
- commit_revisor: none
- arquivos_alterados:
  - docs/DEPLOYMENT.md (novo)
- descricao_correcao: docs/DEPLOYMENT.md consolida topologia de producao: diagrama Mermaid, componentes e responsabilidades, conexoes/dependencias/healthchecks, graceful shutdown, env vars criticas, observabilidade. Placeholders para RTO/RPO e failover strategy (marcados como 'pendente validacao humana').
- observacoes: secoes 'Disaster Recovery' e 'Failover' sao placeholders aguardando decisao de produto/ops sobre SLA real.

### ACH-001
- titulo: Documentação arquitetural textual mas sem visualização consolidada
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: pending
- commit_revisor: none
- arquivos_alterados:
  - docs/ARCHITECTURE.md (novo)
- descricao_correcao: docs/ARCHITECTURE.md consolida visao arquitetural: overview 1 pagina, C4 L1 (System Context em Mermaid C4Context), C4 L2 (Containers em flowchart), tabela dos 16 modulos business com responsabilidade, packages compartilhados, regras arquiteturais enforced, matriz de dados (agregado/dono/leitores), filas BullMQ ativas, indice de ADRs. Linka para DEPLOYMENT.md e events.md.
- observacoes: classificado corrigivel_parcial porque conteudo do diagrama foi inferido do codigo/ADRs — humano valida fidelidade antes de virar fonte oficial.

### ACH-004
- titulo: Fluxos de eventos inter-módulos não mapeados em catálogo central
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: pending
- commit_revisor: none
- arquivos_alterados:
  - docs/architecture/events.md (novo)
- descricao_correcao: docs/architecture/events.md cataloga 38 eventos extraidos de packages/shared/src/events/domain-event.ts. Tabela mapeia evento → publisher → consumers → fila BullMQ → descricao. Inclui convencoes de naming, regras para adicionar evento novo, gap conhecido (consumers nao detectados em varredura automatica).
- observacoes: classificado corrigivel_parcial porque coluna 'Consumers' foi preenchida por varredura estatica e pode ter falsos negativos. Humano deve validar e completar onde necessario.

### ACH-010
- titulo: Decisões de resiliência (retry, circuit breaker, DLQ, cleanup) sem ADR
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: pending
- commit_revisor: none
- arquivos_alterados:
  - docs/adr/007-resilience-strategies.md (novo)
- descricao_correcao: ADR-007 documenta as decisoes de resiliencia implementadas nos ACH-008 (centralizacao retry/timeout), ACH-009 (graceful shutdown) e pre-existentes (CircuitBreaker, DLQ, outbox cleanup). Inclui SLOs propostos como placeholder para validacao humana.
- observacoes: classificado corrigivel_parcial porque SLOs propostos (99% entrega, lag p95 30s, etc.) precisam validacao da operacao.

### ACH-003
- titulo: Decisão de monorepo Turborepo+pnpm não registrada em ADR
- severidade: baixo
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: ADR-005 retroativo

### ACH-013
- titulo: Estratégia de escalabilidade horizontal de workers sem ADR
- severidade: baixo
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: ADR-008; placeholders de decisão para validação humana
