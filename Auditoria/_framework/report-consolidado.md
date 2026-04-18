# Relatório Consolidado de Achados — Framework de Auditoria WeaveCode

- gerado_em: 2026-04-18T21:05:39.447Z
- total_achados: 35
- dominios_em_progresso: 0
- dominios_ready_for_finalize: 0
- dominios_blocked: 0
- dominios_com_historico: 2

## Distribuição por severidade

| Severidade | Total |
|---|---|
| critico | 2 |
| alto | 7 |
| medio | 19 |
| baixo | 6 |
| informativo | 1 |

## Distribuição por status

| Status | Total |
|---|---|
| aberto | 13 |
| confirmado | 22 |
| mitigado | 0 |
| resolvido | 0 |
| aceito | 0 |
| nao_aplicavel | 0 |

## Distribuição por domínio

| Domínio | Total |
|---|---|
| arquitetura | 13 |
| codigo-manutenibilidade | 22 |

## Achados ordenados por severidade

### [critico] ACH-009 — Worker sem graceful shutdown — risco de perda de jobs em-flight

- dominio: arquitetura
- run: 2026-04-18_18-17-50 (finalized)
- categoria: operabilidade
- status: aberto
- resumo: O worker em `apps/worker/src/index.ts` inicia 5 workers BullMQ (messaging, campaign, schedule, analytics, dlq) e usa `setInterval` para polling de outbox (5s), cleanup (24h) e DLQ (60s), mas não trata `SIGTERM`/`SIGINT`. Em container restart ou deploy, jobs em-flight são abortados abruptamente, violando a garantia at-least-once declarada no ADR-003 (outbox + BullMQ).
- evidencia.arquivo_ou_area: wbc/apps/worker/src/index.ts, wbc/docker-compose.prod.yml
- impacto.tecnico: Perda silenciosa da garantia "at-least-once" — jobs podem morrer entre `take` e `ack`. Outbox pode ficar inconsistente (evento publicado sem processamento completo). Cleanup e DLQ interrompidos no meio podem deixar estado intermediário.

### [critico] ACH-001 — TODOs críticos em auth — token storage, email sender e reset não implementados

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: completude-implementacao
- status: confirmado
- resumo: Fluxos de password reset, email verification e request-email-verification geram token mas não persistem no Redis nem validam no consumo; adapter Resend é stub. Bloqueia uso em produção dos fluxos de auth por link.
- evidencia.arquivo_ou_area: packages/business/auth/use-cases/verify-email.use-case.ts:11; reset-password.use-case.ts:16; request-email-verification.use-case.ts:21; request-password-reset.use-case.ts:22; packages/business/auth/adapters/resend-email-sender.adapter.ts:7
- impacto.tecnico: Código parece funcional mas não completa o fluxo; depuração difícil porque o caminho feliz emite eventos sem efeito

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

### [alto] ACH-002 — `index.ts` de packages/business expõe adapters e use-cases sem barreira

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: boundary-e-coesao
- status: confirmado
- resumo: Os barrel exports em `packages/business/<modulo>/index.ts` reexportam `domain/`, `adapters/` e `use-cases/` inteiros. Consumidores podem importar `PrismaClientRepository` diretamente, violando o boundary da arquitetura hexagonal.
- evidencia.arquivo_ou_area: packages/business/auth/index.ts; packages/business/clients/index.ts; packages/business/catalog/index.ts; packages/business/inventory/index.ts; packages/business/messaging/index.ts; packages/business/sales/index.ts; packages/business/schedule/index.ts
- impacto.tecnico: Refatorar adapter (ex: trocar driver Prisma) quebra consumidores em cascata; dependency-cruiser sozinho não impede se import vem por barrel

### [alto] ACH-003 — Ausência de composition root — repositórios instanciados como singletons no topo dos routers

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: injecao-de-dependencia
- status: confirmado
- resumo: Cada router tRPC cria suas próprias instâncias de `PrismaXxxRepository` no escopo do módulo. Não existe factory, container ou contexto central. Padrão replica em todos os routers e em adapters internos.
- evidencia.arquivo_ou_area: apps/api/src/routers/auth.ts:61-68; apps/api/src/routers/clients.ts:15-16; apps/api/src/routers/sales.ts:20-23; apps/api/src/routers/catalog.ts:12-14; apps/api/src/lib/queues.ts:4-31; apps/api/src/lib/redis.ts:7
- impacto.tecnico: Troca de implementação exige editar N arquivos; testes unitários inviáveis sem mock de módulo; difícil aplicar decorators (ex: cache, tracing, feature flag) sem modificar cada router

### [alto] ACH-004 — Schemas Zod duplicados entre `packages/validators` e routers inline

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: duplicacao-e-consistencia
- status: confirmado
- resumo: `packages/validators/src/clients.ts` define `createClientSchema` completo, mas `apps/api/src/routers/clients.ts` reescreve schema equivalente inline. Adicionar um campo exige mudança em 5+ lugares (Prisma, domain, validators, router inline, UI).
- evidencia.arquivo_ou_area: packages/validators/src/clients.ts:4-46 versus apps/api/src/routers/clients.ts:20-54
- impacto.tecnico: Alto risco de desincronia validador vs API; regra de negócio duplicada

### [alto] ACH-007 — Callback `jwt` em `auth.config.ts` com lógica complexa e estado mutável

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: complexidade-cognitiva
- status: confirmado
- resumo: O callback `jwt` em `apps/web/src/lib/auth.config.ts` (~50 linhas, aninhamento ≥4) resolve workspace membership, detecta onboarding/selection, e responde a triggers `update`. Cinco campos do token (`tid`, `mid`, `role`, `plan`, `needsOnboarding`) são mutados em combinações distintas.
- evidencia.arquivo_ou_area: apps/web/src/lib/auth.config.ts:65-114
- impacto.tecnico: Difícil testar combinações; regressão silenciosa provável em mudanças de regra; debug em produção depende de logs de sessão

### [alto] ACH-013 — Side-effects pesados no entry-point ao importar módulos

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: testabilidade
- status: confirmado
- resumo: `apps/api/src/index.ts` e `apps/worker/src/index.ts` executam `initTracing`, `initSentry`, `applyTenantMiddleware`, abrem conexões Redis e registram `setInterval` no topo do arquivo. Importar qualquer símbolo dispara todo o bootstrap.
- evidencia.arquivo_ou_area: apps/api/src/index.ts:1-24; apps/worker/src/index.ts:1-74
- impacto.tecnico: Impede testes de unidade por import direto; dificulta múltiplos modos (ex: CLI sem tracing)

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

### [medio] ACH-005 — `packages/shared` é saco de utilitários incoeso (tema UI + infra + eventos + resiliência)

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: coesao-de-pacote
- status: confirmado
- resumo: `packages/shared/src/index.ts` exporta tema (cores, tipografia), circuit-breaker, Redis, event-publisher, outbox-service, security-logger, prisma-helpers, resilience policies. Responsabilidades ortogonais no mesmo pacote.
- evidencia.arquivo_ou_area: packages/shared/src/index.ts (15 reexports)
- impacto.tecnico: Tree-shaking prejudicado; bundles maiores no cliente; mudança em infra atinge UI indiretamente

### [medio] ACH-006 — Singleton global de `PrismaClient` em `packages/db` sem contrato de ciclo de vida

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: isolamento-multi-tenant
- status: confirmado
- resumo: `packages/db/src/index.ts` exporta `prisma` como singleton compartilhado via `globalThis`. O isolamento multi-tenant depende de middleware + AsyncLocalStorage global. Testar lógica que toque Prisma exige mocks invasivos e qualquer request sem tenant setado pode vazar por omissão.
- evidencia.arquivo_ou_area: packages/db/src/index.ts:4-14; packages/db/src/tenant-context.ts
- impacto.tecnico: Riscos sutis de data leak cross-tenant em race conditions; testes de unidade em `packages/business/*/adapters/*.ts` impossíveis sem DB real

### [medio] ACH-008 — Router `auth.ts` com 391 linhas e 17 procedures heterogêneas

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: god-file
- status: confirmado
- resumo: `apps/api/src/routers/auth.ts` concentra instanciação de 8 repositórios + 17 procedures misturando signup, login, invites, OTP e logout. Funções como `acceptInvite` misturam validação, comandos e leitura.
- evidencia.arquivo_ou_area: apps/api/src/routers/auth.ts (391 linhas, 17 procedures)
- impacto.tecnico: Alto risco de conflito em PRs; entendimento parcial obrigatório para qualquer mudança

### [medio] ACH-009 — Type casting `as unknown as X` em mappers Prisma e Redis sem justificativa

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: tipagem
- status: confirmado
- resumo: Ocorrências de `as unknown as Record<string, unknown>` e `as unknown as typeof redisClient` em caminhos críticos (idempotência, cache, mappers de venda/OTP). Mascara falhas de tipagem e oculta dívida de schema.
- evidencia.arquivo_ou_area: apps/api/src/trpc/idempotency-middleware.ts:7; apps/api/src/lib/cache.ts:20; packages/business/sales/adapters/prisma-sale-repository.ts:11-27,40-42,66,113,133
- impacto.tecnico: Falsos positivos em mudanças de schema; checker TypeScript perde capacidade de alertar

### [medio] ACH-010 — Números mágicos espalhados para TTLs, intervalos, janelas e thresholds

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: configuracao-e-constantes
- status: confirmado
- resumo: Valores como 5000 (outbox poll), 60_000 (DLQ scan / rate window), 24*60*60*1000 (cleanup diário), 300 (TTL cache) aparecem hardcoded em múltiplos arquivos. Não há `constants/timings.ts` central.
- evidencia.arquivo_ou_area: apps/worker/src/index.ts:74,118,130; apps/api/src/lib/cache.ts:7,139,141; apps/api/src/trpc/rate-limit-middleware.ts:9-10; apps/worker/src/health-server.ts
- impacto.tecnico: Alterar política exige grep-and-replace; inconsistência entre ambientes

### [medio] ACH-011 — Duplicação de mapeamento entidade↔Prisma em múltiplos adapters

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: duplicacao
- status: confirmado
- resumo: Mappers `toDomain`/`toPrisma` reescrevem o mesmo padrão de projeção em `sales`, `clients`, `auth/otp`. Mudança de entidade exige editar N adapters sem base comum.
- evidencia.arquivo_ou_area: packages/business/sales/adapters/prisma-sale-repository.ts:11-27; packages/business/auth/adapters/prisma-otp-repository.ts:22-52; packages/business/clients/adapters/prisma-client-repository.ts (projeções repetidas)
- impacto.tecnico: Alto risco de drift entre adapters após mudança de entidade

### [medio] ACH-012 — Literais de status/enum espalhados em filtros Prisma

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: consistencia-de-dominio
- status: confirmado
- resumo: Valores como `"CONFIRMED"`, `"DELIVERED"`, `"DRAFT"` aparecem hardcoded em filtros Prisma de diferentes adapters, sem enum/tipo central garantindo exclusividade e refactor-safety.
- evidencia.arquivo_ou_area: packages/business/sales/adapters/prisma-sale-repository.ts:88-96,124-131 (e outros)
- impacto.tecnico: Adicionar novo status exige caçar todos os filtros; bug silencioso se filtro esquecido

### [medio] ACH-014 — Acesso a `process.env` disperso sem camada de configuração tipada

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: configuracao
- status: confirmado
- resumo: 22+ leituras de `process.env.*` em apps/api, apps/worker, apps/web. Padrão `process.env.X ?? 'default'` replicado sem validação centralizada (Zod/env-schema).
- evidencia.arquivo_ou_area: apps/api/src/lib/redis.ts:5; apps/worker/src/index.ts:96; apps/api/src/routers/health.ts; apps/worker/src/health-server.ts; ...
- impacto.tecnico: Difícil descobrir onde um timeout/flag é lido; ausência de validação permite boot com config errada

### [medio] ACH-015 — `cacheInvalidatePattern` sem batching/backpressure em Redis SCAN

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: complexidade-e-risco-de-manutencao
- status: confirmado
- resumo: Loop aninhado `for await (const keys of stream) { for (const key of keys) pipeline.del(key) }` acumula milhares de comandos em pipeline único sem limite antes do `exec()`.
- evidencia.arquivo_ou_area: apps/api/src/lib/cache.ts:113-134
- impacto.tecnico: Em tenant grande, pipeline pode estourar timeout ou memória do worker Redis

### [medio] ACH-016 — Comunicação inter-módulo sem domain events — poucas filas BullMQ

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: modularidade
- status: confirmado
- resumo: `apps/api/src/lib/queues.ts` expõe apenas 3 filas (analytics, campaigns, messaging). Não há eventos de domínio (ex.: `ClientCreated`, `SaleConfirmed`) publicados cruzando módulos business. Módulos acoplam-se via chamadas diretas.
- evidencia.arquivo_ou_area: apps/api/src/lib/queues.ts:1-31; ausência de publishers em use-cases clientes/vendas
- impacto.tecnico: Acoplamento forte entre módulos; mudanças em um módulo disparam refactor em consumidores síncronos

### [medio] ACH-018 — Ausência de mapper testável de erros de domínio → HTTP/tRPC

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: analisabilidade
- status: confirmado
- resumo: Erros de domínio (`DuplicatePhoneError`, `InvalidClientDataError`, etc.) são lançados, mas não há função pura que os mapeia para `TRPCError` com status/code/mensagem padronizados. Conversão é implícita no error handler global.
- evidencia.arquivo_ou_area: packages/business/clients/domain/errors.ts; apps/api/src/trpc/trpc.ts:51-61 (domainErrorMiddleware sem mapper explícito por tipo)
- impacto.tecnico: Difícil testar mapeamento; mudança de mensagem pode afetar consumidores sem aviso

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

### [baixo] ACH-017 — Analytics `getDashboard()` como god function com múltiplas queries e resultado monolítico

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: coesao-de-funcao
- status: confirmado
- resumo: `packages/business/analytics/adapters/prisma-analytics-repository.ts:18-70` executa 4 queries agregadas em `Promise.all` e retorna objeto único; campo `alerts` hardcoded `[]`; impede cache granular.
- evidencia.arquivo_ou_area: packages/business/analytics/adapters/prisma-analytics-repository.ts:18-70
- impacto.tecnico: Não dá para cachear métricas individualmente; mudança em uma métrica recompila tudo

### [baixo] ACH-019 — Comentários em caminhos críticos descrevem O QUÊ, não o PORQUÊ

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: documentacao-de-codigo
- status: confirmado
- resumo: Comentários em `apps/api/src/lib/cache.ts:13-32` descrevem lazy-init sem explicar razão do isolamento tenant-scoped. Referências opacas a "ACH-012" do repo de origem.
- evidencia.arquivo_ou_area: apps/api/src/lib/cache.ts:13-32
- impacto.tecnico: Onboarding lento; risco de uso incorreto de `getRedis()` vs `getTenantScopedRedis()`

### [baixo] ACH-020 — Estilo misto (classe vs função) para use-cases sem critério documentado

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: convencao
- status: confirmado
- resumo: Alguns use-cases são classes com método `execute()` (auth), outros são funções assíncronas puras (clients/messaging). Sem regra declarada, padrão depende de quem escreveu.
- evidencia.arquivo_ou_area: packages/business/auth/use-cases/* versus packages/business/clients/use-cases/manage-tags.ts
- impacto.tecnico: Pattern matching do time varia; templates novos herdam ambos os estilos

### [baixo] ACH-022 — Duplicação de helper `getRedis()` entre adapter de auth e lib de api

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: duplicacao
- status: confirmado
- resumo: `packages/business/auth/adapters/prisma-otp-repository.ts:11-16` define `getRedis()` local; `apps/api/src/lib/redis.ts` define outro. Dois singletons Redis potenciais.
- evidencia.arquivo_ou_area: packages/business/auth/adapters/prisma-otp-repository.ts:11-16; apps/api/src/lib/redis.ts
- impacto.tecnico: Vazamento de conexão em produção; comportamento inconsistente

### [informativo] ACH-021 — Importações relativas profundas em vez dos aliases `@wbc/*`

- dominio: codigo-manutenibilidade
- run: 2026-04-18_21-45-58 (finalized)
- categoria: convencao
- status: confirmado
- resumo: Alguns routers importam via `../../../../packages/business/...` enquanto `tsconfig.json` define aliases `@wbc/*`.
- evidencia.arquivo_ou_area: apps/api/src/routers/clients.ts:4-5 (imports relativos profundos)
- impacto.tecnico: Baixo; quebra só em moves agressivos
