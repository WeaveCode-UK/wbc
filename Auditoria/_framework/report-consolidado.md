# Relatório Consolidado de Achados — Framework de Auditoria WeaveCode

- gerado_em: 2026-04-18T19:13:24.090Z
- total_achados: 13
- dominios_em_progresso: 0
- dominios_ready_for_finalize: 0
- dominios_blocked: 0
- dominios_com_historico: 1

## Distribuição por severidade

| Severidade | Total |
|---|---|
| critico | 1 |
| alto | 2 |
| medio | 8 |
| baixo | 2 |
| informativo | 0 |

## Distribuição por status

| Status | Total |
|---|---|
| aberto | 13 |
| confirmado | 0 |
| mitigado | 0 |
| resolvido | 0 |
| aceito | 0 |
| nao_aplicavel | 0 |

## Distribuição por domínio

| Domínio | Total |
|---|---|
| arquitetura | 13 |

## Achados ordenados por severidade

### [critico] ACH-009 — Worker sem graceful shutdown — risco de perda de jobs em-flight

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: operabilidade
- status: aberto
- resumo: O worker em `apps/worker/src/index.ts` inicia 5 workers BullMQ (messaging, campaign, schedule, analytics, dlq) e usa `setInterval` para polling de outbox (5s), cleanup (24h) e DLQ (60s), mas não trata `SIGTERM`/`SIGINT`. Em container restart ou deploy, jobs em-flight são abortados abruptamente, violando a garantia at-least-once declarada no ADR-003 (outbox + BullMQ).
- evidencia.arquivo_ou_area: wbc/apps/worker/src/index.ts, wbc/docker-compose.prod.yml
- impacto.tecnico: Perda silenciosa da garantia "at-least-once" — jobs podem morrer entre `take` e `ack`. Outbox pode ficar inconsistente (evento publicado sem processamento completo). Cleanup e DLQ interrompidos no meio podem deixar estado intermediário.

### [alto] ACH-002 — Topologia de deploy/runtime de produção não documentada

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: contexto
- status: aberto
- resumo: Existem artefatos de deploy (`Dockerfile.web`, `Dockerfile.worker`, `deploy/nginx.conf`, Prometheus alerts, `docker-compose.prod.yml`, scripts de backup), mas nenhum documento arquitetural explica a topologia em produção: quantas réplicas, recursos alocados, dependências de ordem de boot, estratégia de failover, localização (host único vs cluster), RTO/RPO para disaster recovery, estratégia de reconnect do Redis, procedimento de restore de backup.
- evidencia.arquivo_ou_area: wbc/deploy/, wbc/docker-compose.yml, wbc/docker-compose.prod.yml
- impacto.tecnico: Incerteza sobre pontos únicos de falha, latência inter-app, escalabilidade horizontal. Troubleshooting em incidente fica lento por falta de visão consolidada. Dificuldade de validar coerência entre o que foi configurado (nginx, BullMQ workers, réplicas) e o que foi intencionado arquiteturalmente.

### [alto] ACH-005 — Lógica de domínio (cálculos de negócio) vazada em adapters Prisma

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: hexagonal-violation
- status: aberto
- resumo: Adapters Prisma (que deveriam apenas traduzir Prisma ↔ domínio) contêm cálculos de regras de negócio: subtotal, total, desconto, cashback em `sales`; classificação ABC e engagement score em `analytics`; teto/piso de cashback em `sales/cashback`. Isso viola o princípio hexagonal declarado no ADR-001: regras de negócio devem residir em `domain/entities` ou `domain/services`, não em adapters.
- evidencia.arquivo_ou_area: wbc/packages/business/sales/adapters/prisma-sale-repository.ts, wbc/packages/business/analytics/adapters/prisma-analytics-repository.ts, wbc/packages/business/sales/adapters/prisma-cashback-repository.ts
- impacto.tecnico: Cálculos críticos residem onde mudam com schema Prisma; lógica não testável isoladamente (exige setup de DB); difícil mover de Prisma para outro ORM; duplicação potencial se outro adapter precisar da mesma regra.

### [medio] ACH-001 — Documentação arquitetural textual mas sem visualização consolidada

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: documentacao
- status: aberto
- resumo: Projeto tem ADRs formais (hexagonal, multi-tenant, outbox+BullMQ, OTP-only), orquestrador detalhado e regras invioláveis, mas falta um artefato único de visão arquitetural consolidada. Não há diagrama de contexto (C4 Nível 1), mapa de containers (C4 Nível 2), matriz de dados (quem lê/escreve quais tabelas) nem overview executivo de 1-2 páginas. Todo conhecimento arquitetural é textual e disperso entre `docs/adr/`, `begin/`, `CLAUDE.md` e arquivos estruturais.
- evidencia.arquivo_ou_area: wbc/docs/adr/, wbc/begin/, wbc/CLAUDE.md, wbc/README.md
- impacto.tecnico: Onboarding lento — novos desenvolvedores precisam reconstruir a visão arquitetural lendo múltiplos arquivos. Discussões de escopo e impacto ficam mais longas por falta de referência visual compartilhada. Risco de escolhas de design incoerentes por ausência de ancoragem visual da arquitetura.

### [medio] ACH-004 — Fluxos de eventos inter-módulos não mapeados em catálogo central

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: arquitetura-declarada
- status: aberto
- resumo: Eventos de domínio existem em cada módulo business (SaleConfirmed, CashbackGenerated, ClientCreated, etc.) e há implementação outbox + BullMQ (ADR-003), mas não há documentação única consolidada mostrando quais eventos existem, quem publica, quem consome, em qual fila BullMQ cada um roda e qual é o payload canônico. Conhecimento só é reconstrutível lendo arquivos `*.events.ts` e subscribers espalhados.
- evidencia.arquivo_ou_area: wbc/packages/business/*/domain/events.ts (presumido), wbc/packages/business/*/subscribers/ (presumido), wbc/apps/worker/
- impacto.tecnico: Mudanças em eventos (adicionar campo, renomear, remover) exigem busca manual em todo o monorepo; alto risco de subscribers órfãos após refatorações; acoplamento oculto entre módulos que deveriam ser autônomos.

### [medio] ACH-006 — Módulo `ai/` diverge do padrão hexagonal (sem `domain/`)

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: decomposicao
- status: aberto
- resumo: Dos 16 módulos em `packages/business/*`, 15 seguem o shape hexagonal canônico (`domain/`, `ports/`, `adapters/`, `use-cases/`). O módulo `ai/` diverge: não possui pasta `domain/`. Use-cases de AI (geração de texto, etc.) são procedurais, chamam `AIProvider` e `AIRepository` via ports sem encapsular regras de domínio (limites de tokens, políticas de modelo, métricas de uso) em entidades.
- evidencia.arquivo_ou_area: wbc/packages/business/ai/
- impacto.tecnico: Ambiguidade sobre se o módulo é deliberadamente anêmico (gateway puro para provider externo) ou se está incompleto. Regras sobre rate limit de tokens, política de modelo escolhido, quotas, acumulação de uso ficam inline nos use-cases — dificulta teste unitário puro e evolução.

### [medio] ACH-007 — Ausência de enforcement automatizado para regras hexagonal

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: hexagonal-violation
- status: aberto
- resumo: As regras hexagonal (`domain/` não importa de `adapters/`; `use-cases/` importam apenas de `ports/`, não de `adapters/` diretamente; comunicação inter-módulo apenas via eventos) existem apenas como convenção textual em CLAUDE.md e ADRs. Não há linter rule, teste arquitetural automatizado ou hook que previna violação em code review.
- evidencia.arquivo_ou_area: wbc/package.json, wbc/.eslintrc.*, wbc/.husky/ (pre-commit), wbc/docs/adr/001-hexagonal-architecture.md
- impacto.tecnico: Violações arquiteturais passam por code review sem alerta automático; a arquitetura declarada depende exclusivamente de disciplina manual; cada novo dev precisa internalizar as regras antes de contribuir com segurança.

### [medio] ACH-008 — Políticas de retry, timeout e circuit breaker hardcoded em cada adapter externo

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: cross-cutting
- status: aberto
- resumo: Cada adapter que chama serviço externo (WhatsApp N2, DeepSeek, e potencialmente outros) define constantes próprias de `MAX_RETRIES`, `TIMEOUT_MS`, `RETRY_DELAY_MS` e instancia seu próprio `CircuitBreaker` com thresholds locais. Não há política centralizada em `@wbc/shared` ou `config` que padronize ou permita ajuste global.
- evidencia.arquivo_ou_area: wbc/packages/business/messaging/adapters/whatsapp-n2-adapter.ts, wbc/packages/business/ai/adapters/deepseek-adapter.ts
- impacto.tecnico: Ajustar política de retry globalmente exige alterar N adapters; inconsistência entre providers impede observabilidade operacional consolidada; novas integrações tendem a copiar o padrão errado.

### [medio] ACH-010 — Decisões de resiliência (retry, circuit breaker, DLQ, cleanup) sem ADR

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: decisao-sem-adr
- status: aberto
- resumo: `CircuitBreaker` é usado em adapters externos, DLQ processor existe em `apps/worker`, cleanup de outbox roda diariamente — mas não há ADR documentando a estratégia de resiliência: por que circuit breaker com thresholds X, por que DLQ apenas loga (sem API de resgate), por que cleanup é diário.
- evidencia.arquivo_ou_area: wbc/docs/adr/ (não há ADR-005+ de resiliência), wbc/apps/worker/src/processors/dlq-processor.ts, wbc/packages/shared/ (CircuitBreaker)
- impacto.tecnico: Novas integrações repetem o padrão ou divergem sem orientação; não há baseline para discussão de SLO; retrabalho caso a estratégia precise mudar.

### [medio] ACH-011 — Health checks mínimos; sem readiness distinto de liveness e sem métricas de lag de worker

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: operabilidade
- status: aberto
- resumo: Endpoint de health em `apps/api` verifica apenas ping de DB e Redis. Não há distinção entre readiness (pronto para receber tráfego) e liveness (processo vivo). Worker não expõe endpoint de health nem métricas de lag (profundidade de filas BullMQ, idade do outbox mais antigo, contagem de DLQ). Docker Compose tem healthcheck para Postgres/Redis mas não para web/worker.
- evidencia.arquivo_ou_area: wbc/apps/api/src/routers/health.ts (presumido, conforme agente), wbc/apps/worker/src/index.ts, wbc/docker-compose.prod.yml
- impacto.tecnico: Orchestrator (Docker/Kubernetes) não consegue detectar worker travado ou faminto; Prometheus alertas não disparam para starvation; incidente só aparece quando usuário reclama.

### [medio] ACH-012 — Isolamento multi-tenant em Redis depende apenas de convenção de prefixo manual

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: seguranca-estrutural
- status: aberto
- resumo: Redis único compartilhado entre todos os tenants para cache (entitlements), BullMQ queues e outbox sub. O isolamento por tenant depende de cada código cliente incluir manualmente o `tenantId` no prefixo de chave (ex: `wbc:entitlements:${tenantId}`), sem enforcement automatizado. O ADR-002 declara multi-tenant com tenantId obrigatório em queries Prisma, mas essa disciplina não é replicada em Redis via infra.
- evidencia.arquivo_ou_area: wbc/docker-compose.prod.yml (único Redis), wbc/apps/api/src/lib/cache.ts, wbc/apps/api/src/lib/queues.ts, wbc/apps/worker/src/index.ts
- impacto.tecnico: Possível vazamento cruzado acidental se um desenvolvedor esquecer o prefixo; padrões de latência de fila de um tenant podem ser inferidos por outro (baixo risco mas existe).

### [baixo] ACH-003 — Decisão de monorepo Turborepo + pnpm workspaces não registrada em ADR

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: arquitetura-declarada
- status: aberto
- resumo: O projeto usa pnpm workspaces + Turborepo (visível em `package.json`, `pnpm-workspace.yaml`, `turbo.json`), mas não há ADR justificando a escolha, documentando os trade-offs frente a polirepo/multirepo, nem as regras de workspace (quando criar novo package, quando promover código compartilhado, convenção de nomes).
- evidencia.arquivo_ou_area: wbc/turbo.json, wbc/package.json, wbc/pnpm-workspace.yaml, wbc/docs/adr/
- impacto.tecnico: Novos devs desconhecem a razão da estrutura; risco de decisões incoerentes de build/deploy/versionamento por falta de referência. Pode dificultar justificativa técnica em revisão arquitetural.

### [baixo] ACH-013 — Estratégia de escalabilidade horizontal de workers sem ADR

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: decisao-sem-adr
- status: aberto
- resumo: A separação API/Worker em containers distintos (evidenciada em `docker-compose.prod.yml`) permite deploy independente e suporta múltiplos workers BullMQ. Porém, não há ADR documentando estratégia de escalabilidade horizontal: escalar 1 worker pool único vs workers especializados por tipo de job, job affinity, particionamento de queue por tenant, limites de pool Prisma por worker.
- evidencia.arquivo_ou_area: wbc/apps/worker/, wbc/docker-compose.prod.yml, wbc/docs/adr/
- impacto.tecnico: Escalar hoje é possível mas exige engenharia manual; decisões improvisadas podem diluir throughput (ex: 2 workers no mesmo queue sem particionamento).
