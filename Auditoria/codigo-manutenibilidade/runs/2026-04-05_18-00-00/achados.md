# Achados da Auditoria

## Identificacao
- dominio: codigo-manutenibilidade
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

### ACH-CM-001
- titulo: Zero TypeScript `any` no codigo proprio
- severidade: informativo
- categoria: tipagem
- status: confirmado
- resumo: Busca exaustiva por `: any` e `as any` em packages/ e apps/ (excluindo node_modules) retorna zero ocorrencias. A regra do projeto "ZERO any em codigo proprio" esta sendo cumprida integralmente.

#### Evidencia
- arquivo_ou_area: packages/**/*.ts, packages/**/*.tsx, apps/**/*.ts, apps/**/*.tsx
- detalhe: Grep por `: any\b|as any` em todos os .ts e .tsx do projeto retorna zero matches.

#### Impacto
- tecnico: Tipagem forte em todo o codebase reduz bugs em runtime.
- negocio: Maior confiabilidade do sistema.

#### Recomendacao
- acao_sugerida: Manter a pratica. Considerar adicionar regra ESLint `@typescript-eslint/no-explicit-any` como guard.
- prioridade: baixa

#### Observacoes
- Achado positivo.

---

### ACH-CM-002
- titulo: Arquitetura hexagonal consistente nos 15 modulos de negocio
- severidade: informativo
- categoria: arquitetura-codigo
- status: confirmado
- resumo: Todos os 15 modulos em packages/business seguem a estrutura domain/ ports/ adapters/ use-cases/ de forma consistente. Nenhum modulo viola o padrao.

#### Evidencia
- arquivo_ou_area: packages/business/{auth,clients,sales,catalog,inventory,finance,schedule,campaigns,messaging,analytics,ai,logistics,landing,platform,team}
- detalhe: Cada modulo possui diretorio domain/ com entities.ts e errors.ts, ports/ com interfaces de repositorio, adapters/ com implementacoes Prisma, e use-cases/ com logica de negocio.

#### Impacto
- tecnico: Consistencia facilita onboarding e manutencao.
- negocio: Menor custo de evolucao do sistema.

#### Recomendacao
- acao_sugerida: Nenhuma acao necessaria.
- prioridade: nenhuma

#### Observacoes
- Achado positivo.

---

### ACH-CM-003
- titulo: Repositorios instanciados como singletons no escopo de modulo nos routers
- severidade: baixo
- categoria: padrao-de-codigo
- status: confirmado
- resumo: Nos routers tRPC (ex: clients.ts, sales.ts, analytics.ts), os repositorios sao instanciados como `const clientRepo = new PrismaClientRepository()` no topo do modulo. Isso cria singletons implicitamente, o que funciona mas dificulta testabilidade (mocking) e futura injecao de dependencia.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/clients.ts:16, apps/api/src/routers/sales.ts:20-23, apps/api/src/routers/analytics.ts:10
- detalhe: `const clientRepo = new PrismaClientRepository()` instanciado no escopo do modulo, nao injetado.

#### Impacto
- tecnico: Dificulta testes de integracao dos routers e troca de implementacoes.
- negocio: Baixo impacto direto.

#### Recomendacao
- acao_sugerida: Considerar factory ou injecao via context para facilitar mocking em testes futuros.
- prioridade: baixa

#### Observacoes
- Nao e um problema imediato pois o projeto ainda nao tem testes de router.

---

### ACH-CM-004
- titulo: CRUD helpers reduzem duplicacao de codigo efetivamente
- severidade: informativo
- categoria: reutilizacao
- status: confirmado
- resumo: O arquivo crud-helpers.ts fornece createGetByIdProcedure e createDeleteProcedure que sao reutilizados em multiplos routers (clients, sales, catalog, etc.), eliminando duplicacao de boilerplate tRPC.

#### Evidencia
- arquivo_ou_area: apps/api/src/trpc/crud-helpers.ts
- detalhe: Dois helpers genericos que encapsulam pattern de getById e delete com protectedProcedure + uuidSchema.

#### Impacto
- tecnico: Menos codigo repetido, menor superficie de bugs.
- negocio: nenhum impacto direto.

#### Recomendacao
- acao_sugerida: Considerar adicionar createListProcedure como proximo helper.
- prioridade: baixa

#### Observacoes
- Achado positivo.

---

### ACH-CM-005
- titulo: Metodo bulkEditNames no PrismaClientRepository usa loop sequencial N+1
- severidade: medio
- categoria: code-smell
- status: confirmado
- resumo: O metodo bulkEditNames em prisma-client-repository.ts executa um findFirst + update para cada item do array em um loop sequencial, gerando N+1 queries e sem usar transacao.

#### Evidencia
- arquivo_ou_area: packages/business/clients/adapters/prisma-client-repository.ts:75-84
- detalhe: Loop `for (const edit of edits)` com findFirst + update individual por item, sem $transaction.

#### Impacto
- tecnico: Performance degradada com arrays grandes. Sem transacao, falha parcial pode deixar dados inconsistentes.
- negocio: Risco de inconsistencia em operacoes de edicao em massa.

#### Recomendacao
- acao_sugerida: Envolver em prisma.$transaction e considerar updateMany ou batch approach.
- prioridade: media

#### Observacoes
- Funcionalidade nao parece exposta no router atual, mas existe no repositorio.

---

### ACH-CM-006
- titulo: Nomes de arquivo consistentes exceto modulo auth
- severidade: baixo
- categoria: convencao-nomes
- status: confirmado
- resumo: A maioria dos modulos usa naming kebab-case simples (ex: prisma-client-repository.ts, create-client.ts). O modulo auth usa sufixo `.repository.ts`, `.adapter.ts`, `.use-case.ts` (ex: prisma-account.repository.ts, bcrypt-password-hasher.adapter.ts). Ambas as convencoes funcionam mas a inconsistencia entre modulos pode confundir.

#### Evidencia
- arquivo_ou_area: packages/business/auth/adapters/ vs packages/business/clients/adapters/
- detalhe: auth usa `prisma-account.repository.ts`, `prisma-session.repository.ts` enquanto clients usa `prisma-client-repository.ts`, `prisma-tag-repository.ts`.

#### Impacto
- tecnico: Inconsistencia leve de naming, nao afeta funcionalidade.
- negocio: Nenhum.

#### Recomendacao
- acao_sugerida: Padronizar para um estilo unico em toda a codebase quando possivel.
- prioridade: baixa

#### Observacoes
- O modulo auth foi o primeiro implementado e pode ter adotado uma convencao diferente.

---

### ACH-CM-007
- titulo: Imports relativos longos nos routers tRPC
- severidade: baixo
- categoria: convencao-imports
- status: confirmado
- resumo: Os routers em apps/api/src/routers/ usam imports relativos longos como `../../../../packages/business/clients/adapters/prisma-client-repository` em vez de path aliases como `@wbc/business`.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/clients.ts:4-12, apps/api/src/routers/sales.ts:5-17
- detalhe: Imports com quatro niveis de `../` para acessar packages/business.

#### Impacto
- tecnico: Imports frageis a mudancas de diretorio. Menos legibilidade.
- negocio: Nenhum.

#### Recomendacao
- acao_sugerida: Configurar path alias `@wbc/business` no tsconfig e turbo para simplificar imports.
- prioridade: baixa

#### Observacoes
- Os imports para @wbc/validators, @wbc/shared, @wbc/db ja usam aliases corretamente.

---

### ACH-CM-008
- titulo: Contexto de request (createAuthenticatedContext) nao inclui requestId
- severidade: baixo
- categoria: code-smell
- status: confirmado
- resumo: A funcao createAuthenticatedContext em context.ts retorna um TRPCContext com tenant preenchido mas sem requestId. O campo requestId so e gerado em createContext (sem auth). Isso pode resultar em logs sem requestId para requests autenticados.

#### Evidencia
- arquivo_ou_area: apps/api/src/trpc/context.ts:13-33
- detalhe: createAuthenticatedContext retorna `{ tenant: {...} }` sem campo `requestId`, enquanto TRPCContext exige `requestId: string`.

#### Impacto
- tecnico: Possivel undefined em ctx.requestId para requests autenticados, afetando rastreabilidade.
- negocio: Nenhum impacto direto.

#### Recomendacao
- acao_sugerida: Adicionar `requestId: randomUUID()` em createAuthenticatedContext.
- prioridade: media

#### Observacoes
- Depende de como o context e criado na pratica (se createContext e chamado antes).
