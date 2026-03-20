# WBC Platform — Gerador de Prompts de Implementação

> **Tipo:** Meta-prompt (prompt que gera prompts)
> **Execução:** Claude Code CLI no diretório `/Users/robsonmacpro/WeaveCode/Sistemas/5-Dev/weavecode-wbc/wbc`
> **Objetivo:** Gerar prompts de implementação detalhados, fase a fase, para cada épico do WBC Platform. Os prompts gerados serão executados pelo modo EXECUTOR do Orchestrator.
> **Quem executa este documento:** O modo ARQUITETO do Orchestrator.
>
> **REGRAS CRÍTICAS:**
> - Gerar prompts APENAS para a fase que será executada em seguida (não todas de uma vez)
> - Cada prompt deve ser EXTREMAMENTE detalhado — código completo, não pseudocódigo
> - Cada prompt é autocontido — o EXECUTOR lê APENAS o prompt + regras invioláveis
> - NUNCA pare para perguntar. Gere os prompts e prossiga.
> - Leia WBC_REGRAS_INVIOLAVEIS.md ANTES de gerar qualquer prompt.

---

## DOCUMENTOS FONTE (OBRIGATÓRIOS — LER ANTES DE GERAR)

Os seguintes documentos estão na pasta `begin/` do projeto:

| Documento | Propósito | Quando consultar |
|-----------|-----------|------------------|
| `begin/WBC_REGRAS_INVIOLAVEIS.md` | Regras que o EXECUTOR nunca pode violar | Injetar em CADA prompt gerado |
| `begin/WBC_FASES_E_EPICOS.md` | Roadmap — fases, épicos, DoD | Saber O QUE cada épico faz |
| `begin/WBC-Implementacao-v1.0.md` | Schema Prisma, events, rotas tRPC | Base para CÓDIGO |
| `begin/WBC-Arquitetura-Tecnica-v1.0.md` | Monorepo, módulos, modelagem | Estrutura e organização |
| `begin/WBC-Funcionalidades-v1.2.md` | 105 funcionalidades, stack, planos | Contexto de produto |

**REGRA:** Não invente nada que não esteja nesses documentos. Se uma informação não existe nos docs, NÃO inclua no prompt.

---

## ESTRUTURA DE SAÍDA

Os prompts gerados são salvos em:

```
prompts/
├── fase-01/
│   ├── F1.E01_autenticacao_otp.md
│   ├── F1.E02_multi_tenancy_rls.md
│   ├── ...
│   └── F1.E08_checkpoint.md
├── fase-02/
│   ├── F2.E01_clients_domain.md
│   ├── ...
├── ...
└── fase-07/
    └── ...
```

---

## REGRAS DE GERAÇÃO

### Regra 1 — Uma Fase por Vez

Gere prompts APENAS para a próxima fase a ser executada. Após gerar todos os prompts da fase, commitar e prosseguir para EXECUÇÃO (não gerar a fase seguinte).

Fluxo por fase:
1. [ARQUITETO] Ler épicos da fase no WBC_FASES_E_EPICOS.md
2. [ARQUITETO] Consultar seções referenciadas nos docs técnicos
3. [ARQUITETO] Analisar estado atual do repositório (o que já existe)
4. [ARQUITETO] Gerar prompt para cada épico da fase
5. [ARQUITETO] Salvar em prompts/fase-XX/
6. [ARQUITETO] Commit: `prompts(fase-XX): generate implementation prompts`
7. [EXECUTOR] Executar cada prompt sequencialmente
8. Após executar todos → checkpoint → próxima fase

### Regra 2 — Código Completo, Não Pseudocódigo

Cada prompt DEVE conter:
- Código TypeScript completo que o EXECUTOR copia e implementa
- Nomes de arquivos exatos com paths completos relativos à raiz do monorepo
- Tipos TypeScript completos (zero `any`)
- Schemas Zod completos
- tRPC procedures com input/output tipados
- Queries Prisma completas com tenantId
- Domain events com payload tipado
- Imports explícitos (nunca "import the necessary...")

**Um prompt de 800 linhas é melhor que um de 80 que deixa margem para interpretação.**

### Regra 3 — Tasks Atômicas

Cada prompt é dividido em TASKS numeradas. Cada task:
- É uma unidade de trabalho que termina com UM commit
- Tem lista explícita de arquivos criados/modificados
- Tem código completo
- Tem mensagem de commit exata
- Termina com: **"PROSSIGA IMEDIATAMENTE para TASK N+1."**

### Regra 4 — Injeção de Regras Invioláveis

CADA prompt gerado DEVE começar com a seguinte seção (copiada literalmente):

```markdown
> **⚠️ ANTES DE EXECUTAR:** Leia WBC_REGRAS_INVIOLAVEIS.md. As seguintes regras são absolutas:
> - NUNCA pare, NUNCA pergunte, NUNCA espere confirmação
> - Execução sequencial — sem subagents
> - Literalidade absoluta — se não está no prompt, não existe
> - domain/ NUNCA importa de adapters/
> - tenantId OBRIGATÓRIO em toda query Prisma
> - ZERO strings hardcoded na UI — tudo via i18n
> - ZERO `any` — tipagem estrita
> - Commits: Conventional Commits em inglês
> - Sem testes durante construção
> - Ao concluir este épico → merge → próximo épico → NÃO PARAR
```

### Regra 5 — Verificação de Estado do Repositório

Antes de gerar prompts de uma fase, o ARQUITETO DEVE verificar o que já existe no repo:

```bash
# Ver estrutura atual
find apps packages -name "*.ts" -o -name "*.tsx" | head -80
# Ver exports dos packages
cat packages/*/src/index.ts 2>/dev/null
# Ver routers existentes
find apps/api/src -name "*.ts" 2>/dev/null
# Ver o que já foi implementado
cat prompts/STATE.json
```

Isso garante que os prompts gerados NÃO criam arquivos que já existem e NÃO assumem que algo existe quando não existe.

### Regra 6 — Sem Dependências Futuras

Cada prompt pode assumir:
- O bootstrap foi executado (monorepo existe)
- Os épicos ANTERIORES desta fase e de fases anteriores foram implementados
- Os packages @wbc/* existem e são importáveis

Cada prompt NÃO pode:
- Depender de algo que será implementado em épicos FUTUROS
- Modificar código de épicos anteriores (exceto extensões explícitas)
- Criar arquivos fora do escopo do épico

### Regra 7 — Ordem de Implementação Dentro de Cada Épico

As tasks dentro de cada prompt DEVEM seguir esta ordem:

1. **Domain** — Entities, VOs, Events, Ports, Errors
2. **Use Cases** — Application logic consuming ports
3. **Adapters** — Prisma repositories, external API adapters
4. **Interfaces** — tRPC routers, DTOs, webhook handlers
5. **Event Handlers** — Subscribers que reagem a domain events
6. **Wiring** — Conectar tudo (exports, re-exports, registrar no router principal, registrar event handlers)
7. **i18n** — Keys de tradução pt-BR e en para textos deste módulo

NÃO incluir testes (Fase 7).

### Regra 8 — Convenções de Commit por Task

```
feat(scope): description    — nova feature/arquivo
fix(scope): description     — correção
refactor(scope): description — sem mudança de comportamento
chore(scope): description   — config/infra
docs(scope): description    — documentação
```

Cada task = 1 commit. Mensagem exata definida no prompt.

---

## TEMPLATE OBRIGATÓRIO PARA CADA PROMPT GERADO

```markdown
# [FX.EYY] — [Nome do Épico]

> **Fase:** X — [Nome da Fase]
> **Épico:** FX.EYY
> **Prioridade:** Y de Z (nesta fase)
> **Depende de:** [lista de épicos concluídos]
> **Estimativa de tasks:** N tasks

> **⚠️ ANTES DE EXECUTAR:** Leia WBC_REGRAS_INVIOLAVEIS.md. As seguintes regras são absolutas:
> - NUNCA pare, NUNCA pergunte, NUNCA espere confirmação
> - Execução sequencial — sem subagents
> - Literalidade absoluta — se não está no prompt, não existe
> - domain/ NUNCA importa de adapters/
> - tenantId OBRIGATÓRIO em toda query Prisma
> - ZERO strings hardcoded na UI — tudo via i18n
> - ZERO `any` — tipagem estrita
> - Commits: Conventional Commits em inglês
> - Sem testes durante construção
> - Ao concluir este épico → merge → próximo épico → NÃO PARAR

---

## CONTEXTO

[Parágrafo explicando o que esse épico faz, por que é necessário, e como se encaixa.
Referenciar documentos técnicos.]

## PRÉ-CONDIÇÕES

- [ ] [Épico X] implementado
- [ ] [Package Y] disponível
- [ ] [Infra Z] rodando

## RESULTADO ESPERADO

Ao final deste prompt:
- [Resultado concreto 1]
- [Resultado concreto 2]
- [...]

---

## TASKS

### TASK 1 de N — [Nome descritivo]

**Objetivo:** [O que esta task faz]

**Arquivos criados:**
- `path/to/file1.ts` (novo)
- `path/to/file2.ts` (novo)

**Arquivos modificados:**
- `path/to/existing.ts` (adicionar X)

**Código:**

```typescript
// path/to/file1.ts
[CÓDIGO TYPESCRIPT COMPLETO — não pseudocódigo]
```

```typescript
// path/to/file2.ts
[CÓDIGO TYPESCRIPT COMPLETO]
```

**Commit:**
```bash
git add [arquivos específicos]
git commit -m "feat(scope): description"
```

**PROSSIGA IMEDIATAMENTE para TASK 2.**

---

### TASK 2 de N — [Nome descritivo]
[... mesmo formato ...]

**PROSSIGA IMEDIATAMENTE para TASK 3.**

---

[... todas as tasks ...]

---

### TASK N de N — [Última task]
[... código ...]

**Commit:**
```bash
git add [arquivos]
git commit -m "feat(scope): complete FX.EYY — [nome]"
```

---

## FINALIZAÇÃO DO ÉPICO

Execute EXATAMENTE esta sequência:

1. Atualizar prompts/STATE.json (epic status = COMPLETED, avançar current_epic)
2. git add prompts/STATE.json
3. git commit -m "state: FX.EYY complete — advancing to FX.E{YY+1}"
4. git checkout main
5. git merge fase-XX/FX.EYY_nome --no-ff
6. git branch -d fase-XX/FX.EYY_nome
7. git checkout -b fase-XX/FX.E{YY+1}_nome_proximo
8. PROSSEGUIR IMEDIATAMENTE para o próximo épico. NÃO PARAR. NÃO PERGUNTAR.

---

## CRITÉRIOS DE CONCLUSÃO (DoD)

- [ ] [Critério 1]
- [ ] [Critério 2]
- [ ] [...]
```

---

## REGRAS ANTI-DRIFT ADICIONAIS PARA O ARQUITETO

1. **Não gere prompts vagos.** Se um épico diz "implementar CRUD de clientes", o prompt deve ter o código completo de cada operação CRUD, não "implemente as operações CRUD".

2. **Não assuma que o EXECUTOR sabe o projeto.** O EXECUTOR lê APENAS o prompt do épico + regras invioláveis. Se ele precisa saber que o tenantId vem do JWT, diga isso explicitamente no prompt.

3. **Repita informações críticas.** Se 3 tasks diferentes precisam de tenantId, mencione o tenantId em cada uma das 3 tasks. Não diga "como na task anterior".

4. **Especifique imports.** Não escreva "import the necessary dependencies". Escreva `import { prisma } from '@wbc/db';` explicitamente.

5. **Especifique paths.** Não escreva "crie o arquivo do repository". Escreva "crie `packages/business/clients/adapters/prisma-client-repository.ts`".

6. **Não misture módulos.** Cada prompt = 1 épico = 1 módulo (na maioria dos casos). Se o épico toca 2 módulos, separe claramente qual código vai em qual pasta.

7. **A última linha de cada prompt é SEMPRE:** "PROSSEGUIR IMEDIATAMENTE para o próximo épico. NÃO PARAR. NÃO PERGUNTAR."

---

## PROCEDIMENTO DE GERAÇÃO (EXECUTAR AGORA)

### Passo 1 — Ler Documentos

```bash
# Ler regras invioláveis (OBRIGATÓRIO)
cat begin/WBC_REGRAS_INVIOLAVEIS.md

# Ler fases e épicos (saber o que gerar)
cat begin/WBC_FASES_E_EPICOS.md

# Ler implementação (base de código)
cat begin/WBC-Implementacao-v1.0.md

# Ler arquitetura (estrutura)
cat begin/WBC-Arquitetura-Tecnica-v1.0.md
```

Absorva o conteúdo. NÃO prossiga sem ter lido.

### Passo 2 — Verificar Estado

```bash
cat prompts/STATE.json
```

Identificar qual fase deve ser gerada.

### Passo 3 — Verificar Repositório

```bash
find apps packages -name "*.ts" -o -name "*.tsx" 2>/dev/null | head -80
```

Saber o que já existe.

### Passo 4 — Gerar Prompts da Fase Atual

Para cada épico da fase (em ordem):
1. Ler o épico no WBC_FASES_E_EPICOS.md
2. Consultar seções referenciadas nos docs técnicos
3. Gerar prompt completo seguindo o template obrigatório
4. Salvar em `prompts/fase-XX/FX.EYY_nome.md`

### Passo 5 — Commit e Prosseguir

```bash
git add prompts/fase-XX/
git commit -m "prompts(fase-XX): generate implementation prompts for Phase X"
```

Atualizar STATE.json: `current_mode: "EXECUTOR"`

**PROSSEGUIR IMEDIATAMENTE para execução dos prompts. NÃO PARAR.**

---

**Este documento é usado pelo modo ARQUITETO do Orchestrator. Após gerar os prompts de uma fase, o Orchestrator muda para modo EXECUTOR e começa a implementar. O ciclo se repete para cada fase.**
