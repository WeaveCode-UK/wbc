# WBC — Requisitos de Segurança para Login + Hierarquia + Control Plane

Este documento captura **regras de design** que precisam estar presentes quando
o sistema de login completo, hierarquia de papéis e control plane (admin da
plataforma) forem construídos. As regras vieram de um estudo de caso de
auditoria conduzido em 2026-04-28 sobre vulnerabilidades reais demonstradas em
um vídeo de hacking ético (IDOR + SSTI + RBAC cross-tenant + IRSA wildcard +
AssumeRole sem restrições).

O ponto de fundo: **privilégio excessivo + validação ausente = exploit**. O
ataque do vídeo não usou nenhum zero-day; foi a soma de duas omissões em
endpoints comuns. As regras abaixo eliminam essas duas omissões por construção.

## Regra 1 — `role: ADMIN` ≠ admin da plataforma

O schema atual tem `Role = CONSULTANT | LEADER | DIRECTOR | ADMIN`, todas
intra-tenant. `ADMIN` significa "dono do meu próprio workspace" e é atribuído
automaticamente pelo `onboardTenant` ao primeiro membro de cada tenant.

Quando o control plane real for construído:

- Criar uma flag `Account.isPlatformAdmin: boolean` (ou tabela
  `PlatformAdmin(accountId)` separada de `TenantMember`). **Não** adicionar um
  valor `PLATFORM_ADMIN` ao enum `Role` — isso mistura semânticas.
- Endpoints que afetam **outros tenants** ou recursos **cross-tenant**
  (DLQ global, blacklist de sessões global, métricas agregadas, painel de
  ops) **devem** ser gateados por `platformAdminProcedure`, nunca por
  `roleProtectedProcedure("ADMIN")`.
- A flag `isPlatformAdmin` é provisionada **fora do fluxo de signup** —
  por seed, por CLI administrativa, ou por convite explícito de outro
  platform admin. Nunca derivada de role intra-tenant.

## Regra 2 — `tenantId` no input só para operações de plataforma

Para qualquer endpoint cuja operação **afeta um tenant**, o `tenantId` é
derivado do JWT (`ctx.tenant.tenantId`), não recebido no input do cliente.

Exceções (operações cross-tenant) são permitidas **apenas** se:

1. O endpoint é `platformAdminProcedure` (ver Regra 1).
2. O input do `tenantId` é validado contra o registro do tenant (existe? está
   ativo?).
3. A ação é registrada em audit log com o par `(actor.accountId, target.tenantId)`
   explícito.

Para qualquer outro caso, se o teste "trocar `tenantId` no input por outro UUID
permite alcançar dado de outro tenant" passar, o endpoint está vulnerável a
IDOR cross-tenant.

## Regra 3 — Onboarding atribui escopo, não privilégio de plataforma

O primeiro membro de um tenant pode continuar sendo `ADMIN` do próprio
workspace (quem criou, manda ali). Mas a semântica precisa estar separada por
construção:

- `TenantMember.role = ADMIN` → "manda no meu workspace" (gerencia membros,
  altera assinatura, vê financeiro do tenant).
- `Account.isPlatformAdmin = true` → "manda no sistema" (DLQ, blacklist,
  ops). **Não** vem do signup. **Não** é alcançável por nenhum fluxo de
  usuário final.

Sem essa separação, qualquer signup público (Credentials, OAuth, magic-link,
passkey) entrega platform admin de presente.

## Regra 4 — Recursos cross-tenant são platform-level

Os seguintes recursos são, por natureza, cross-tenant. Não devem ser expostos
por `roleProtectedProcedure("ADMIN")` em hipótese alguma:

- DLQ (Dead Letter Queue) — eventos de múltiplos tenants compartilham filas.
- Blacklist global de JWT — derruba a plataforma inteira.
- Métricas agregadas, dashboards de ops, traces.
- Replay de eventos do outbox — afeta o estado de qualquer tenant cujo evento
  esteja na fila.
- Mutações em config global (feature flags globais, tabelas de planos, etc.).

Todos atrás de `platformAdminProcedure`.

## Regra 5 — Defesa em profundidade que já existe e precisa continuar

O projeto já tem dois mecanismos que mitigam parte do risco. Manter:

- **RLS no PostgreSQL** (`packages/db/prisma/migrations/20260421000005_rls_policies/`)
  cobre 24 tabelas. Mesmo se um endpoint esquecer o `where: { tenantId }`,
  o banco bloqueia. Estender RLS pra qualquer tabela nova com `tenantId`.
- **Repositórios injetam `tenantId` no `where`** a partir do contexto. Manter
  o padrão — não aceitar `tenantId` como parâmetro de método de repository
  exceto em adapters explicitamente platform-level.

## Como verificar antes de fazer merge

Para todo endpoint novo:

1. O input do cliente está sendo usado pra decidir **o que** fazer ou **em
   quem** fazer? Se em quem, o id vem do JWT?
2. A permissão exigida é a mínima possível pra essa ação, ou a role mais
   alta disponível por preguiça?
3. Se o endpoint é cross-tenant, está atrás de `platformAdminProcedure`?
4. Se for tenant-scoped, o `tenantId` vem do `ctx`, não do `input`?

Se qualquer resposta for "não" / "não sei", o endpoint não passa.

## Histórico

- **2026-04-28** — documento criado a partir de estudo de caso pós-auditoria
  do domínio `seguranca` (run `2026-04-26_15-46-36`, mergeada). Achados que
  motivaram o documento: `apps/api/src/routers/admin.ts` original misturava
  `roleProtectedProcedure("ADMIN")` (intra-tenant) com endpoints cross-tenant
  (`dlq.list`, `dlq.replay`, `sessions.revokeAllForTenant`,
  `sessions.revokeAllGlobal`). Esse router foi removido nesta data; deve ser
  reescrito segundo as regras acima quando o control plane for construído.
- **2026-04-28** — Google OAuth desabilitado em `apps/web/src/lib/auth.config.ts`
  até que as Regras 1–4 estejam implementadas. Reabilitar somente depois.
