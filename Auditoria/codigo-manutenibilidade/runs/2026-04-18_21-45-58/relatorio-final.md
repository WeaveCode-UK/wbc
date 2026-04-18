# Relatório Final da Auditoria

## Identificação
- dominio: codigo-manutenibilidade
- run_id: 2026-04-18_21-45-58
- status_run: ready_for_finalize
- iniciado_em: 2026-04-18 21:45:58
- finalizado_em: none
- ultima_atualizacao: 2026-04-18 21:56:52

## Objetivo da Run
Avaliar se o código do WBC Platform está organizado de forma que possa ser compreendido, modificado, testado e evoluído com custo razoável, sem introduzir atrito excessivo, regressões frequentes ou dependência desproporcional de conhecimento tácito.

## Escopo Executado
- Árvore top-level do monorepo (apps/ e packages/) e configuração raiz (package.json, turbo.json, pnpm-workspace.yaml, tsconfig, .dependency-cruiser.cjs)
- apps/api: routers tRPC, middlewares (idempotency, domainError, rateLimit), lib (cache, redis, queues), bootstrap (index.ts)
- apps/worker: bootstrap, outbox/health, handlers de eventos
- apps/web: auth.config.ts (NextAuth callbacks)
- packages/business: barrels, use-cases e adapters Prisma de auth, clients, sales, analytics, messaging, inventory, catalog, schedule
- packages/db: singleton PrismaClient + tenant-context
- packages/shared: inventário de responsabilidades do barrel
- packages/validators: comparação com schemas inline em routers
- Base de testes existente (apenas `packages/shared/src/__tests__/` com 3 specs; e2e com `health.spec.ts`)

## Escopo Nao Coberto ou Parcial
- Análise quantitativa de complexidade ciclomática por função (requer ferramenta dedicada)
- apps/mobile e packages/ui-native inspecionados apenas superficialmente
- Performance real das queries e invalidações — pertence ao domínio performance-escalabilidade
- Segurança de fluxos incompletos (auth) — parte pertence ao domínio seguranca
- Cobertura de testes — pertence ao domínio testes-qualidade (não foi executada tentativa de rodar vitest)

## Resumo Executivo
O código do WBC Platform apresenta fundação arquitetural sensata (monorepo com Turborepo + pnpm, arquitetura hexagonal declarada, Prisma, tRPC, tipagem estrita) e gates de estilo no pré-commit (Husky + Prettier + lint-staged). Entretanto, a manutenibilidade real é reduzida por três vetores sistêmicos: (1) boundaries de módulo permeáveis — os `index.ts` de `packages/business` reexportam adapters inteiros, anulando o ganho da arquitetura hexagonal; (2) ausência de composition root — repositórios são instanciados como singletons no topo de cada router, impedindo DI/testes; (3) fluxos de autenticação com TODOs bloqueadores em produção (token storage e envio de e-mail stubados). Somam-se problemas localizados relevantes: callback `jwt` complexo, god file em `routers/auth.ts`, casts de tipo em mappers, números mágicos espalhados, duplicação de schemas Zod entre `@wbc/validators` e routers inline, e side-effects pesados nos entry-points. A avaliação geral é `preocupante`: o projeto roda, mas qualquer mudança em auth, entidades com schema Zod ou na camada de persistência tende a exigir edição em múltiplos arquivos e carece de rede de segurança (testes).

## Principais Achados
1. ACH-001 (critico) TODOs em auth: verify-email / reset-password / request-* sem persistência de token em Redis e sem integração real com provedor de e-mail
2. ACH-002 (alto) barrels de `packages/business/*` expõem adapters; hexagonal vira pró-forma
3. ACH-003 (alto) ausência de composition root; repositórios instanciados em cada router como singletons
4. ACH-004 (alto) schemas Zod duplicados entre `@wbc/validators` e routers inline
5. ACH-007 (alto) callback `jwt` em `apps/web/src/lib/auth.config.ts` com complexidade cognitiva alta
6. ACH-013 (alto) side-effects pesados nos `index.ts` dos apps (initTracing/initSentry/setInterval no topo)
7. ACH-006 (medio) `PrismaClient` singleton global; isolamento multi-tenant via AsyncLocalStorage difícil de testar
8. ACH-005 (medio) `packages/shared` incoeso (tema UI + infra + eventos + resiliência)
9. ACH-008 (medio) `apps/api/src/routers/auth.ts` concentra 17 procedures em 391 linhas
10. ACH-011 (medio) duplicação de mapeamento entidade↔Prisma em múltiplos adapters

## Distribuicao por Severidade
- critico: 1
- alto: 5
- medio: 11
- baixo: 4
- informativo: 1

## Riscos Prioritarios
1. Fluxos de auth por link (reset/verify) não funcionam em produção sem implementação adicional (ACH-001). Risco imediato de falha funcional e security gap.
2. Violação de boundary hexagonal via barrels (ACH-002) combinada com falta de DI (ACH-003) trava qualquer refactor de persistência e inviabiliza testes unitários em escala — bloqueador para a Fase 7 "testes" do roadmap interno.
3. Isolamento multi-tenant depende de middleware + ALS globais (ACH-006); qualquer caminho que contorne esse middleware vaza dados. Sem teste automatizado, regressões silenciosas são prováveis.
4. Callback `jwt` e router de auth como god files (ACH-007, ACH-008) concentram risco de alteração em área crítica de segurança.
5. Schemas Zod duplicados (ACH-004) criam drift silencioso entre validação na borda e validação no serviço; afeta experiência em web e mobile.

## Recomendacoes Prioritarias
1. Implementar urgentemente os TODOs de auth (ACH-001): persistir token em Redis com TTL, validar no consumo, integrar com Resend (ou provedor escolhido), testar o fluxo end-to-end.
2. Reduzir os barrels `packages/business/*/index.ts` (ACH-002): expor apenas `domain/` e `ports/`; mover exposição de use-cases para factory em composition root; remover `export *` sobre `adapters/`.
3. Introduzir composition root (ACH-003, ACH-006): factory `createContainer()` que instancia PrismaClient, repositórios e emissores de evento; disponibilizar via `ctx.repos` no tRPC; adapters passam a receber `PrismaClient` por construtor.
4. Consolidar schemas de entrada em `@wbc/validators` (ACH-004): remover `z.object` inline dos routers; regra ESLint `no-restricted-syntax` para garantir.
5. Refatorar `apps/web/src/lib/auth.config.ts` (ACH-007): extrair `resolveWorkspaceMembership()` puro; representar estado com discriminated union; testar isoladamente.
6. Separar "carregamento" de "inicialização" (ACH-013): entry-points exportam `bootstrap()`; só executam side-effects quando rodados como processo.
7. Fragmentar `apps/api/src/routers/auth.ts` (ACH-008) em sub-routers por capability (signup, session, invites, otp).
8. Criar camada `packages/config` com Zod (ACH-014) e `packages/shared/src/constants/timings.ts` (ACH-010); proibir `process.env` fora desse pacote.
9. Introduzir `BaseMapper` e centralizar enums de status (ACH-011, ACH-012) para cortar duplicação de projeção/filtro.
10. Endurecer `cacheInvalidatePattern` com chunking de pipeline e timeout (ACH-015).

## Avaliacao Geral do Dominio
- avaliacao: preocupante

Justificativa: fundação boa, mas três vetores sistêmicos (boundaries permeáveis, ausência de composition root, fluxos de auth incompletos) comprometem a promessa da arquitetura hexagonal e a prontidão para a fase de testes. Dívida técnica estrutural está concentrada em hotspots claros, o que torna a correção priorizável sem reescrita ampla.

## Prontidao para Encerramento
- pronto_para_finalizar: sim
- justificativa: todas as 7 fases do playbook concluídas; 22 achados consolidados com evidência; relatório final preenchido; acompanhamento e metadata coerentes; sem bloqueios abertos.

## Observacoes Finais
- Achados cruzam-se com os domínios `seguranca` (ACH-001, ACH-006, ACH-007), `testes-qualidade` (ACH-003, ACH-013), `compliance-privacidade` (ACH-006) e `arquitetura` (ACH-002, ACH-003, ACH-016). Esses domínios serão auditados em runs próprias e devem reaproveitar evidências registradas aqui.
- Pré-commit (Husky + Prettier + lint-staged) e `depcruise` já estão configurados; investir em regras de `dependency-cruiser` que impeçam import transitivo de adapters via barrels traria retorno alto com baixo custo.
- CLAUDE.md declara "ZERO testes até Fase 7"; neste momento o projeto está em conformidade com essa regra interna, mas ACH-003/006/013 precisam ser endereçados antes que testes em escala sejam viáveis.
