# Achados da Auditoria

## Identificação
- dominio: arquitetura
- run_id: 2026-03-25_12-45-00
- ultima_atualizacao: 2026-03-25 13:15:00

## Regras de Registro
- Registrar apenas achados reais com evidência observável.
- Não registrar opinião vaga sem base no repositório.
- Cada achado deve ter ID único dentro da run.
- Cada achado deve ter severidade definida.
- Se o item não for confirmado, registrar como hipótese com justificativa.

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

### ACH-001
- titulo: Violação de arquitetura hexagonal em 15 use-cases com import direto de Prisma
- severidade: alto
- categoria: boundaries e dependências
- status: confirmado
- resumo: 15 arquivos de use-cases em packages/business importam diretamente @wbc/db (Prisma), bypassing a camada de adapters/ports. Isso viola a regra declarada de que domain e use-cases nunca importam de adapters.

#### Evidencia
- arquivo_ou_area: packages/business/analytics/use-cases/get-dashboard.ts, packages/business/analytics/use-cases/get-stats.ts, packages/business/schedule/use-cases/manage-appointments.ts, packages/business/schedule/use-cases/notifications.ts, packages/business/landing/use-cases/manage-landing.ts, packages/business/platform/use-cases/manage-platform.ts, packages/business/finance/use-cases/calculators.ts, packages/business/finance/use-cases/get-dashboard.ts, packages/business/sales/use-cases/create-return.ts, packages/business/team/use-cases/get-ranking.ts, packages/business/ai/use-cases/generate-text.ts, packages/business/campaigns/use-cases/manage-templates.ts, packages/business/messaging/use-cases/quick-replies.ts, packages/business/messaging/use-cases/auto-messages.ts, packages/business/messaging/use-cases/post-sale-flow.ts
- detalhe: Esses use-cases fazem chamadas diretas a prisma.model.findMany/create/update ao inves de receber repositorios injetados via ports.

#### Impacto
- tecnico: Acoplamento direto ao ORM impede testabilidade unitaria dos use-cases, viola a regra hexagonal declarada e torna refactoring de persistencia caro.
- negocio: Aumenta risco de regressao em mudancas de schema e dificulta migracao futura para outro store.

#### Recomendacao
- acao_sugerida: Criar ports (interfaces de repositorio) para os modulos afetados e mover logica Prisma para adapters. Use-cases devem receber repositorios injetados.
- prioridade: alta

#### Observacoes
- Modulos analytics e schedule nao possuem nenhum port/adapter — toda logica de dados esta nos use-cases.

---

### ACH-002
- titulo: Maturidade hexagonal inconsistente entre modulos
- severidade: medio
- categoria: coesão e padronização
- status: confirmado
- resumo: Modulos como sales, clients e catalog possuem ports e adapters bem definidos. Modulos como analytics, schedule, platform e messaging possuem infraestrutura hexagonal incompleta (0 ports, 0 adapters, ou parciais).

#### Evidencia
- arquivo_ou_area: packages/business/analytics/ (0 ports, 0 adapters), packages/business/schedule/ (0 ports, 0 adapters), packages/business/platform/ (1 port, 1 adapter), packages/business/messaging/ (1 port, 3 adapters — incompleto)
- detalhe: Comparacao direta entre modulos mostra divergencia significativa na aderencia ao padrao hexagonal.

#### Impacto
- tecnico: Inconsistencia dificulta onboarding, navegacao do codigo e aplicacao uniforme de padroes de teste e refactoring.
- negocio: Aumenta custo de manutencao proporcional ao numero de modulos inconsistentes.

#### Recomendacao
- acao_sugerida: Padronizar todos os 15 modulos com pelo menos ports de repositorio e adapters Prisma correspondentes.
- prioridade: media

#### Observacoes
- none

---

### ACH-003
- titulo: Event handlers definidos mas nunca registrados no bootstrap da aplicacao
- severidade: alto
- categoria: comunicação entre módulos
- status: confirmado
- resumo: Existem 3 funcoes de registro de event handlers (registerInventoryEventHandlers, registerPostSaleEventHandler, registerNotificationEventHandlers) mas nenhuma delas e chamada em apps/api/src/index.ts nem em apps/worker/src/index.ts. Eventos sao salvos no outbox mas handlers nunca executam.

#### Evidencia
- arquivo_ou_area: packages/business/inventory/, packages/business/messaging/, packages/business/schedule/ (handlers definidos), apps/api/src/index.ts e apps/worker/src/index.ts (nenhum import dos handlers)
- detalhe: Grep por registerInventoryEventHandlers, registerPostSaleEventHandler e registerNotificationEventHandlers nao encontra chamadas fora da propria definicao.

#### Impacto
- tecnico: Comunicacao assincrona entre modulos (regra inviolavel do CLAUDE.md) nao funciona na pratica. Side effects de eventos como SALE_CONFIRMED nao disparam.
- negocio: Funcionalidades que dependem de eventos (atualizacao de estoque pos-venda, fluxo pos-venda, lembretes) nao operam.

#### Recomendacao
- acao_sugerida: Registrar todos os event handlers no bootstrap do worker ou do API, garantindo que o outbox processor dispare os handlers corretamente.
- prioridade: alta

#### Observacoes
- O outbox pattern esta implementado (prisma-outbox-repository.ts), mas o ciclo completo nao fecha.

---

### ACH-004
- titulo: BullMQ queues definidas mas nao integradas com logica de negocio
- severidade: alto
- categoria: comunicação entre módulos
- status: confirmado
- resumo: 6 filas BullMQ estao definidas em apps/worker/src/queues/index.ts (messaging, campaigns, schedule, analytics, outbox, dlq) mas nenhum processor esta registrado e nenhum job e submetido pelo API ou business modules.

#### Evidencia
- arquivo_ou_area: apps/worker/src/queues/index.ts (definicoes), apps/worker/src/processors/ (vazio ou sem registros), apps/api/src/routers/ (nenhum job.add encontrado)
- detalhe: CLAUDE.md declara "Comunicacao entre modulos: APENAS eventos assincronos (BullMQ)" mas BullMQ nao esta integrado.

#### Impacto
- tecnico: A arquitetura de comunicacao assincrona declarada nao esta operacional. Modulos que deveriam se comunicar via filas estao isolados ou nao se comunicam.
- negocio: Campanhas agendadas, notificacoes assincronas e processamento em background nao funcionam.

#### Recomendacao
- acao_sugerida: Implementar processors para cada fila definida e integrar submissao de jobs nos pontos relevantes da API e dos use-cases.
- prioridade: alta

#### Observacoes
- DLQ (dead letter queue) esta definida mas sem consumer.

---

### ACH-005
- titulo: 3 documentos de referencia citados no CLAUDE.md nao existem no repositorio
- severidade: medio
- categoria: documentação arquitetural
- status: confirmado
- resumo: CLAUDE.md referencia WBC-Arquitetura-Tecnica-v1.0.md, WBC-Implementacao-v1.0.md e WBC-Funcionalidades-v1.2.md como documentos em begin/, mas nenhum deles existe.

#### Evidencia
- arquivo_ou_area: CLAUDE.md (linhas 58-60), begin/ (arquivos ausentes)
- detalhe: Glob e ls confirmam que esses 3 arquivos nao estao presentes em begin/ nem em qualquer outro diretorio.

#### Impacto
- tecnico: Referencias mortas em CLAUDE.md confundem agentes e desenvolvedores sobre fontes de verdade disponiveis.
- negocio: Documentacao de 105 funcionalidades e especificacao de schema/rotas nao esta acessivel.

#### Recomendacao
- acao_sugerida: Criar os documentos referenciados ou corrigir as referencias no CLAUDE.md para apontar para os documentos reais (WBC_FASES_E_EPICOS.md contem parte dessas informacoes).
- prioridade: media

#### Observacoes
- none

---

### ACH-006
- titulo: Ausencia de ADRs (Architecture Decision Records) no repositorio
- severidade: medio
- categoria: documentação arquitetural
- status: confirmado
- resumo: Nao existem Architecture Decision Records em nenhum local do repositorio. Decisoes como escolha de hexagonal, outbox pattern, BullMQ, Auth.js OTP, multi-tenant RLS nao possuem registro de contexto, alternativas consideradas ou justificativa.

#### Evidencia
- arquivo_ou_area: raiz do repositorio, begin/, docs/ (inexistente)
- detalhe: Busca por ADR, adr, decision-record em todo o repositorio nao retorna resultados.

#### Impacto
- tecnico: Desenvolvedores futuros nao tem como entender por que decisoes foram tomadas, aumentando risco de reversoes acidentais.
- negocio: Custos de onboarding e tomada de decisao futura aumentam.

#### Recomendacao
- acao_sugerida: Criar diretorio docs/adr/ e registrar pelo menos as decisoes arquiteturais mais significativas (hexagonal, multi-tenant RLS, outbox, BullMQ, Auth.js OTP-only).
- prioridade: media

#### Observacoes
- none

---

### ACH-007
- titulo: Ausencia de configuracao de deploy para producao
- severidade: medio
- categoria: topologia de deploy
- status: confirmado
- resumo: O repositorio possui apenas docker-compose.yml para desenvolvimento local (PostgreSQL + Redis). Nao existe Dockerfile, configuracao Kubernetes, scripts de deploy cloud, nem qualquer artefato de infraestrutura para producao.

#### Evidencia
- arquivo_ou_area: docker-compose.yml (somente postgres e redis para dev), raiz do repositorio (nenhum Dockerfile, helm/, k8s/, terraform/, .github/workflows de deploy)
- detalhe: A topologia de execucao real (5 apps: api, web, mobile, landing, worker) nao possui nenhum artefato de empacotamento ou deploy.

#### Impacto
- tecnico: Impossivel fazer deploy controlado em qualquer ambiente alem do local.
- negocio: Projeto nao pode ir para producao sem criar toda a infraestrutura de deploy.

#### Recomendacao
- acao_sugerida: Criar Dockerfiles para api, web, worker e landing. Definir estrategia de deploy (PaaS, containers, serverless) e configurar pipeline CI/CD.
- prioridade: media

#### Observacoes
- Impacto mitigado se o projeto ainda estiver em fase de desenvolvimento ativo pre-producao.

---

### ACH-008
- titulo: Redis como ponto unico de falha para filas e cache sem fallback
- severidade: medio
- categoria: pontos unicos de falha
- status: confirmado
- resumo: Redis e obrigatorio para BullMQ e cache. Nao existe graceful degradation nem fallback se Redis ficar indisponivel. A conexao e configurada sem sentinel, cluster ou retry strategy robusto.

#### Evidencia
- arquivo_ou_area: apps/worker/src/queues/index.ts (new Redis sem fallback), apps/api/src/lib/redis.ts e apps/api/src/lib/cache.ts
- detalhe: Conexao Redis usa string simples (REDIS_URL ou localhost:6379/0) sem sentinel, cluster, reconnect strategy ou circuit breaker.

#### Impacto
- tecnico: Se Redis cair, filas param, cache falha e o sistema pode ficar parcialmente ou totalmente indisponivel.
- negocio: Risco de indisponibilidade operacional em producao.

#### Recomendacao
- acao_sugerida: Implementar reconnect strategy com backoff, considerar Redis Sentinel ou cluster para producao, e implementar graceful degradation para cache (fallback para bypass sem cache).
- prioridade: media

#### Observacoes
- Risco mitigado se Redis em producao for gerenciado (ex: AWS ElastiCache, Redis Cloud).

---

### ACH-009
- titulo: Import direto de Prisma em router de messaging da API
- severidade: baixo
- categoria: boundaries e dependências
- status: confirmado
- resumo: O router apps/api/src/routers/messaging.ts faz chamada direta a prisma.client.findFirst em vez de usar o repositorio injetado, violando a separacao de camadas no nivel da API.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/messaging.ts (linhas ~25-27)
- detalhe: Chamada direta prisma.client.findFirst com where/select ao inves de delegar para use-case com repositorio.

#### Impacto
- tecnico: Violacao pontual de boundary. Risco baixo mas estabelece precedente.
- negocio: Impacto minimo.

#### Recomendacao
- acao_sugerida: Mover a consulta para o use-case correspondente com repositorio injetado.
- prioridade: baixa

#### Observacoes
- health.ts tambem importa Prisma diretamente, mas isso e aceitavel para health check de infraestrutura.
