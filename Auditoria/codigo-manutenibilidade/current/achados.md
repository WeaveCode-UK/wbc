# Achados da Auditoria

## Identificação
- dominio: codigo-manutenibilidade
- run_id: 2026-04-10_14-28-01
- ultima_atualizacao: 2026-04-10 14:32:41

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
- titulo: Fluxos Auth 2.0 expostos ainda dependem de use-cases placeholder
- severidade: alto
- categoria: divida-tecnica-incompleta
- status: aberto
- resumo: Fluxos de reset de senha e verificacao de email estao expostos por router/UI, mas os use-cases centrais ainda possuem TODOs, token nao persistido e erros `not yet implemented`.

#### Evidencia
- arquivo_ou_area: packages/business/auth/use-cases/request-password-reset.use-case.ts:21
- detalhe: gera token e registra TODO para salvar token com expiracao, mas nao persiste o token.
- arquivo_ou_area: packages/business/auth/use-cases/reset-password.use-case.ts:15
- detalhe: `execute()` ignora o input e lanca `Reset password token validation not yet implemented`.
- arquivo_ou_area: packages/business/auth/use-cases/verify-email.use-case.ts:10
- detalhe: `execute()` ignora o input e lanca `Email verification token validation not yet implemented`.
- arquivo_ou_area: apps/api/src/routers/auth.ts:83
- detalhe: router expõe `requestPasswordReset`, `resetPassword` e `verifyEmail`.
- arquivo_ou_area: apps/web/src/app/(auth)/reset-password/page.tsx:20
- detalhe: tela chama `/api/trpc/auth.requestPasswordReset` e marca sucesso sem validar resposta.

#### Impacto
- tecnico: caminhos incompletos ficam misturados ao codigo produtivo e exigem rastreamento manual para entender o que e funcional.
- negocio: manutencoes futuras em autenticacao podem tratar placeholders como fluxos prontos e introduzir regressao em area sensivel.

#### Recomendacao
- acao_sugerida: separar explicitamente fluxo incompleto atras de feature flag/estado bloqueado ou concluir persistencia/validacao de tokens antes de manter endpoints e telas ativos.
- prioridade: alta

#### Observacoes
- O nucleo do problema aqui e manutenibilidade/evolucao: codigo incompleto aparenta estar integrado ao fluxo normal.

### ACH-002
- titulo: Schemas Zod duplicados entre `packages/validators` e routers da API
- severidade: medio
- categoria: duplicacao-e-consistencia
- status: aberto
- resumo: O pacote `@wbc/validators` possui schemas por dominio, mas varios routers recriam `z.object(...)` inline, duplicando contratos e aumentando risco de drift.

#### Evidencia
- arquivo_ou_area: packages/validators/src/clients.ts:4
- detalhe: define `listClientsSchema`.
- arquivo_ou_area: packages/validators/src/clients.ts:13
- detalhe: define `createClientSchema`.
- arquivo_ou_area: apps/api/src/routers/clients.ts:20
- detalhe: recria inline o schema de listagem de clientes.
- arquivo_ou_area: apps/api/src/routers/clients.ts:39
- detalhe: recria inline o schema de criacao de clientes.
- arquivo_ou_area: apps/api/src/routers/catalog.ts:22
- detalhe: padrao de `z.object(...)` inline tambem aparece em outros routers; busca em `apps/api/src/routers` encontrou dezenas de inputs inline enquanto `packages/validators/src` exporta schemas equivalentes.

#### Impacto
- tecnico: alteracoes de contrato precisam ser lembradas em dois lugares, reduzindo previsibilidade e aumentando risco de validacao divergente.
- negocio: mudancas simples de formulario/API podem quebrar parcialmente por contrato duplicado e nao centralizado.

#### Recomendacao
- acao_sugerida: migrar routers para usar os schemas exportados de `@wbc/validators` e manter extensoes locais apenas quando houver motivo explicito.
- prioridade: media

#### Observacoes
- Auth ja usa schemas centralizados, o que mostra um padrao melhor disponivel no proprio repositorio.

### ACH-003
- titulo: Imports profundos e barrels exportando adapters enfraquecem boundaries locais
- severidade: medio
- categoria: acoplamento-local
- status: aberto
- resumo: O codigo usa imports relativos longos para acessar `packages/business` e os barrels dos modulos de negocio exportam adapters Prisma junto de domain/ports, tornando a API publica dos packages pouco previsivel.

#### Evidencia
- arquivo_ou_area: apps/api/tsconfig.json:12
- detalhe: existe alias `@wbc/business/*`.
- arquivo_ou_area: apps/api/src/routers/clients.ts:4
- detalhe: router importa adapter via `../../../../packages/business/...` em vez do alias/package API.
- arquivo_ou_area: apps/api/src/routers/sales.ts:5
- detalhe: mesmo padrao de import profundo aparece em sales; busca encontrou 75 imports desse formato em `apps/api`, `apps/worker` e libs da API.
- arquivo_ou_area: packages/business/auth/index.ts:7
- detalhe: o barrel principal exporta `./adapters/index`.
- arquivo_ou_area: packages/business/sales/index.ts:8
- detalhe: barrel de sales exporta repositories Prisma.
- arquivo_ou_area: packages/business/inventory/index.ts:7
- detalhe: barrel de inventory exporta adapters e handler de evento.

#### Impacto
- tecnico: consumidores ficam livres para depender de detalhes internos e caminhos frágeis, tornando refactors de packages mais caros.
- negocio: mudancas internas em modulo de negocio podem exigir ajuste espalhado em API/worker, desacelerando evolucao.

#### Recomendacao
- acao_sugerida: padronizar imports por alias/package e separar API publica por camada (`domain`, `ports`, `use-cases`, `adapters`) sem exportar adapters no barrel principal.
- prioridade: media

#### Observacoes
- O achado e de manutenibilidade local; a implicacao arquitetural mais ampla deve continuar no dominio arquitetura quando necessario.

### ACH-004
- titulo: Entrypoint do worker concentra bootstrap, wiring, timers e handlers no topo do modulo
- severidade: medio
- categoria: baixa-testabilidade
- status: aberto
- resumo: `apps/worker/src/index.ts` mistura inicializacao Sentry, handlers globais, validacao de ambiente, middleware tenant, outbox, registros de eventos, workers BullMQ, cache invalidation e timers no mesmo arquivo com side effects top-level.

#### Evidencia
- arquivo_ou_area: apps/worker/src/index.ts:4
- detalhe: inicializa Sentry diretamente no topo do modulo.
- arquivo_ou_area: apps/worker/src/index.ts:15
- detalhe: registra `process.on` para erros globais.
- arquivo_ou_area: apps/worker/src/index.ts:25
- detalhe: imports aparecem apos execucao de codigo e registro de handlers globais.
- arquivo_ou_area: apps/worker/src/index.ts:46
- detalhe: aplica middleware tenant, inicializa outbox e registra handlers.
- arquivo_ou_area: apps/worker/src/index.ts:60
- detalhe: inicia `setInterval` de outbox; outros timers aparecem em `apps/worker/src/index.ts:93` e `apps/worker/src/index.ts:104`.

#### Impacto
- tecnico: testar ou alterar uma responsabilidade do worker aciona side effects globais e timers, dificultando isolamento e refactoring seguro.
- negocio: mudancas em processamento assíncrono ficam mais arriscadas porque varias preocupacoes operacionais compartilham o mesmo entrypoint.

#### Recomendacao
- acao_sugerida: extrair factories/bootstraps nomeados para Sentry, event handlers, queues, cache invalidation e schedulers; deixar `index.ts` apenas orquestrando chamadas explicitas.
- prioridade: media

#### Observacoes
- Separar construcao de dependencias do start efetivo tambem melhora testabilidade dos processadores.

### ACH-005
- titulo: Type erasure recorrente reduz analisabilidade estatica
- severidade: medio
- categoria: tipagem-e-analisabilidade
- status: aberto
- resumo: Helpers e consumers usam `unknown`, casts para `T[]`, `as never` e `useForm<any>`, o que dificulta confiar na inferencia TypeScript em pontos de acesso a dados e formularios.

#### Evidencia
- arquivo_ou_area: packages/shared/src/prisma-helpers.ts:11
- detalhe: `PrismaModel` usa `findMany` retornando `Promise<unknown[]>`.
- arquivo_ou_area: packages/shared/src/prisma-helpers.ts:36
- detalhe: resultado e convertido com `data as T[]`.
- arquivo_ou_area: packages/business/sales/adapters/prisma-sale-repository.ts:39
- detalhe: chama `paginatedQuery` com `prisma.sale as never`.
- arquivo_ou_area: packages/business/campaigns/adapters/prisma-campaign-repository.ts:15
- detalhe: chama `paginatedQuery` com `prisma.campaign as never`.
- arquivo_ou_area: packages/business/clients/adapters/prisma-client-repository.ts:31
- detalhe: chama `paginatedQuery<Client>(prisma.client as never, ...)`.
- arquivo_ou_area: apps/web/src/components/auth/credentials-form.tsx:35
- detalhe: desabilita regra de `no-explicit-any` e usa `useForm<any>`.

#### Impacto
- tecnico: erros de contrato Prisma/formulario podem passar pelo compilador e reaparecer como bugs de runtime.
- negocio: mudancas em modelos ou formularios exigem mais teste manual porque parte da protecao de tipos foi contornada.

#### Recomendacao
- acao_sugerida: tipar `paginatedQuery` com delegates Prisma compativeis, remover `as never` dos adapters e usar tipos inferidos dos schemas Zod nos formularios.
- prioridade: media

#### Observacoes
- Este achado complementa, mas nao substitui, auditoria de testes/qualidade.

### ACH-006
- titulo: Telas mobile grandes misturam layout, dados de exemplo, copy e estilos
- severidade: medio
- categoria: componentes-inchados
- status: aberto
- resumo: Varias telas mobile passam de 200 linhas e concentram fixtures, copy hardcoded, regras visuais e renderizacao no mesmo arquivo, dificultando alteracao incremental e reuso.

#### Evidencia
- arquivo_ou_area: apps/mobile/src/screens/settings-theme-screen.tsx:15
- detalhe: tela contem copy e preview hardcoded no componente; estilos comecam em `apps/mobile/src/screens/settings-theme-screen.tsx:176`.
- arquivo_ou_area: apps/mobile/src/screens/new-sale-screen.tsx:7
- detalhe: define opcoes de entrega no arquivo da tela.
- arquivo_ou_area: apps/mobile/src/screens/new-sale-screen.tsx:50
- detalhe: renderiza resumo de pedido com cliente, produtos e valores fixos.
- arquivo_ou_area: apps/mobile/src/screens
- detalhe: contagem de linhas mostrou `settings-theme-screen.tsx` com 346 linhas, `client-profile-screen.tsx` com 291, `new-sale-screen.tsx` com 277, `finance-screen.tsx` com 261 e `schedule-screen.tsx` com 260.

#### Impacto
- tecnico: pequenas mudancas de UI, dados ou copy exigem editar arquivos grandes e pouco isolados.
- negocio: evoluir as telas mobile para dados reais ou localizacao completa tende a gerar churn e regressao visual.

#### Recomendacao
- acao_sugerida: extrair fixtures, secoes reutilizaveis e estilos por bloco; priorizar telas acima de 250 linhas e caminhos com dados mockados.
- prioridade: media

#### Observacoes
- O foco aqui e custo de manutencao; problemas de UX/i18n devem ser detalhados nos dominios respectivos.

### ACH-007
- titulo: Arquivos `tsconfig.tsbuildinfo` estao versionados
- severidade: baixo
- categoria: higiene-de-repositorio
- status: aberto
- resumo: Arquivos de cache incremental do TypeScript aparecem em `git ls-files`, criando ruido de diff e aumentando chance de conflitos sem valor para manutencao do codigo-fonte.

#### Evidencia
- arquivo_ou_area: git ls-files
- detalhe: retornou `apps/landing/tsconfig.tsbuildinfo`, `apps/mobile/tsconfig.tsbuildinfo`, `apps/web/tsconfig.tsbuildinfo`, `packages/shared/tsconfig.tsbuildinfo` e `packages/validators/tsconfig.tsbuildinfo`.
- arquivo_ou_area: .gitignore:1
- detalhe: ignora `node_modules`, `.next`, `dist`, `.turbo`, envs e logs, mas nao cobre `*.tsbuildinfo`.
- arquivo_ou_area: ls -lh
- detalhe: os arquivos variam de 54K a 294K no workspace atual.

#### Impacto
- tecnico: caches locais entram no historico e podem gerar mudancas irrelevantes em commits.
- negocio: revisoes ficam mais ruidosas e conflitos de merge podem aparecer em arquivos gerados.

#### Recomendacao
- acao_sugerida: adicionar `*.tsbuildinfo` ao `.gitignore` e remover esses arquivos do tracking em commit dedicado.
- prioridade: baixa

#### Observacoes
- Nao foi feita remocao nesta run porque o Prompt 03 permite apenas alteracoes em `/Auditoria`.
