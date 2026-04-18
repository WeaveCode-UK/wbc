# Achados da Auditoria

## Identificação
- dominio: codigo-manutenibilidade
- run_id: 2026-04-18_21-45-58
- ultima_atualizacao: 2026-04-18 22:10:00

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
- titulo: TODOs críticos em auth — token storage, email sender e reset não implementados
- severidade: critico
- categoria: completude-implementacao
- status: confirmado
- resumo: Fluxos de password reset, email verification e request-email-verification geram token mas não persistem no Redis nem validam no consumo; adapter Resend é stub. Bloqueia uso em produção dos fluxos de auth por link.

#### Evidencia
- arquivo_ou_area: packages/business/auth/use-cases/verify-email.use-case.ts:11; reset-password.use-case.ts:16; request-email-verification.use-case.ts:21; request-password-reset.use-case.ts:22; packages/business/auth/adapters/resend-email-sender.adapter.ts:7
- detalhe: Cinco TODOs sinalizam "validar token do Redis e obter accountId", "salvar token com expiracao" e "integrar com Resend API em producao". Nenhuma implementação real desses pontos.

#### Impacto
- tecnico: Código parece funcional mas não completa o fluxo; depuração difícil porque o caminho feliz emite eventos sem efeito
- negocio: Usuário não consegue redefinir senha nem verificar e-mail; risco de comprometer onboarding e conformidade de segurança

#### Recomendacao
- acao_sugerida: Implementar persistência de token em Redis com TTL, validação no consumo e integração com provedor de e-mail real; cobrir com testes de fluxo
- prioridade: alta

#### Observacoes
- Esse achado tangencia o domínio seguranca mas é registrado aqui porque o núcleo é código incompleto (manutenibilidade/completude)

---

### ACH-002
- titulo: `index.ts` de packages/business expõe adapters e use-cases sem barreira
- severidade: alto
- categoria: boundary-e-coesao
- status: confirmado
- resumo: Os barrel exports em `packages/business/<modulo>/index.ts` reexportam `domain/`, `adapters/` e `use-cases/` inteiros. Consumidores podem importar `PrismaClientRepository` diretamente, violando o boundary da arquitetura hexagonal.

#### Evidencia
- arquivo_ou_area: packages/business/auth/index.ts; packages/business/clients/index.ts; packages/business/catalog/index.ts; packages/business/inventory/index.ts; packages/business/messaging/index.ts; packages/business/sales/index.ts; packages/business/schedule/index.ts
- detalhe: Uso de `export * from './adapters/...'` ao lado de `export * from './domain/...'` sem filtragem. Permite que apps/api e apps/worker dependam de detalhes de implementação.

#### Impacto
- tecnico: Refatorar adapter (ex: trocar driver Prisma) quebra consumidores em cascata; dependency-cruiser sozinho não impede se import vem por barrel
- negocio: Dívida arquitetural vai crescer; migrações futuras (ex: split de serviço) terão custo desproporcional

#### Recomendacao
- acao_sugerida: Reduzir barrels para expor apenas `domain/` e `ports/`; expor use-cases explicitamente via factory; manter adapters como internos, disponibilizados só via composition root
- prioridade: alta

#### Observacoes
- Fases 1 e 3 convergiram neste mesmo ponto com evidências diferentes

---

### ACH-003
- titulo: Ausência de composition root — repositórios instanciados como singletons no topo dos routers
- severidade: alto
- categoria: injecao-de-dependencia
- status: confirmado
- resumo: Cada router tRPC cria suas próprias instâncias de `PrismaXxxRepository` no escopo do módulo. Não existe factory, container ou contexto central. Padrão replica em todos os routers e em adapters internos.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/auth.ts:61-68; apps/api/src/routers/clients.ts:15-16; apps/api/src/routers/sales.ts:20-23; apps/api/src/routers/catalog.ts:12-14; apps/api/src/lib/queues.ts:4-31; apps/api/src/lib/redis.ts:7
- detalhe: Padrão `const repo = new PrismaXxxRepository()` em ~16 routers e lazy-singletons `let queue; export function getQueue() {...}`. Não há ponto único de composição nem ciclo de vida controlado.

#### Impacto
- tecnico: Troca de implementação exige editar N arquivos; testes unitários inviáveis sem mock de módulo; difícil aplicar decorators (ex: cache, tracing, feature flag) sem modificar cada router
- negocio: Custo de evolução cresce linearmente com o número de rotas; gera atrito em refactors e onboarding

#### Recomendacao
- acao_sugerida: Introduzir composition root (factory `createRepositories()` ou container leve tipo Awilix); expor via `ctx.repos` no tRPC; remover `new Prisma*Repository()` fora do root
- prioridade: alta

#### Observacoes
- Pré-requisito técnico para habilitar testes unitários a partir da Fase 7

---

### ACH-004
- titulo: Schemas Zod duplicados entre `packages/validators` e routers inline
- severidade: alto
- categoria: duplicacao-e-consistencia
- status: confirmado
- resumo: `packages/validators/src/clients.ts` define `createClientSchema` completo, mas `apps/api/src/routers/clients.ts` reescreve schema equivalente inline. Adicionar um campo exige mudança em 5+ lugares (Prisma, domain, validators, router inline, UI).

#### Evidencia
- arquivo_ou_area: packages/validators/src/clients.ts:4-46 versus apps/api/src/routers/clients.ts:20-54
- detalhe: Mesmos campos (name, phone, tags, status) declarados com Zod em dois lugares; divergência silenciosa é possível

#### Impacto
- tecnico: Alto risco de desincronia validador vs API; regra de negócio duplicada
- negocio: Bugs de validação difíceis de rastrear; consumidores móveis e web podem ver comportamento inconsistente

#### Recomendacao
- acao_sugerida: Sempre importar schemas de `@wbc/validators`; remover definições inline; adicionar regra ESLint para proibir `z.object` em `apps/api/src/routers/*`
- prioridade: alta

---

### ACH-005
- titulo: `packages/shared` é saco de utilitários incoeso (tema UI + infra + eventos + resiliência)
- severidade: medio
- categoria: coesao-de-pacote
- status: confirmado
- resumo: `packages/shared/src/index.ts` exporta tema (cores, tipografia), circuit-breaker, Redis, event-publisher, outbox-service, security-logger, prisma-helpers, resilience policies. Responsabilidades ortogonais no mesmo pacote.

#### Evidencia
- arquivo_ou_area: packages/shared/src/index.ts (15 reexports)
- detalhe: Mistura `theme/colors`, `circuit-breaker`, `outbox-service`, `domain-event` e `security-logger`. Consumidores web importam tema e arrastam Redis junto

#### Impacto
- tecnico: Tree-shaking prejudicado; bundles maiores no cliente; mudança em infra atinge UI indiretamente
- negocio: Custo cognitivo alto; dificulta contratos internos claros

#### Recomendacao
- acao_sugerida: Dividir em `@wbc/shared-types`, `@wbc/shared-events`, `@wbc/design-tokens`, `@wbc/shared-resilience`; remover barrel único permissivo
- prioridade: media

---

### ACH-006
- titulo: Singleton global de `PrismaClient` em `packages/db` sem contrato de ciclo de vida
- severidade: medio
- categoria: isolamento-multi-tenant
- status: confirmado
- resumo: `packages/db/src/index.ts` exporta `prisma` como singleton compartilhado via `globalThis`. O isolamento multi-tenant depende de middleware + AsyncLocalStorage global. Testar lógica que toque Prisma exige mocks invasivos e qualquer request sem tenant setado pode vazar por omissão.

#### Evidencia
- arquivo_ou_area: packages/db/src/index.ts:4-14; packages/db/src/tenant-context.ts
- detalhe: Padrão `globalForPrisma.prisma ??= new PrismaClient()` + `AsyncLocalStorage` global. Sem request-scoped instance e sem teste automatizado de isolamento

#### Impacto
- tecnico: Riscos sutis de data leak cross-tenant em race conditions; testes de unidade em `packages/business/*/adapters/*.ts` impossíveis sem DB real
- negocio: Regressão em isolamento de tenant é um incidente de LGPD/compliance de alto custo

#### Recomendacao
- acao_sugerida: Receber `PrismaClient` via construtor nos adapters (`constructor(private db: PrismaClient) {}`); manter o singleton apenas na composition root; adicionar teste automatizado que valide `tenantId` em toda query
- prioridade: alta

#### Observacoes
- Impacta também o domínio seguranca/compliance-privacidade — registrar cross-reference em run futura desses domínios

---

### ACH-007
- titulo: Callback `jwt` em `auth.config.ts` com lógica complexa e estado mutável
- severidade: alto
- categoria: complexidade-cognitiva
- status: confirmado
- resumo: O callback `jwt` em `apps/web/src/lib/auth.config.ts` (~50 linhas, aninhamento ≥4) resolve workspace membership, detecta onboarding/selection, e responde a triggers `update`. Cinco campos do token (`tid`, `mid`, `role`, `plan`, `needsOnboarding`) são mutados em combinações distintas.

#### Evidencia
- arquivo_ou_area: apps/web/src/lib/auth.config.ts:65-114
- detalhe: If/else em cadeia cobrindo 0/1/N membros + trigger 'update' no mesmo bloco

#### Impacto
- tecnico: Difícil testar combinações; regressão silenciosa provável em mudanças de regra; debug em produção depende de logs de sessão
- negocio: Sessão inconsistente afeta experiência (workspace errado, acesso negado)

#### Recomendacao
- acao_sugerida: Extrair `resolveWorkspaceMembership(userId)` puro; representar estado com discriminated union (`onboarding | selection | ready`); adicionar invariants/tests
- prioridade: alta

---

### ACH-008
- titulo: Router `auth.ts` com 391 linhas e 17 procedures heterogêneas
- severidade: medio
- categoria: god-file
- status: confirmado
- resumo: `apps/api/src/routers/auth.ts` concentra instanciação de 8 repositórios + 17 procedures misturando signup, login, invites, OTP e logout. Funções como `acceptInvite` misturam validação, comandos e leitura.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/auth.ts (391 linhas, 17 procedures)
- detalhe: Responsabilidades cruzadas num só arquivo; tamanho dificulta leitura e revisão; mudanças simples disputam mesmo arquivo

#### Impacto
- tecnico: Alto risco de conflito em PRs; entendimento parcial obrigatório para qualquer mudança
- negocio: Custo de evolução do módulo de auth desproporcional

#### Recomendacao
- acao_sugerida: Segmentar em `auth.signup.ts`, `auth.session.ts`, `auth.invites.ts`, `auth.otp.ts`; cada arquivo expõe sub-router agregado em `auth.ts` enxuto
- prioridade: media

---

### ACH-009
- titulo: Type casting `as unknown as X` em mappers Prisma e Redis sem justificativa
- severidade: medio
- categoria: tipagem
- status: confirmado
- resumo: Ocorrências de `as unknown as Record<string, unknown>` e `as unknown as typeof redisClient` em caminhos críticos (idempotência, cache, mappers de venda/OTP). Mascara falhas de tipagem e oculta dívida de schema.

#### Evidencia
- arquivo_ou_area: apps/api/src/trpc/idempotency-middleware.ts:7; apps/api/src/lib/cache.ts:20; packages/business/sales/adapters/prisma-sale-repository.ts:11-27,40-42,66,113,133
- detalhe: Pelo menos 8 casts sem comentário explicando invariant ou referência a bug do Prisma

#### Impacto
- tecnico: Falsos positivos em mudanças de schema; checker TypeScript perde capacidade de alertar
- negocio: Bugs sutis em produção (ex: precisão de dinheiro, caches inconsistentes)

#### Recomendacao
- acao_sugerida: Substituir por tipos Prisma auto-gerados (`Prisma.SaleGetPayload`) ou interfaces `RedisLike` explícitas; quando genuinamente necessário, comentar o motivo em uma linha acima do cast
- prioridade: media

---

### ACH-010
- titulo: Números mágicos espalhados para TTLs, intervalos, janelas e thresholds
- severidade: medio
- categoria: configuracao-e-constantes
- status: confirmado
- resumo: Valores como 5000 (outbox poll), 60_000 (DLQ scan / rate window), 24*60*60*1000 (cleanup diário), 300 (TTL cache) aparecem hardcoded em múltiplos arquivos. Não há `constants/timings.ts` central.

#### Evidencia
- arquivo_ou_area: apps/worker/src/index.ts:74,118,130; apps/api/src/lib/cache.ts:7,139,141; apps/api/src/trpc/rate-limit-middleware.ts:9-10; apps/worker/src/health-server.ts
- detalhe: TTL 300s repetido em 3+ arquivos; rate limit 60s/30req hardcoded

#### Impacto
- tecnico: Alterar política exige grep-and-replace; inconsistência entre ambientes
- negocio: Dificulta experimentos de performance e mudança de política sem risco

#### Recomendacao
- acao_sugerida: Criar `packages/shared/src/constants/timings.ts` (ou equivalente por domínio) e `packages/config`; importar constantes nos call sites
- prioridade: media

---

### ACH-011
- titulo: Duplicação de mapeamento entidade↔Prisma em múltiplos adapters
- severidade: medio
- categoria: duplicacao
- status: confirmado
- resumo: Mappers `toDomain`/`toPrisma` reescrevem o mesmo padrão de projeção em `sales`, `clients`, `auth/otp`. Mudança de entidade exige editar N adapters sem base comum.

#### Evidencia
- arquivo_ou_area: packages/business/sales/adapters/prisma-sale-repository.ts:11-27; packages/business/auth/adapters/prisma-otp-repository.ts:22-52; packages/business/clients/adapters/prisma-client-repository.ts (projeções repetidas)
- detalhe: Mesma estrutura `{ id, accountId, ..., createdAt }` replicada inline

#### Impacto
- tecnico: Alto risco de drift entre adapters após mudança de entidade
- negocio: Bugs intermitentes quando um campo é adicionado em um lugar e esquecido em outro

#### Recomendacao
- acao_sugerida: Criar `BaseMapper<TDomain, TPersistence>` ou função utilitária para projeção comum; reduzir a um único ponto de verdade por entidade
- prioridade: media

---

### ACH-012
- titulo: Literais de status/enum espalhados em filtros Prisma
- severidade: medio
- categoria: consistencia-de-dominio
- status: confirmado
- resumo: Valores como `"CONFIRMED"`, `"DELIVERED"`, `"DRAFT"` aparecem hardcoded em filtros Prisma de diferentes adapters, sem enum/tipo central garantindo exclusividade e refactor-safety.

#### Evidencia
- arquivo_ou_area: packages/business/sales/adapters/prisma-sale-repository.ts:88-96,124-131 (e outros)
- detalhe: `status: { in: ['CONFIRMED' as const, 'DELIVERED' as const] }` reescrito por adapter

#### Impacto
- tecnico: Adicionar novo status exige caçar todos os filtros; bug silencioso se filtro esquecido
- negocio: Comportamento inconsistente entre relatórios e telas

#### Recomendacao
- acao_sugerida: Centralizar enums/tipos `SaleStatus`, `PaymentStatus`, etc. em `@wbc/business/<modulo>/domain/status.ts`; criar helper `statusIn(allowed: SaleStatus[])`
- prioridade: media

---

### ACH-013
- titulo: Side-effects pesados no entry-point ao importar módulos
- severidade: alto
- categoria: testabilidade
- status: confirmado
- resumo: `apps/api/src/index.ts` e `apps/worker/src/index.ts` executam `initTracing`, `initSentry`, `applyTenantMiddleware`, abrem conexões Redis e registram `setInterval` no topo do arquivo. Importar qualquer símbolo dispara todo o bootstrap.

#### Evidencia
- arquivo_ou_area: apps/api/src/index.ts:1-24; apps/worker/src/index.ts:1-74
- detalhe: Mistura de import e side-effect; não há `bootstrap()` explícito

#### Impacto
- tecnico: Impede testes de unidade por import direto; dificulta múltiplos modos (ex: CLI sem tracing)
- negocio: Aumenta o custo de testes e de alterações no ciclo de vida da aplicação

#### Recomendacao
- acao_sugerida: Mover inicialização para `async function bootstrap()`; arquivo de entrada só chama bootstrap se for entry real (`if (require.main === module)` ou equivalente ESM)
- prioridade: alta

---

### ACH-014
- titulo: Acesso a `process.env` disperso sem camada de configuração tipada
- severidade: medio
- categoria: configuracao
- status: confirmado
- resumo: 22+ leituras de `process.env.*` em apps/api, apps/worker, apps/web. Padrão `process.env.X ?? 'default'` replicado sem validação centralizada (Zod/env-schema).

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/redis.ts:5; apps/worker/src/index.ts:96; apps/api/src/routers/health.ts; apps/worker/src/health-server.ts; ...
- detalhe: Sem `config.ts` tipado; defaults hardcoded; sem falha rápida em variável ausente

#### Impacto
- tecnico: Difícil descobrir onde um timeout/flag é lido; ausência de validação permite boot com config errada
- negocio: Produção pode subir com config inválida sem aviso

#### Recomendacao
- acao_sugerida: Criar `packages/config/src/env.ts` com Zod validando cada variável e exportando `config` tipado; proibir `process.env` direto fora desse pacote
- prioridade: media

---

### ACH-015
- titulo: `cacheInvalidatePattern` sem batching/backpressure em Redis SCAN
- severidade: medio
- categoria: complexidade-e-risco-de-manutencao
- status: confirmado
- resumo: Loop aninhado `for await (const keys of stream) { for (const key of keys) pipeline.del(key) }` acumula milhares de comandos em pipeline único sem limite antes do `exec()`.

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/cache.ts:113-134
- detalhe: Sem cap em quantidade de `del` por pipeline; sem cancelamento/tempo-limite

#### Impacto
- tecnico: Em tenant grande, pipeline pode estourar timeout ou memória do worker Redis
- negocio: Degradação não prevista em horários de pico

#### Recomendacao
- acao_sugerida: Chunkar pipeline a cada N (p.ex. 500) comandos; aplicar timeout explícito; logar volume removido
- prioridade: media

---

### ACH-016
- titulo: Comunicação inter-módulo sem domain events — poucas filas BullMQ
- severidade: medio
- categoria: modularidade
- status: confirmado
- resumo: `apps/api/src/lib/queues.ts` expõe apenas 3 filas (analytics, campaigns, messaging). Não há eventos de domínio (ex.: `ClientCreated`, `SaleConfirmed`) publicados cruzando módulos business. Módulos acoplam-se via chamadas diretas.

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/queues.ts:1-31; ausência de publishers em use-cases clientes/vendas
- detalhe: Outbox existe em packages/shared, mas não há uso visível de `publish(event)` em use-cases

#### Impacto
- tecnico: Acoplamento forte entre módulos; mudanças em um módulo disparam refactor em consumidores síncronos
- negocio: Difícil evoluir módulos independentemente ou extrair serviços

#### Recomendacao
- acao_sugerida: Publicar domain events via outbox a partir dos use-cases; consumir em workers isolados por queue; documentar contratos em `packages/shared/src/events/*`
- prioridade: media

---

### ACH-017
- titulo: Analytics `getDashboard()` como god function com múltiplas queries e resultado monolítico
- severidade: baixo
- categoria: coesao-de-funcao
- status: confirmado
- resumo: `packages/business/analytics/adapters/prisma-analytics-repository.ts:18-70` executa 4 queries agregadas em `Promise.all` e retorna objeto único; campo `alerts` hardcoded `[]`; impede cache granular.

#### Evidencia
- arquivo_ou_area: packages/business/analytics/adapters/prisma-analytics-repository.ts:18-70
- detalhe: Função única cobre receita, vendas, lembretes, próximos agendamentos

#### Impacto
- tecnico: Não dá para cachear métricas individualmente; mudança em uma métrica recompila tudo
- negocio: Latência do dashboard depende da query mais lenta

#### Recomendacao
- acao_sugerida: Dividir em `getRevenue()`, `getSalesCount()`, etc.; compor no caller ou expor endpoint agregador cacheável por métrica
- prioridade: baixa

---

### ACH-018
- titulo: Ausência de mapper testável de erros de domínio → HTTP/tRPC
- severidade: medio
- categoria: analisabilidade
- status: confirmado
- resumo: Erros de domínio (`DuplicatePhoneError`, `InvalidClientDataError`, etc.) são lançados, mas não há função pura que os mapeia para `TRPCError` com status/code/mensagem padronizados. Conversão é implícita no error handler global.

#### Evidencia
- arquivo_ou_area: packages/business/clients/domain/errors.ts; apps/api/src/trpc/trpc.ts:51-61 (domainErrorMiddleware sem mapper explícito por tipo)
- detalhe: `domainErrorMiddleware` genérico sem tabela de correspondência

#### Impacto
- tecnico: Difícil testar mapeamento; mudança de mensagem pode afetar consumidores sem aviso
- negocio: Clientes API recebem códigos inconsistentes por tipo de erro

#### Recomendacao
- acao_sugerida: Criar `mapDomainErrorToTRPC(err): { code, message, cause }` puro; testar isolado; aplicar em middleware
- prioridade: media

---

### ACH-019
- titulo: Comentários em caminhos críticos descrevem O QUÊ, não o PORQUÊ
- severidade: baixo
- categoria: documentacao-de-codigo
- status: confirmado
- resumo: Comentários em `apps/api/src/lib/cache.ts:13-32` descrevem lazy-init sem explicar razão do isolamento tenant-scoped. Referências opacas a "ACH-012" do repo de origem.

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/cache.ts:13-32
- detalhe: Comentário contém identificador externo sem contexto

#### Impacto
- tecnico: Onboarding lento; risco de uso incorreto de `getRedis()` vs `getTenantScopedRedis()`
- negocio: Pequeno; apenas custo cognitivo

#### Recomendacao
- acao_sugerida: Reescrever comentários como WHY: "usa scope tenant para evitar vazamento de cache cross-tenant"; remover referências opacas
- prioridade: baixa

---

### ACH-020
- titulo: Estilo misto (classe vs função) para use-cases sem critério documentado
- severidade: baixo
- categoria: convencao
- status: confirmado
- resumo: Alguns use-cases são classes com método `execute()` (auth), outros são funções assíncronas puras (clients/messaging). Sem regra declarada, padrão depende de quem escreveu.

#### Evidencia
- arquivo_ou_area: packages/business/auth/use-cases/* versus packages/business/clients/use-cases/manage-tags.ts
- detalhe: Coexistência sem justificativa

#### Impacto
- tecnico: Pattern matching do time varia; templates novos herdam ambos os estilos
- negocio: Pequeno

#### Recomendacao
- acao_sugerida: Escolher e documentar em CLAUDE.md (ex.: "use-cases são funções puras `async function execute(input, deps)`; classes só quando mantêm estado entre chamadas")
- prioridade: baixa

---

### ACH-021
- titulo: Importações relativas profundas em vez dos aliases `@wbc/*`
- severidade: informativo
- categoria: convencao
- status: confirmado
- resumo: Alguns routers importam via `../../../../packages/business/...` enquanto `tsconfig.json` define aliases `@wbc/*`.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/clients.ts:4-5 (imports relativos profundos)
- detalhe: Conviver entre ambos confunde novos contribuidores

#### Impacto
- tecnico: Baixo; quebra só em moves agressivos
- negocio: Nenhum direto

#### Recomendacao
- acao_sugerida: Regra ESLint `no-restricted-imports` barrando `../../../..`; normalizar para `@wbc/*`
- prioridade: baixa

---

### ACH-022
- titulo: Duplicação de helper `getRedis()` entre adapter de auth e lib de api
- severidade: baixo
- categoria: duplicacao
- status: confirmado
- resumo: `packages/business/auth/adapters/prisma-otp-repository.ts:11-16` define `getRedis()` local; `apps/api/src/lib/redis.ts` define outro. Dois singletons Redis potenciais.

#### Evidencia
- arquivo_ou_area: packages/business/auth/adapters/prisma-otp-repository.ts:11-16; apps/api/src/lib/redis.ts
- detalhe: Possíveis conexões extra; políticas de retry/timeout divergentes

#### Impacto
- tecnico: Vazamento de conexão em produção; comportamento inconsistente
- negocio: Pequeno, mas operacional

#### Recomendacao
- acao_sugerida: Consolidar em `packages/shared/src/redis.ts`; adapters recebem o client por parâmetro (alinhado com ACH-003)
- prioridade: baixa
