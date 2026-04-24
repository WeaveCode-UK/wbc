# Filtering & Sorting — API convention

> Criado pelo follow-up pós-auditoria 2026-04-24 (cross-ref `apis-integracoes/ACH-011`). Define convenção unificada para **listagens** (clients, sales, appointments, campaigns, etc.) na API tRPC e no mobile.

Sem convenção, cada módulo inventa os próprios params (`sortBy`, `orderBy`, `sort`, `orderField` — tudo já apareceu no repo). Isso gera bugs de integração entre web/mobile e dificulta migração de dados em listas grandes.

## 1. Objetivos

- **Cursor-based pagination** como padrão (não offset) — performance estável em tabelas grandes + resistente a inserts concorrentes.
- **Filter como objeto** — não como N query params ad-hoc.
- **Sort explícito** — sem default implícito mágico.
- **Validação no contrato** — Zod schema rejeita shape inválido na entrada.

## 2. Shape padrão

Procedure tRPC de listagem deve aceitar um input no formato:

```ts
const ListInput = z.object({
  filter: z
    .object({
      // campos específicos do domínio; ver seção 4
    })
    .optional(),
  sort: z
    .object({
      field: z.enum(["createdAt", "updatedAt" /* allowed */]),
      direction: z.enum(["asc", "desc"]).default("desc"),
    })
    .optional(),
  pagination: z
    .object({
      limit: z.number().int().min(1).max(100).default(20),
      cursor: z.string().optional(), // opaque, base64(last.id + last.sortValue)
    })
    .optional(),
});
```

Response:

```ts
{
  items: T[],
  nextCursor: string | null,  // null = fim
  totalApprox?: number,       // opcional; só se contagem for barata
}
```

## 3. Cursor

Cursor é **opaque para o cliente**. Server faz `base64(JSON.stringify({id, sortValue}))`. Cliente passa de volta sem tocar.

Implementação server:

```ts
// pseudo — criar helper em @wbc/shared quando primeiro consumer migrar
function encodeCursor(item: { id: string; sortValue: unknown }): string {
  return Buffer.from(
    JSON.stringify({ i: item.id, s: item.sortValue }),
  ).toString("base64url");
}

function decodeCursor(cursor: string): { i: string; s: unknown } {
  return JSON.parse(Buffer.from(cursor, "base64url").toString());
}
```

Query Prisma usa `cursor` + `take`:

```ts
await prisma.client.findMany({
  where: filterToWhere(filter),
  take: pagination.limit + 1, // peek next
  cursor: cursor ? { id: decodeCursor(cursor).i } : undefined,
  skip: cursor ? 1 : 0,
  orderBy: { [sort.field]: sort.direction },
});
```

Peek no `+1` determina se há próxima página sem precisar de COUNT.

## 4. Filtros

### 4.1. Shape

Filter é **sempre um objeto**, nunca boolean/string direto. Isso permite evolução:

```ts
// ruim — cresce bagunçado
{search: "x", isActive: true, tagIds: ["a", "b"]}

// bom — agrupa por intenção
{
  search: {term: "x", fields: ["name", "phone"]},
  status: {active: true},
  tags: {any: ["a", "b"]},
}
```

### 4.2. Convenção de nomes

- **Range temporal**: `{createdAt: {from, to}}` (ambos opcionais, ISO 8601).
- **In-list**: `{ids: ["...", "..."]}` ou `{status: {any: [...]}}`.
- **Busca texto**: `{search: {term, fields?}}`.
- **Booleano**: preferir enum — `{status: "active" | "inactive" | "all"}` em vez de `{isActive: true}`.

### 4.3. Filtros obrigatórios vs opcionais

- `tenantId` é **injetado pelo middleware** (ctx.tenant.tenantId). Nunca aceitar do cliente.
- Filtros de autorização (ex.: "consultor só vê seus clientes") também no middleware, não no input.

## 5. Sorting

- `field` é um **enum whitelisted** — nunca aceitar string arbitrária.
- Default: `{field: "createdAt", direction: "desc"}` — mais recentes primeiro.
- Multi-sort não é padrão (complica cursor). Se precisar, caso-a-caso.

## 6. Exemplo completo

Listagem de clientes:

```ts
// apps/web/src/server/api/routers/clients.ts (exemplo — pendente refactor)
import { z } from "zod";
import { tenantProcedure } from "../trpc";

const ClientFilterSchema = z.object({
  search: z
    .object({
      term: z.string().min(1),
      fields: z.array(z.enum(["name", "phone", "email"])).default(["name"]),
    })
    .optional(),
  classification: z.enum(["A", "B", "C", "all"]).default("all"),
  tagIds: z.object({ any: z.array(z.string().uuid()) }).optional(),
  lastSaleAt: z
    .object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional(),
    })
    .optional(),
});

const ClientSortSchema = z.object({
  field: z.enum(["createdAt", "updatedAt", "lastSaleAt", "name"]),
  direction: z.enum(["asc", "desc"]).default("desc"),
});

const ClientListInput = z.object({
  filter: ClientFilterSchema.optional(),
  sort: ClientSortSchema.optional(),
  pagination: z
    .object({
      limit: z.number().int().min(1).max(100).default(20),
      cursor: z.string().optional(),
    })
    .optional(),
});

export const clientsRouter = router({
  list: tenantProcedure.input(ClientListInput).query(async ({ ctx, input }) => {
    // implementação com encodeCursor / decodeCursor / Prisma
    // ...
  }),
});
```

## 7. Mobile adoption

Client helper em `@wbc/shared` (pendente):

```ts
// pseudo
const { data, fetchNextPage } = useInfiniteQuery(
  trpc.clients.list,
  { filter, sort },
  { getNextPageParam: (lastPage) => lastPage.nextCursor },
);
```

## 8. Migração

Rotas existentes que não seguem esta convenção devem migrar:

- [ ] `clients.list` — existe `search` ad-hoc; refactor.
- [ ] `sales.list` — existe `sortBy` string livre; refactor.
- [ ] `appointments.list` — aceita offset; migrar para cursor.
- [ ] `campaigns.list` — já tem cursor parcial; validar contra convenção.

Seguir 5.1 de `docs/VERSIONING.md` (dual-read por 1 release, depois remover antigo).

## 9. Performance

Cursor pagination + índice composto (`tenantId, <sortField>`) mantém listas escaláveis até milhões de linhas. Sem índice, performance degrada linearmente.

Toda nova rota de listagem deve ter índice no Prisma schema. Exemplo:

```prisma
model Client {
  // ...
  @@index([tenantId, createdAt]) // para sort default
  @@index([tenantId, updatedAt])
  @@index([tenantId, classification])
}
```

## Referências

- Cross-ref: `apis-integracoes/ACH-011`, `performance-escalabilidade/ACH-003`.
- Versionamento de API: `docs/VERSIONING.md`.
- Índices DB: `docs/architecture/db-observability.md`.

---

_Última revisão: 2026-04-24 · Próxima revisão esperada: 2026-10-24_
