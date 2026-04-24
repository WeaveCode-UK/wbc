# Versioning Policy

> Criado pelo follow-up pós-auditoria 2026-04-24 (cross-ref `apis-integracoes/ACH-002`). Define como o WBC Platform versiona APIs tRPC, schemas de evento, schema Prisma e a aplicação como um todo.

## 1. Princípio geral

SemVer — `MAJOR.MINOR.PATCH` para releases da aplicação. Mudanças de **API pública** (tRPC expostos ao mobile, webhooks recebidos, esquemas de evento entre módulos) seguem a política abaixo, mesmo quando a versão da app não sobe.

## 2. Versão da aplicação

Lida em `package.json` raiz. Bumpa a cada release tag.

| Tipo de mudança                                    | Bump    |
| -------------------------------------------------- | ------- |
| Breaking change em API pública ou schema de evento | `MAJOR` |
| Nova feature sem breaking                          | `MINOR` |
| Bug fix, tweak interno, docs                       | `PATCH` |

Release tags seguem `vMAJOR.MINOR.PATCH` (ex.: `v1.2.3`).

O `CHANGELOG.md` é fonte de verdade do histórico — ver seção "Como manter" lá.

## 3. tRPC APIs

### 3.1. Consumidores

- **Mobile (`apps/mobile`)**: consome via tipos compartilhados; deploys quase-sempre pareados com `apps/web`.
- **Externo (futuro)**: quando tivermos integração com parceiro, o padrão muda.

### 3.2. Regras enquanto consumidor é só o mobile

Como mobile + web são deploy-pareados **a maior parte do tempo**:

- Mudanças de input ou output de procedures tRPC podem fluir junto com app update.
- **Mas**: app da store pode ficar 1-2 semanas antigo. Mudanças não-retrocompatíveis exigem política de "remove in next major" (ver 3.3).

### 3.3. Regras para breaking changes em tRPC

1. **Adicionar campo opcional ao output**: seguro. Mobile antigo ignora.
2. **Remover campo do output**: **breaking**. Renomear/remover exige deprecation:
   - PR #1: marca campo como deprecated, continua retornando.
   - PR #2 (≥ 30 dias depois): remove o campo.
3. **Adicionar campo obrigatório ao input**: **breaking**. Exceção: se der default sensato no server, é retrocompatível.
4. **Renomear procedure**: `/trpc/clients.list` → `clients.findMany`?
   - PR #1: cria novo endpoint; antigo vira alias.
   - PR #2 (≥ 30 dias depois): antigo retorna `410 Gone` com mensagem.
   - PR #3 (≥ 60 dias depois): antigo sumiria.

### 3.4. Versioning de rotas (futuro)

Hoje não há `/v1/` / `/v2/` no path. Quando o primeiro consumidor externo pedir contrato estável, introduzir:

```
apps/web/src/app/api/trpc/[trpc]/route.ts     → v0 atual
apps/web/src/app/api/v1/trpc/[trpc]/route.ts  → v1 estabilizado
```

Critério para introduzir: primeiro cliente externo pagante com SLA.

## 4. Schemas de evento (outbox)

### 4.1. Estado atual

Eventos em `packages/shared/src/events/domain-event.ts` seguem nomenclatura `module.action` (ex.: `sale.confirmed`). Payload validado por Zod em `packages/shared/src/events/schemas.ts`.

### 4.2. Breaking changes em payload

Eventos são persistidos no outbox e podem estar em `PENDING` quando o consumer muda. Consumer novo pode receber payload antigo. Regra:

1. **Adicionar campo opcional**: seguro (passthrough no Zod).
2. **Remover campo**: **breaking**. Deprecation como em tRPC — manter 30d mínimo.
3. **Mudar tipo de um campo**: **breaking hard** — exige nome novo: `module.action.v2`.

### 4.3. Naming de versão

Quando precisa quebrar:

- `sale.confirmed` → `sale.confirmed.v2` (novo event type).
- Handler antigo continua consumindo `v1` até que backlog esgote.
- Handler novo lê `v2`.
- Após 30 dias sem `v1` em `status=PENDING`, remover handler antigo.

## 5. Schema Prisma

### 5.1. Migrations additive

Padrão: migrations **always additive**. Nunca drop/rename em single migration. Processo:

1. Adicionar nova coluna nullable.
2. Dual-write (escrever na nova e na antiga) por ≥ 1 deploy.
3. Backfill da antiga → nova.
4. Flip reads para nova coluna.
5. Remover antiga em deploy futuro.

### 5.2. Manual migrations

Migrations não-triviais (ex.: RLS policies, seed data, complex backfills) vivem em `packages/db/prisma/migrations/manual/NNN_descricao.sql` e são aplicadas por `deploy.sh apply_manual_migrations` no deploy de produção.

### 5.3. Breaking changes

- Renomear tabela: dual-name com Prisma `@@map`, migrar schema, flip `@@map`, remover antiga.
- Drop coluna usada em prod: proibido sem processo 5.1.
- Change constraint (ex.: NOT NULL → nullable): seguro se nullable.
- NOT NULL em coluna que era nullable: **breaking**; exige backfill de todos os rows primeiro.

## 6. CLI / scripts

Scripts em `package.json` e `deploy/*.sh` são considerados API interna (não pública). Mudam sem deprecation, mas:

- Remover ou renomear script: atualizar `docs/DEVELOPMENT.md` na mesma PR.
- Mudar signature de `deploy.sh` comando: CHANGELOG `Changed`.

## 7. Config (`.env.production`)

- Adicionar nova env var: `docs/DEPLOYMENT.md` seção "Variáveis de ambiente críticas" atualiza.
- Remover/renomear var: breaking para deployments existentes → exige deprecation warning ≥ 1 release.

## 8. Deprecation log

Quando algo entra em deprecation:

- Issue com label `deprecation`, data de remoção sugerida.
- Entrada em `CHANGELOG.md` na seção `Deprecated`.
- Código: comentário `// @deprecated since v1.2.0 — use X instead; removal in v2.0.0`.

## 9. Pendências

- **Versionamento de rotas tRPC** (`/v1/`) — só ativar quando houver cliente externo.
- **Compatibility tests** — CI job que roda mobile antigo contra web novo; pendente.
- **Contract tests de outbox** — comparar payload persistido vs Zod; hoje temos validação em publish/consume mas não historical regression.

## Referências

- `CHANGELOG.md` — histórico de releases.
- `docs/architecture/api-deprecation.md` — processo técnico de deprecation.
- `docs/architecture/event-schemas.md` — catálogo de eventos.
- Cross-ref: `apis-integracoes/ACH-002`.

---

_Última revisão: 2026-04-24 · Próxima revisão esperada: 2026-10-24_
