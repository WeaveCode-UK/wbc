# Achados da Auditoria

## Identificacao
- dominio: apis-integracoes
- run_id: 2026-04-05_18-00-00
- ultima_atualizacao: 2026-04-05 18:30:00

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

### ACH-AI-001
- titulo: Domain error mapping abrangente com 37 classes de erro
- severidade: informativo
- categoria: tratamento-erros
- status: confirmado
- resumo: O error-handler.ts mapeia 37 classes de erro de dominio para codigos tRPC corretos (NOT_FOUND, BAD_REQUEST, CONFLICT, TOO_MANY_REQUESTS). O middleware domainErrorMiddleware em trpc.ts captura erros nao-tRPC, envia ao Sentry e delega para o mapper.

#### Evidencia
- arquivo_ou_area: apps/api/src/trpc/error-handler.ts, apps/api/src/trpc/trpc.ts:51-61
- detalhe: 4 categorias de erro mapeadas: NOT_FOUND (19 classes), BAD_REQUEST (11 classes), CONFLICT (5 classes), TOO_MANY_REQUESTS (2 classes).

#### Impacto
- tecnico: Erros de dominio sao traduzidos corretamente para semantica HTTP.
- negocio: Clientes da API recebem codigos de erro significativos.

#### Recomendacao
- acao_sugerida: Nenhuma. Implementacao solida.
- prioridade: nenhuma

#### Observacoes
- Achado positivo. O uso de constructor.name para mapping e fragil a minificacao, mas em Node.js server-side isso nao e problema.

---

### ACH-AI-002
- titulo: Idempotencia implementada em 5 mutations criticas
- severidade: informativo
- categoria: idempotencia
- status: confirmado
- resumo: O middleware de idempotencia usa Redis com TTL de 24h e esta aplicado nas mutations de createSale, confirmSale, markPaid, createReturn (via idempotencyKey opcional). Implementacao com graceful degradation (Redis indisponivel = sem cache, nao falha).

#### Evidencia
- arquivo_ou_area: apps/api/src/trpc/idempotency-middleware.ts, apps/api/src/routers/sales.ts
- detalhe: `idempotent()` wrapper verifica Redis antes de executar o handler. Se key existe, retorna cached result.

#### Impacto
- tecnico: Previne duplicacoes em operacoes financeiras criticas.
- negocio: Protecao contra double-submit em vendas e pagamentos.

#### Recomendacao
- acao_sugerida: Considerar tornar idempotencyKey obrigatorio (nao optional) nas mutations financeiras.
- prioridade: baixa

#### Observacoes
- Achado positivo.

---

### ACH-AI-003
- titulo: API versioning via health.version endpoint
- severidade: informativo
- categoria: versionamento
- status: confirmado
- resumo: O endpoint health.version retorna apiVersion e minMobileVersion, permitindo ao app mobile checar compatibilidade. Constantes vem do pacote @wbc/shared.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/health.ts:10-13, packages/shared/src/version.ts
- detalhe: `publicProcedure.query(() => ({ apiVersion: API_VERSION, minMobileVersion: MIN_MOBILE_VERSION }))`

#### Impacto
- tecnico: Permite forced update no mobile e negociacao de versao.
- negocio: Garante que usuarios estejam em versao suportada.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

#### Observacoes
- Achado positivo.

---

### ACH-AI-004
- titulo: Rate limiting em dois niveis (publico e protegido)
- severidade: informativo
- categoria: protecao-api
- status: confirmado
- resumo: Rate limiting implementado via Redis com 30 req/min para endpoints publicos e 100 req/min para protegidos. Chave inclui path + identifier para granularidade por endpoint.

#### Evidencia
- arquivo_ou_area: apps/api/src/trpc/rate-limit-middleware.ts
- detalhe: PUBLIC_LIMIT: 30/60s, PROTECTED_LIMIT: 100/60s. Usa Redis INCR + EXPIRE atomico.

#### Impacto
- tecnico: Protecao contra abuse e DDoS basico.
- negocio: Servico estavel para todos os tenants.

#### Recomendacao
- acao_sugerida: Nenhuma. Limites razoaveis para MVP.
- prioridade: nenhuma

#### Observacoes
- Achado positivo.

---

### ACH-AI-005
- titulo: Validacao de input com Zod em todos os endpoints
- severidade: informativo
- categoria: validacao
- status: confirmado
- resumo: Todos os endpoints tRPC usam schemas Zod para validacao de input. Schemas reutilizaveis (paginationSchema, uuidSchema) vem de @wbc/validators.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/*.ts, packages/validators/src
- detalhe: z.object com tipos estritos em create, update, list. Sem inputs sem validacao.

#### Impacto
- tecnico: Previne dados invalidos na camada de API.
- negocio: nenhum impacto direto.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

#### Observacoes
- Achado positivo.

---

### ACH-AI-006
- titulo: Health checks cobrem DB e Redis mas nao worker
- severidade: baixo
- categoria: health-checks
- status: confirmado
- resumo: Os health checks (tRPC health.db e health.redis + HTTP /api/health) verificam conectividade do database e Redis. Nao ha verificacao de saude do worker (BullMQ queues).

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/health.ts, apps/web/src/app/api/health/route.ts
- detalhe: health.db faz SELECT 1, health.redis faz ping. Nenhum check de queue backlog ou worker responsiveness.

#### Impacto
- tecnico: Worker pode estar down sem que o health check detecte.
- negocio: Processamento de campanhas e outbox pode parar sem alerta.

#### Recomendacao
- acao_sugerida: Adicionar check de queue depth e worker heartbeat ao health endpoint.
- prioridade: media

#### Observacoes
- O Prometheus metrics pode compensar parcialmente se alertas estiverem configurados.

---

### ACH-AI-007
- titulo: Procedimentos em 4 niveis (public, authed, tenant, roleProtected) bem estruturados
- severidade: informativo
- categoria: autorizacao-api
- status: confirmado
- resumo: A API define 4 niveis de procedure: publicProcedure (sem auth), authedProcedure (requer accountId), tenantProcedure (requer tenant completo), roleProtectedProcedure (requer role minimo). O legado protectedProcedure e alias de tenantProcedure.

#### Evidencia
- arquivo_ou_area: apps/api/src/trpc/trpc.ts:66-125
- detalhe: Hierarquia clara com ROLE_HIERARCHY (CONSULTANT < LEADER < DIRECTOR < ADMIN). Violacoes logadas como security event.

#### Impacto
- tecnico: Modelo de autorizacao claro e extensivel.
- negocio: Seguranca de acesso por papel.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

#### Observacoes
- Achado positivo.
