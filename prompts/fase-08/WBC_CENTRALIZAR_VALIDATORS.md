# WBC Platform — Centralização de Validators Zod

> **Tipo:** Prompt de refatoração autônoma
> **Execução:** Claude Code CLI no diretório `/Users/robsonmacpro/WeaveCode/Sistemas/5-Dev/weavecode-wbc/wbc`
> **Objetivo:** Extrair TODOS os schemas Zod que estão inline nos tRPC routers e centralizá-los em `packages/validators/src/`, organizados por módulo. Os routers passam a importar de `@wbc/validators`.
> **Modo:** Dangerous Mode + Bypass ON. Execução contínua.
>
> **⚠️ REGRAS DE EXECUÇÃO (INVIOLÁVEIS):**
> - NUNCA pare, NUNCA pergunte, NUNCA espere confirmação
> - Execução sequencial — sem subagents
> - Literalidade absoluta — se não está neste prompt, não existe
> - ZERO `any` — tipagem estrita
> - Commits: Conventional Commits em inglês
> - Ao concluir cada bloco → commit → próximo bloco → NÃO PARAR
> - Ao concluir TUDO → pnpm type-check → tag v1.2.0 → PARAR

---

# PROCEDIMENTO

## PASSO 1 — Levantamento

Antes de criar qualquer arquivo, leia TODOS os routers pra saber quais schemas Zod existem inline:

```bash
# Listar todos os schemas z.object dentro dos routers
grep -n "z\.object\|z\.string\|z\.number\|z\.enum\|z\.array" apps/api/src/routers/*.ts
```

Analisar o output e identificar cada schema que está definido inline dentro de `.input()` dos procedures tRPC.

**NÃO prossiga sem ter lido todos os routers. NÃO PARE — leia e prossiga imediatamente.**

---

## PASSO 2 — Criar Validators por Módulo

Para CADA router que tem schemas inline, criar um arquivo correspondente em `packages/validators/src/`.

A estrutura final deve ser:

```
packages/validators/src/
├── common.ts          ← já existe (pagination, uuid, phone, dateRange)
├── auth.ts            ← schemas de auth
├── clients.ts         ← schemas de clients
├── catalog.ts         ← schemas de catalog
├── sales.ts           ← schemas de sales
├── campaigns.ts       ← schemas de campaigns
├── messaging.ts       ← schemas de messaging
├── ai.ts              ← schemas de ai
├── inventory.ts       ← schemas de inventory
├── finance.ts         ← schemas de finance
├── schedule.ts        ← schemas de schedule
├── team.ts            ← schemas de team
├── analytics.ts       ← schemas de analytics
├── logistics.ts       ← schemas de logistics
├── landing.ts         ← schemas de landing
├── platform.ts        ← schemas de platform
└── index.ts           ← re-exporta tudo
```

### Regras para extração:

1. **Ler o router** (ex: `apps/api/src/routers/clients.ts`)
2. **Identificar cada `z.object({...})`** usado em `.input()`
3. **Mover para `packages/validators/src/clients.ts`** como export nomeado
4. **Naming convention:** `{action}{Module}Schema` (ex: `createClientSchema`, `updateClientSchema`, `listClientsSchema`, `getClientByIdSchema`)
5. **No router:** trocar o `z.object({...})` inline por import do schema: `import { createClientSchema } from '@wbc/validators'`
6. **Reutilizar `paginationSchema` e `uuidSchema`** de common.ts onde aplicável (ex: `.merge(paginationSchema)`)
7. **Não mudar a lógica do router** — apenas extrair os schemas

### Template por módulo:

```typescript
// packages/validators/src/{module}.ts
import { z } from 'zod';
import { paginationSchema, uuidSchema } from './common';

export const create{Module}Schema = z.object({
  // campos extraídos do router
});

export const update{Module}Schema = z.object({
  id: uuidSchema,
  // campos extraídos do router
});

export const list{Module}Schema = paginationSchema.extend({
  // filtros extraídos do router
});

export const get{Module}ByIdSchema = z.object({
  id: uuidSchema,
});

// ... todos os schemas do módulo
```

### Execução por módulo:

Para CADA módulo (auth, clients, catalog, sales, campaigns, messaging, ai, inventory, finance, schedule, team, analytics, logistics, landing, platform):

1. Ler `apps/api/src/routers/{module}.ts`
2. Extrair TODOS os schemas inline pra `packages/validators/src/{module}.ts`
3. Atualizar o router pra importar de `@wbc/validators`
4. Commitar:
```bash
git add packages/validators/src/{module}.ts apps/api/src/routers/{module}.ts
git commit -m "refactor({module}): extract inline Zod schemas to @wbc/validators"
```
5. Ir pro próximo módulo. NÃO PARAR.

**IMPORTANTE:** Se um router NÃO tem schemas inline (usa apenas strings ou IDs simples), criar o arquivo mesmo assim com os schemas básicos (getById, list) pra manter consistência. Se o router genuinamente não precisa de validators, pular e ir pro próximo.

---

## PASSO 3 — Atualizar index.ts do Validators

Após extrair todos os schemas, atualizar `packages/validators/src/index.ts`:

```typescript
export * from './common';
export * from './auth';
export * from './clients';
export * from './catalog';
export * from './sales';
export * from './campaigns';
export * from './messaging';
export * from './ai';
export * from './inventory';
export * from './finance';
export * from './schedule';
export * from './team';
export * from './analytics';
export * from './logistics';
export * from './landing';
export * from './platform';
```

**Commit:**
```bash
git add packages/validators/src/index.ts
git commit -m "chore(validators): update barrel file with all module schemas"
```

**PROSSIGA IMEDIATAMENTE para PASSO 4.**

---

## PASSO 4 — Verificação Final

```bash
echo "=== VERIFICAÇÃO VALIDATORS ==="

# Type-check
pnpm type-check
if [ $? -ne 0 ]; then
  echo "❌ Type-check falhou — corrigindo..."
  for i in 1 2 3; do
    echo "Tentativa $i..."
    pnpm type-check && break
  done
fi

# Verificar que NÃO existem mais z.object inline nos routers
echo ""
echo "=== SCHEMAS INLINE RESTANTES (deve ser zero ou mínimo) ==="
grep -c "z\.object({" apps/api/src/routers/*.ts | grep -v ":0"
echo ""

# Contar validators
echo "=== VALIDATORS CRIADOS ==="
ls packages/validators/src/*.ts | wc -l
echo "arquivos em packages/validators/src/"
echo ""

# Listar exports
echo "=== EXPORTS ==="
grep "export" packages/validators/src/index.ts
echo ""

# Tag
git tag v1.2.0
git add -A
git commit -m "refactor: centralize all Zod validators — v1.2.0"

echo ""
echo "✅ CENTRALIZAÇÃO COMPLETA — WBC Platform v1.2.0"
echo "Todos os schemas Zod extraídos dos routers para @wbc/validators"
echo "Routers importam de @wbc/validators em vez de definir inline"
echo ""
echo "PARAR."
```

---

**FIM DO PROMPT. Executar sequencialmente, sem parar, sem perguntar. Ao concluir: tag v1.2.0 e PARAR.**
