# WBC Platform — REGRAS INVIOLÁVEIS

> **Tipo:** Contrato de execução — injetado em CADA prompt de épico
> **Escopo:** TODO código, TODA decisão, TODA ação do agente
> **Violação:** Qualquer desvio destas regras invalida o épico inteiro
>
> Este documento é CURTO de propósito. Ele deve caber no contexto de qualquer prompt.
> Ele é a LEI. Não há exceções. Não há interpretação. Não há "quase".

---

## 0. FLUXO CONTÍNUO — A REGRA SUPREMA

```
NUNCA PARE.
NUNCA PERGUNTE.
NUNCA ESPERE CONFIRMAÇÃO.
NUNCA ESCREVA "posso continuar?", "deseja que eu prossiga?", "pronto, o que mais?".

Ao concluir uma task → vá para a próxima task.
Ao concluir um épico → faça commit, atualize STATE.json, vá para o próximo épico.
Ao concluir uma fase → faça checkpoint, vá para a próxima fase.
Ao concluir a última fase → pare e reporte "BUILD COMPLETO".

O ÚNICO motivo aceitável para parar:
- Erro fatal que impede a continuação (ex: banco não conecta, dependência inexistente)
- Nesse caso: registre o erro no STATE.json com status BLOCKED e pare.

Qualquer outro cenário: PROSSIGA IMEDIATAMENTE.
```

---

## 1. EXECUÇÃO SEQUENCIAL — SEM SUBAGENTS

```
- Executar TUDO sequencialmente. Um épico por vez. Uma task por vez.
- PROIBIDO delegar tasks para subagents ou agentes paralelos.
- PROIBIDO usar spawn de agentes menores.
- Se o Claude Code oferecer paralelização ou subagents: RECUSAR.
- Motivo: subagents usam modelos menores que não seguem regras com rigor.
```

---

## 2. LITERALIDADE ABSOLUTA

```
- Se o prompt diz "crie arquivo X com conteúdo Y": crie arquivo X com conteúdo Y.
- Se o prompt NÃO menciona algo: esse algo NÃO EXISTE. Não invente.
- PROIBIDO adicionar features, arquivos, funções, campos ou lógica não especificados.
- PROIBIDO "melhorar" o que o prompt pede. Implemente EXATAMENTE o que está escrito.
- PROIBIDO interpretar criativamente. Código criativo = código errado.
- Se houver ambiguidade: escolha a implementação MAIS SIMPLES e MAIS CURTA.
- Na dúvida entre fazer mais ou fazer menos: FAÇA MENOS.
```

---

## 3. ARQUITETURA HEXAGONAL — REGRA DE IMPORTAÇÃO

```
- domain/ NUNCA importa de adapters/
- domain/ NUNCA importa de infrastructure/
- domain/ NUNCA importa de interfaces/
- domain/ importa APENAS de: domain/ (mesmo módulo ou shared types)
- use-cases/ importa de: domain/ e ports/ (NUNCA de adapters/)
- adapters/ implementam ports/ (é o ÚNICO lugar que importa libs externas como Prisma, Redis etc.)
- Violação desta regra = épico inteiro inválido.
```

---

## 4. MULTI-TENANT — tenantId OBRIGATÓRIO

```
- TODA query Prisma DEVE incluir tenantId no WHERE. Sem exceção.
- TODA criação de registro DEVE incluir tenantId. Sem exceção.
- NUNCA fazer query sem filtro de tenant (mesmo "só pra testar").
- Tabelas de sistema (Brand com isSystem=true, OtpCode) são as ÚNICAS exceções.
- Violação desta regra = vazamento de dados entre tenants = falha crítica.
```

---

## 5. i18n — ZERO STRINGS HARDCODED

```
- NENHUM texto visível ao usuário pode estar hardcoded no código.
- Todo texto na UI: via useTranslations('namespace') ou equivalente mobile.
- Placeholders, labels, mensagens de erro, tooltips, botões: TUDO via i18n.
- Exceções: nomes de variáveis, logs internos, chaves técnicas.
- Ao criar um componente UI: criar as keys em pt-BR E en simultaneamente.
```

---

## 6. TIPAGEM — ZERO any

```
- PROIBIDO usar 'any' em código próprio.
- Todo input tRPC: schema Zod obrigatório.
- Todo output tRPC: tipo explícito ou inferido do Zod.
- 'as const' em constantes.
- 'import type' para imports de tipo.
- Tipos de libs externas (@types/*) são a única exceção onde 'any' pode aparecer.
```

---

## 7. COMUNICAÇÃO ENTRE MÓDULOS — APENAS EVENTOS

```
- Módulos de negócio (packages/business/*) NUNCA se chamam diretamente.
- Comunicação APENAS via domain events publicados no BullMQ.
- Um módulo emite evento → outros módulos escutam e reagem.
- NUNCA importar use-case de um módulo dentro de outro módulo.
- Exceção: packages/shared (types e event definitions) pode ser importado por todos.
```

---

## 8. COMMITS — CONVENTIONAL COMMITS

```
- Todo commit segue: type(scope): description
- Types: feat, fix, refactor, chore, docs
- Scopes: auth, clients, catalog, sales, campaigns, messaging, ai, inventory, finance, schedule, team, analytics, logistics, landing, platform, ui, database, cache, i18n, observability
- Mensagem em inglês, sempre lowercase, sem ponto final.
- Um commit por task (cada task do prompt = 1 commit).
- NUNCA fazer commit com mensagem genérica ("update", "fix", "changes").
```

---

## 9. STATE.json — FONTE DE VERDADE

```
- ANTES de qualquer ação: ler prompts/STATE.json.
- APÓS cada task concluída: atualizar STATE.json e commitar.
- O STATE.json define: fase atual, épico atual, task atual, status.
- Se o agente reiniciar: ler STATE.json e retomar EXATAMENTE de onde parou.
- NUNCA confiar na memória — confiar APENAS no STATE.json.
- Formato de atualização do STATE.json após cada task:
  git add prompts/STATE.json
  git commit -m "state: F{X}.E{YY} task {N} complete"
```

---

## 10. SEM TESTES DURANTE CONSTRUÇÃO

```
- PROIBIDO escrever testes durante as fases de construção (Fases 1 a 6).
- Testes são uma FASE DEDICADA ao final (Fase 7).
- Motivo: testes durante construção quebram em cascata quando épicos seguintes mudam interfaces.
- O que fazer nas fases de construção: escrever código funcional, commitar, avançar.
- O que NÃO fazer: criar arquivos *.test.ts, *.spec.ts, ou pastas __tests__/.
- Exceção: NENHUMA. Zero testes até a Fase 7.
```

---

## 11. GATES SIMPLIFICADOS

```
- Entre épicos: NENHUM gate. Terminou → commita → próximo épico.
- Entre fases: APENAS pnpm type-check (verificação de tipos do monorepo inteiro).
  - Se type-check PASSAR: tag da fase, prosseguir.
  - Se type-check FALHAR: corrigir os erros de tipo, commitar, re-rodar type-check. Max 3 tentativas.
  - Após 3 falhas: STATUS=BLOCKED no STATE.json, parar.
- Build completo (pnpm build): APENAS na fase final.
- Lint (pnpm lint): APENAS na fase final.
- Testes: APENAS na fase final.
```

---

## 12. COMPACTAÇÃO DE CONTEXTO

### 12a. Ao iniciar uma FASE (modo ARQUITETO):

```
1. Ler STATE.json (saber onde está)
2. Reler begin/WBC_REGRAS_INVIOLAVEIS.md (este documento)
3. Reler begin/WBC_GERADOR_DE_PROMPTS.md (regras de geração)
4. Ler a seção da fase atual em begin/WBC_FASES_E_EPICOS.md (via grep ou leitura parcial)
5. Consultar seções referenciadas dos docs técnicos em begin/ (apenas as seções, não o doc inteiro)
6. NÃO carregar prompts de épicos anteriores ou futuros
```

### 12b. Ao iniciar um ÉPICO (modo EXECUTOR):

```
1. Ler STATE.json (saber onde está)
2. Ler begin/WBC_REGRAS_INVIOLAVEIS.md (este documento)
3. Ler o prompt do épico atual: prompts/fase-XX/FX.EYY_nome.md
4. NADA MAIS — estes 3 itens = fonte de verdade completa do EXECUTOR
5. NÃO carregar outros prompts, docs técnicos, ou prompts de épicos anteriores
```

### 12c. Prioridade se contexto apertado:

```
1. Prompt do épico (ESSENCIAL — fonte de verdade para execução)
2. Este documento de regras (ESSENCIAL — contrato inviolável)
3. STATE.json (para retomada)
```

---

## 13. ESTRUTURA DE ARQUIVOS — RESPEITAR MONOREPO

```
- Cada arquivo vai no local correto do monorepo conforme definido na arquitetura.
- NUNCA criar arquivos fora da estrutura definida.
- NUNCA criar pastas ad-hoc ("temp/", "misc/", "helpers/").
- Se o prompt não especifica onde criar um arquivo: NÃO criar. É uma omissão do prompt, não uma oportunidade criativa.
```

---

## 14. DANGEROUS MODE — REGRAS DE OPERAÇÃO

```
- Dangerous mode + bypass ON: o agente executa comandos sem pedir permissão.
- Isso NÃO significa "faça o que quiser". Significa "execute sem perguntar".
- Todas as outras regras deste documento continuam valendo integralmente.
- Dangerous mode é sobre VELOCIDADE de execução, não sobre LIBERDADE de decisão.
- O agente segue o prompt ao pé da letra, apenas sem parar pra pedir OK.
```

---

## 15. FINALIZAÇÃO DE CADA ÉPICO

```
Ao concluir TODAS as tasks de um épico, execute EXATAMENTE esta sequência:

1. git add -A
2. git commit -m "feat({scope}): complete F{X}.E{YY} — {nome do épico}"
3. Atualizar STATE.json (epic status = COMPLETED, avançar current_epic)
4. git add prompts/STATE.json
5. git commit -m "state: F{X}.E{YY} complete — advancing to F{X}.E{YY+1}"
6. git checkout main
7. git merge fase-XX/FX.EYY_nome --no-ff
8. git branch -d fase-XX/FX.EYY_nome
9. Criar branch do próximo épico: git checkout -b fase-XX/FX.E{YY+1}_nome
10. PROSSEGUIR IMEDIATAMENTE para o próximo épico. NÃO PARAR.

EXCEÇÃO — CHECKPOINTS:
Se o próximo épico é o ÚLTIMO da fase (checkpoint), NÃO criar branch.
Em vez disso, permanecer em main e executar o procedimento de checkpoint (Regra 16).
```

---

## 16. FINALIZAÇÃO DE CADA FASE (CHECKPOINT)

```
O último épico de cada fase é um CHECKPOINT — NÃO é um épico de implementação.
O Orchestrator NÃO gera prompt para checkpoints. Executa o procedimento diretamente.

Procedimento de checkpoint:

1. git checkout main
2. pnpm install
3. pnpm type-check
4. Se type-check falhar: corrigir, commitar, re-rodar (max 3 tentativas)
5. Se passar: git tag v{X}.{Y}.0-fase-{XX}
6. Atualizar STATE.json (phase status = COMPLETED, avançar current_phase, mode = ARCHITECT)
7. git add prompts/STATE.json
8. git commit -m "state: phase {XX} complete — advancing to phase {XX+1}"
9. PROSSEGUIR IMEDIATAMENTE para a próxima fase. NÃO PARAR.
```

---

## CHECKSUMS DE REGRAS

Para o agente verificar que leu este documento completo:

```
REGRAS_TOTAL: 16 (0 a 16, sendo 0 a regra suprema)
REGRA_SUPREMA: Fluxo contínuo — nunca pare, nunca pergunte
REGRA_CRITICA_1: Sequencial, sem subagents
REGRA_CRITICA_2: Literalidade absoluta
REGRA_CRITICA_3: tenantId obrigatório em toda query
REGRA_CRITICA_4: Checkpoints NÃO são épicos de implementação — executar type-check + tag diretamente
REGRA_FINAL: Ao concluir épico → merge → próximo épico → NÃO PARAR
```

Se o agente não conseguir recitar estas 6 linhas, ele NÃO leu o documento corretamente.

---

**Este documento deve ser lido ANTES de cada épico. Sem exceção.**
