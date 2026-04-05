# Achados da Auditoria

## Identificacao
- dominio: dados-persistencia
- run_id: 2026-04-05_18-00-00
- ultima_atualizacao: 2026-04-05 18:30:00

## Severidades Permitidas
- critico, alto, medio, baixo, informativo

## Status Permitidos
- aberto, confirmado, mitigado, resolvido, aceito, nao_aplicavel

## Achados Registrados

### ACH-DP-001
- titulo: Schema Prisma completo com 35+ modelos e onDelete correto
- severidade: informativo
- categoria: schema
- status: confirmado
- resumo: O schema.prisma define 35+ modelos cobrindo todos os dominios de negocio. Regras de onDelete sao consistentes: Cascade para dependentes (Tag, Wishlist, SaleItem), Restrict para entidades referenciadas por vendas (Client via Sale), SetNull para relacoes opcionais (Campaign em Sale).

#### Evidencia
- arquivo_ou_area: packages/db/prisma/schema.prisma
- detalhe: Client->Sale usa onDelete: Restrict (impede exclusao de cliente com vendas). Campaign->Sale usa SetNull. Subscription->Tenant usa Cascade.

#### Impacto
- tecnico: Integridade referencial protegida.
- negocio: Nao se perde dados de vendas ao deletar entidades relacionadas.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-DP-002
- titulo: Optimistic locking com campo version em Client e Sale
- severidade: informativo
- categoria: concorrencia
- status: confirmado
- resumo: Os modelos Client e Sale possuem campo `version Int @default(0)` e o repositorio usa `version: { increment: 1 }` em updates. Stock tambem tem version. Isso previne lost updates em cenarios de concorrencia.

#### Evidencia
- arquivo_ou_area: packages/db/prisma/schema.prisma (Client:141, Sale:344, Stock:462), packages/business/clients/adapters/prisma-client-repository.ts:43-44
- detalhe: `where: { id, ...(expectedVersion !== undefined ? { version: expectedVersion } : {}) }, data: { ...updateData, version: { increment: 1 } }`

#### Impacto
- tecnico: Previne lost updates.
- negocio: Dados consistentes em operacoes concorrentes.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-DP-003
- titulo: Indices adequados para queries multi-tenant
- severidade: informativo
- categoria: indices
- status: confirmado
- resumo: Os modelos possuem indices compostos com tenantId como prefixo: @@index([tenantId, classification]), @@index([tenantId, status]), @@index([tenantId, createdAt]). Esto otimiza queries scoped por tenant.

#### Evidencia
- arquivo_ou_area: packages/db/prisma/schema.prisma
- detalhe: Client tem @@index([tenantId, classification]), @@index([tenantId, isLead]). Sale tem @@index([tenantId, status]), @@index([tenantId, clientId]), @@index([tenantId, createdAt]).

#### Impacto
- tecnico: Queries eficientes por tenant.
- negocio: Performance aceitavel mesmo com muitos tenants.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-DP-004
- titulo: Tenant middleware injeta tenantId automaticamente em queries
- severidade: informativo
- categoria: multi-tenant
- status: confirmado
- resumo: O middleware Prisma em tenant-middleware.ts injeta tenantId automaticamente em WHERE, CREATE e UPDATE/DELETE para 20 modelos listados em TENANT_SCOPED_MODELS. Queries sem tenantId sao bloqueadas com log de seguranca.

#### Evidencia
- arquivo_ou_area: packages/db/src/middleware/tenant-middleware.ts
- detalhe: Set de 20 modelos. Injeta tenantId em findMany/findFirst/create/update/delete. Loga security event se tenantId undefined.

#### Impacto
- tecnico: Previne cross-tenant data leaks na camada de persistencia.
- negocio: Isolamento de dados entre tenants garantido.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-DP-005
- titulo: OutboxEvent model suporta backoff e DLQ
- severidade: informativo
- categoria: outbox
- status: confirmado
- resumo: O modelo OutboxEvent possui campos status (PENDING/PROCESSING/PROCESSED/FAILED/DLQ), attempts, nextRetryAt e indices para status+createdAt e status+nextRetryAt. O repositorio implementa exponential backoff e move para DLQ apos 5 tentativas.

#### Evidencia
- arquivo_ou_area: packages/db/prisma/schema.prisma:984-998, packages/db/src/outbox/prisma-outbox-repository.ts:69-92
- detalhe: Backoff: `Math.pow(attempts, 2) * 10_000` (10s, 40s, 90s, 160s). MAX_ATTEMPTS = 5.

#### Impacto
- tecnico: Resiliencia no processamento de eventos.
- negocio: Eventos nao se perdem em falhas transitorias.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma

---

### ACH-DP-006
- titulo: Modelo CommunityTemplate sem relacao com Tenant
- severidade: baixo
- categoria: schema
- status: confirmado
- resumo: O modelo CommunityTemplate possui tenantId mas nao tem relacao explicita com Tenant (sem @relation). Nao esta no TENANT_SCOPED_MODELS do middleware, portanto nao recebe injecao automatica de tenantId.

#### Evidencia
- arquivo_ou_area: packages/db/prisma/schema.prisma:679-690, packages/db/src/middleware/tenant-middleware.ts:5-10
- detalhe: CommunityTemplate tem `tenantId String @db.Uuid` mas nenhum `tenant Tenant @relation(...)` e nao esta no Set TENANT_SCOPED_MODELS.

#### Impacto
- tecnico: Queries no CommunityTemplate podem retornar dados de outros tenants.
- negocio: Possivel vazamento de dados entre tenants neste modelo especifico.

#### Recomendacao
- acao_sugerida: Adicionar relacao com Tenant e incluir no TENANT_SCOPED_MODELS ou validar se CommunityTemplate e intencionalmente global.
- prioridade: media

---

### ACH-DP-007
- titulo: Notification model sem relacao com Tenant
- severidade: baixo
- categoria: schema
- status: confirmado
- resumo: Similar ao CommunityTemplate, o modelo Notification possui tenantId mas nao tem relacao explicita com Tenant e nao esta no TENANT_SCOPED_MODELS.

#### Evidencia
- arquivo_ou_area: packages/db/prisma/schema.prisma:1012-1024, packages/db/src/middleware/tenant-middleware.ts:5-10
- detalhe: Notification tem `tenantId String @db.Uuid` sem @relation. Nao esta no Set.

#### Impacto
- tecnico: Notificacoes podem vazar entre tenants se queries nao filtrarem manualmente.
- negocio: Possivel exibicao de notificacoes de outro tenant.

#### Recomendacao
- acao_sugerida: Adicionar Notification ao TENANT_SCOPED_MODELS e criar relacao com Tenant.
- prioridade: media

---

### ACH-DP-008
- titulo: paginatedQuery helper reutilizado consistentemente
- severidade: informativo
- categoria: helpers
- status: confirmado
- resumo: O helper paginatedQuery de @wbc/shared e usado em repositories para listagens paginadas, garantindo formato consistente de resposta com data, total, page, limit.

#### Evidencia
- arquivo_ou_area: packages/business/clients/adapters/prisma-client-repository.ts:31, :62
- detalhe: `paginatedQuery<Client>(prisma.client as never, where, { page, limit })`

#### Impacto
- tecnico: Paginacao consistente em toda a API.
- negocio: UX previsivel em listagens.

#### Recomendacao
- acao_sugerida: Nenhuma.
- prioridade: nenhuma
