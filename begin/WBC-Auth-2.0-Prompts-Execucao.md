# WBC Auth 2.0 — Prompts de Execução por Épico

**Projeto:** Wave Beauty Consultant (WBC)
**Empresa:** Weave Code UK
**Data:** 04/04/2026
**Referência:** WBC-Auth-2.0-Implementacao.md

---

## Instruções de Uso

Execute cada épico em ordem, um por vez. Após cada épico:
1. Valide que o type-check passa (`npx tsc --noEmit`)
2. Valide que o Prisma está correto (`npx prisma validate`)
3. Só então prossiga para o próximo épico

**REGRAS GLOBAIS PARA TODOS OS ÉPICOS:**
- NÃO execute épicos em paralelo — são sequenciais e dependentes
- NÃO mude a arquitetura hexagonal existente (domain/ports/use-cases/adapters)
- NÃO altere models de negócio (Client, Sale, Campaign, etc.) — apenas auth
- NÃO crie arquivos fora da estrutura do monorepo existente
- Use Opus como modelo. Parallelization proibida.
- Persista estado em arquivos, não em memória
- Commite ao final de cada épico com mensagem descritiva

---

## ÉPICO 1 — Schema Prisma + Migration

### Contexto

O WBC usa Prisma como ORM com PostgreSQL. O schema atual tem o model Tenant acumulando dados de identidade pessoal (name, phone, email, avatar, role) e dados de negócio. O redesign de auth separa identidade (Account) de workspace (Tenant) com uma tabela de vínculo (TenantMember).

O schema Prisma fica em `packages/db/prisma/schema.prisma`.

### Tarefa

Altere o schema Prisma existente para implementar o novo modelo de auth com três camadas: Account, Tenant, TenantMember.

### O que criar

**1. Model Account** (tabela `accounts`):
```prisma
model Account {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email         String    @unique
  emailVerified DateTime?
  passwordHash  String?
  name          String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  oauthAccounts  OAuthAccount[]
  tenantMembers  TenantMember[]
  sessions       Session[]

  @@map("accounts")
}
```

**2. Model OAuthAccount** (tabela `oauth_accounts`):
```prisma
model OAuthAccount {
  id                String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  accountId         String   @db.Uuid
  provider          String
  providerAccountId String
  accessToken       String?
  refreshToken      String?
  expiresAt         Int?
  tokenType         String?
  scope             String?
  idToken           String?
  createdAt         DateTime @default(now())

  account Account @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([accountId])
  @@map("oauth_accounts")
}
```

**3. Model TenantMember** (tabela `tenant_members`):
```prisma
model TenantMember {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  accountId   String    @db.Uuid
  tenantId    String    @db.Uuid
  role        Role      @default(CONSULTANT)
  phone       String?
  displayName String?
  avatar      String?
  isActive    Boolean   @default(true)
  deletedAt   DateTime?
  joinedAt    DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  account Account @relation(fields: [accountId], references: [id], onDelete: Cascade)
  tenant  Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([accountId, tenantId])
  @@index([tenantId])
  @@index([accountId])
  @@map("tenant_members")
}
```

**4. Model Session** (tabela `sessions`):
```prisma
model Session {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  accountId   String   @db.Uuid
  tenantId    String?  @db.Uuid
  tokenHash   String   @unique
  expiresAt   DateTime
  userAgent   String?
  ipAddress   String?
  lastUsedAt  DateTime @default(now())
  createdAt   DateTime @default(now())

  account Account @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@index([accountId])
  @@index([expiresAt])
  @@map("sessions")
}
```

**5. Model Invite** (tabela `invites`):
```prisma
model Invite {
  id          String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId    String       @db.Uuid
  email       String
  role        Role         @default(CONSULTANT)
  invitedBy   String       @db.Uuid
  token       String       @unique
  status      InviteStatus @default(PENDING)
  expiresAt   DateTime
  acceptedAt  DateTime?
  createdAt   DateTime     @default(now())

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([email])
  @@index([tenantId])
  @@map("invites")
}

enum InviteStatus {
  PENDING
  ACCEPTED
  EXPIRED
  CANCELLED
}
```

### O que alterar no model Tenant existente

Remover os seguintes campos do Tenant:
- `phone` (migra para TenantMember)
- `email` (migra para Account)
- `avatar` (migra para TenantMember)
- `role` (migra para TenantMember)
- `plan` (vive só na Subscription — remover do Tenant)

O campo `name` do Tenant permanece, mas agora representa o nome do negócio (ex: "Renata Cosméticos"), não o nome da pessoa.

Adicionar relations ao Tenant:
- `members TenantMember[]`
- `invites Invite[]`

### O que alterar no model OtpCode

- Trocar campo `phone` por `accountId String @db.Uuid`
- Adicionar campo `purpose OtpPurpose @default(TWO_FACTOR)`
- Atualizar index de `[phone, code]` para `[accountId, code]`
- Adicionar enum OtpPurpose { TWO_FACTOR, EMAIL_VERIFICATION }

### O que NÃO alterar

- Nenhum model de negócio (Client, Sale, Campaign, Stock, etc.)
- O enum Role já existe — apenas confirme que contém: CONSULTANT, LEADER, DIRECTOR, ADMIN
- O model Subscription permanece como está
- Todas as business relations do Tenant permanecem (clients, sales, campaigns, etc.)

### Seed

Atualize `packages/db/prisma/seed.ts` para popular os novos models com dados de desenvolvimento:
- 1 Account admin (email: admin@weavecode.co.uk, name: "Robson Admin", sem passwordHash — usa OAuth)
- 1 Account consultora (email: renata@teste.com, name: "Renata Silva", passwordHash de "Teste@123" com bcrypt cost 12)
- 1 Tenant "Renata Cosméticos" (slug: "renata-cosmeticos")
- 1 TenantMember vinculando a consultora ao tenant com role ADMIN
- 1 Subscription trial ESSENTIAL para o tenant
- 1 Invite pendente de exemplo

Instale bcryptjs como dependência do package db se necessário: `npm install bcryptjs @types/bcryptjs`

### Validação

Ao final:
1. `npx prisma validate` deve passar sem erros
2. `npx prisma generate` deve gerar o client sem erros
3. `npx prisma migrate dev --name auth-v2-schema` deve criar a migration
4. `npx prisma db seed` deve popular o banco
5. `npx tsc --noEmit` no monorepo deve passar (ajuste imports quebrados se necessário)

### Commit

```
git add -A && git commit -m "epic-1: auth v2 schema - Account, OAuthAccount, TenantMember, Session, Invite + Tenant refactor"
```

---

## ÉPICO 2 — Auth Core (Auth.js + JWT + Session)

### Contexto

O Épico 1 criou os models de banco. Agora precisamos configurar o Auth.js v5 com os novos providers (Google OAuth + Credentials), implementar o sistema de JWT com claims customizados (sub, tid, mid, role, plan), e a estratégia de sliding session com refresh token de 30 dias.

### Pré-requisitos

- Épico 1 completo e validado
- Variáveis de ambiente disponíveis: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET, NEXTAUTH_URL

### Tarefa

Configure o Auth.js v5 com o novo modelo de dados e implemente o sistema completo de JWT e sessão.

### Estrutura de Arquivos

Siga a arquitetura hexagonal existente. Os arquivos devem ser criados em:

```
packages/business/auth/
├── domain/
│   ├── entities/
│   │   ├── account.entity.ts
│   │   ├── tenant-member.entity.ts
│   │   └── session.entity.ts
│   └── value-objects/
│       ├── email.vo.ts
│       ├── password.vo.ts
│       └── jwt-payload.vo.ts
├── ports/
│   ├── account.repository.ts
│   ├── tenant-member.repository.ts
│   ├── session.repository.ts
│   ├── oauth-account.repository.ts
│   └── password-hasher.port.ts
├── use-cases/
│   ├── authenticate-with-credentials.use-case.ts
│   ├── authenticate-with-oauth.use-case.ts
│   ├── create-session.use-case.ts
│   ├── refresh-session.use-case.ts
│   ├── revoke-session.use-case.ts
│   ├── revoke-all-sessions.use-case.ts
│   ├── list-workspaces.use-case.ts
│   └── switch-workspace.use-case.ts
└── adapters/
    ├── prisma-account.repository.ts
    ├── prisma-tenant-member.repository.ts
    ├── prisma-session.repository.ts
    ├── prisma-oauth-account.repository.ts
    └── bcrypt-password-hasher.adapter.ts

apps/web/src/lib/
├── auth.config.ts          # Auth.js configuration
├── auth.ts                 # Auth.js instance export
└── jwt.ts                  # JWT utility functions
```

### Auth.js Configuration (`apps/web/src/lib/auth.config.ts`)

Configure dois providers:

**GoogleProvider:**
- clientId e clientSecret das variáveis de ambiente
- Ao autenticar, verifica se existe Account com o email retornado pelo Google
- Se não existe: cria Account + OAuthAccount
- Se existe: vincula OAuthAccount se ainda não vinculado

**CredentialsProvider:**
- Campos: email, password
- authorize: busca Account por email → verifica passwordHash com bcrypt (cost factor 12)
- Se passwordHash é null (conta criada via OAuth sem senha): retorna erro "Use Login com Google"
- Retorna account ou null

**Callbacks:**

signIn callback:
- Se provider é "google": chama use-case de authenticate-with-oauth
- Retorna true

jwt callback:
- No login inicial (user presente): seta token.sub = accountId
- Busca TenantMembers ativos da Account
- Se 1 membership: auto-preenche tid, mid, role, plan no token
- Se 0 memberships: marca token.needsOnboarding = true
- Se 2+ memberships sem tid selecionado: marca token.needsWorkspaceSelection = true
- Se trigger === "update" e session.tenantId presente: atualiza tid, mid, role, plan (para troca de workspace)

session callback:
- Expõe no session object: accountId, tenantId, memberId, role, plan, needsOnboarding, needsWorkspaceSelection

**JWT Claims (interface):**
```typescript
interface JWTPayload {
  sub: string;    // accountId
  tid?: string;   // tenantId
  mid?: string;   // tenantMemberId
  role?: Role;    // CONSULTANT | LEADER | DIRECTOR | ADMIN
  plan?: Plan;    // ESSENTIAL | PRO
  needsOnboarding?: boolean;
  needsWorkspaceSelection?: boolean;
}
```

### Session Strategy

- Access token (JWT): 15 minutos de expiração
- Refresh token: 30 dias, renovado a cada uso (sliding)
- Refresh token armazenado como httpOnly cookie (Secure, SameSite=Lax)
- No banco: tabela Session guarda hash SHA-256 do refresh token
- A cada refresh: atualiza Session.lastUsedAt e Session.expiresAt (+30 dias)

### Use-Cases

**authenticate-with-credentials:**
- Input: email, password
- Busca Account por email
- Se não existe → erro "Conta não encontrada"
- Se passwordHash é null → erro "Esta conta usa Login com Google"
- Verifica password com bcrypt → se inválido, erro "Senha incorreta"
- Retorna Account

**authenticate-with-oauth:**
- Input: email, name, provider, providerAccountId, tokens
- Busca Account por email
- Se não existe: cria Account + OAuthAccount
- Se existe: verifica se OAuthAccount existe para esse provider
  - Se não: cria OAuthAccount vinculado
  - Se sim: atualiza tokens
- Retorna Account

**list-workspaces:**
- Input: accountId
- Busca TenantMembers ativos (isActive=true, deletedAt=null) com join em Tenant e Subscription
- Retorna: array de { tenantId, tenantName, slug, role, plan, status }

**switch-workspace:**
- Input: accountId, targetTenantId
- Verifica que Account tem TenantMember ativo no targetTenantId
- Se não tem → erro "Acesso negado a este workspace"
- Busca plan da Subscription do tenant
- Retorna: { tenantId, memberId, role, plan }

### Adapters

Todos os repositories usam o Prisma Client existente em `packages/db`. Siga o padrão dos adapters já existentes no projeto.

**bcrypt-password-hasher.adapter.ts:**
- hash(password): bcrypt com cost factor 12
- verify(password, hash): bcrypt compare

### Validação

Ao final:
1. `npx tsc --noEmit` passa sem erros
2. Auth.js responde em `/api/auth/signin` com formulário de Google + Credentials
3. Todos os use-cases têm implementação funcional
4. Todos os ports têm interface definida
5. Todos os adapters implementam seus respectivos ports

### Commit

```
git add -A && git commit -m "epic-2: auth core - Auth.js config, JWT, session strategy, use-cases, adapters"
```

---

## ÉPICO 3 — Auth Router tRPC

### Contexto

Os Épicos 1 e 2 implementaram o schema e o core de auth. Agora precisamos expor tudo via tRPC para que o frontend consuma. O router de auth existente (OTP-based) será substituído completamente.

### Pré-requisitos

- Épicos 1 e 2 completos e validados

### Tarefa

Reescreva o `auth.router` no tRPC com todas as procedures necessárias para o novo sistema de auth.

### Estrutura de Arquivos

```
packages/business/auth/
├── use-cases/
│   ├── (já existentes do Épico 2)
│   ├── complete-onboarding.use-case.ts
│   ├── accept-invite.use-case.ts
│   ├── create-invite.use-case.ts
│   ├── cancel-invite.use-case.ts
│   ├── update-account.use-case.ts
│   ├── update-member.use-case.ts
│   ├── delete-account.use-case.ts
│   ├── leave-tenant.use-case.ts
│   ├── change-password.use-case.ts
│   ├── request-password-reset.use-case.ts
│   ├── reset-password.use-case.ts
│   ├── request-email-verification.use-case.ts
│   ├── verify-email.use-case.ts
│   ├── list-members.use-case.ts
│   ├── update-member-role.use-case.ts
│   └── remove-member.use-case.ts
├── ports/
│   ├── (já existentes do Épico 2)
│   ├── invite.repository.ts
│   └── email-sender.port.ts
└── adapters/
    ├── (já existentes do Épico 2)
    ├── prisma-invite.repository.ts
    └── resend-email-sender.adapter.ts

apps/api/src/routers/
└── auth.router.ts          # substituição completa
```

### Procedures do auth.router

**Procedures públicas (sem auth):**
```
auth.requestPasswordReset  → { email } → { success }
auth.resetPassword         → { token, newPassword } → { success }
auth.verifyEmail           → { token } → { success }
auth.acceptInvite          → { inviteToken, displayName, phone } → { member, jwt }
```

**Procedures autenticadas (requer Account, sem tenant):**
```
auth.completeOnboarding    → { tenantName, slug, phone, brandId?, avatar? } → { tenant, member }
auth.listWorkspaces        → {} → { workspaces[] }
auth.switchWorkspace       → { tenantId } → { jwt }
auth.getProfile            → {} → { account, currentMember?, tenant? }
auth.updateAccount         → { name? } → { account }
auth.deleteAccount         → { confirmation: "DELETE" } → { success }
auth.changePassword        → { currentPassword, newPassword } → { success }
auth.requestEmailVerification → {} → { success }
auth.listSessions          → {} → { sessions[] }
auth.revokeSession         → { sessionId } → { success }
auth.revokeAllSessions     → {} → { success }
```

**Procedures autenticadas + com tenant (requer tid no JWT):**
```
auth.updateMember          → { phone?, displayName?, avatar? } → { member }
auth.leaveTenant           → { confirmation: "LEAVE" } → { success }
```

**Procedures com permissão (requer role LEADER+ ou ADMIN):**
```
auth.createInvite          → { email, role } → { invite }            // LEADER+
auth.listInvites           → { status? } → { invites[] }             // LEADER+
auth.cancelInvite          → { inviteId } → { success }              // LEADER+
auth.resendInvite          → { inviteId } → { success }              // LEADER+
auth.listMembers           → {} → { members[] }                      // LEADER+
auth.updateMemberRole      → { memberId, newRole } → { member }     // Regra de hierarquia
auth.removeMember          → { memberId } → { success }             // ADMIN only
```

### Implementação dos Use-Cases Principais

**complete-onboarding:**
- Input: accountId, tenantName, slug, phone, brandId?, avatar?
- Validações: slug único, accountId não tem tenant ainda
- Tudo numa transação Prisma:
  1. Cria Tenant (name, slug, timezone defaults)
  2. Cria Subscription (plan: ESSENTIAL, status: TRIAL, expiresAt: now + 14 dias)
  3. Cria TenantMember (accountId, tenantId, role: ADMIN, phone, displayName: Account.name, avatar)
  4. Se cookie de referral existe: cria Referral
- Emite domain event: `tenant.created`
- Retorna: tenant + member

**accept-invite:**
- Input: inviteToken, displayName, phone
- Valida token HMAC, não expirado, status PENDING
- Verifica: email do invite == email do Account logado
- Verifica: Account não tem TenantMember ativo nesse tenant
- Cria TenantMember (accountId, tenantId, role do invite, phone, displayName)
- Atualiza Invite (status: ACCEPTED, acceptedAt: now)
- Emite domain event: `tenant.member_joined`
- Retorna: member

**delete-account:**
- Input: accountId, confirmation === "DELETE"
- Verifica: Account não é único ADMIN de nenhum tenant
- Numa transação Prisma:
  1. Account.email = `deleted_{accountId}@removed.wbc`
  2. Account.name = "Conta Removida"
  3. Account.passwordHash = null
  4. DELETE todas OAuthAccounts (hard delete)
  5. DELETE todas Sessions (hard delete)
  6. Todos TenantMembers: deletedAt = now, isActive = false
- Emite domain event: `account.deleted`

**update-member-role:**
- Input: accountId (quem está fazendo), memberId (quem vai ser alterado), newRole
- Busca role do caller no tenant atual
- Regra de hierarquia: ninguém promove para role >= próprio
  - LEADER pode: promover/rebaixar até LEADER
  - DIRECTOR pode: promover/rebaixar até DIRECTOR
  - ADMIN pode: qualquer alteração
- Se violação → erro "Permissão insuficiente"
- Atualiza TenantMember.role
- Emite domain event: `tenant.member_role_changed`

**leave-tenant:**
- Input: accountId, tenantId
- Verifica: Account não é único ADMIN do tenant (senão bloqueia)
- TenantMember.deletedAt = now, TenantMember.isActive = false
- Invalida Sessions com este tenantId
- Emite domain event: `tenant.member_left`

### Zod Schemas

Crie os schemas Zod em `packages/validators/schemas/auth.schema.ts`:
- completeOnboardingSchema
- acceptInviteSchema
- switchWorkspaceSchema
- updateAccountSchema
- updateMemberSchema
- changePasswordSchema
- resetPasswordSchema
- createInviteSchema
- updateMemberRoleSchema

### Validação

Ao final:
1. `npx tsc --noEmit` passa sem erros
2. Todas as procedures do auth.router estão implementadas
3. Todos os use-cases têm implementação funcional
4. Schemas Zod validam corretamente
5. O antigo auth.router de OTP foi removido ou substituído completamente

### Commit

```
git add -A && git commit -m "epic-3: auth tRPC router - 20+ procedures, use-cases, Zod schemas"
```

---

## ÉPICO 4 — Middleware + Guards + RLS

### Contexto

Os Épicos 1–3 implementaram o banco, o core de auth, e o router tRPC. Agora precisamos implementar as 4 camadas de isolamento de tenant e o sistema de permission guards.

### Pré-requisitos

- Épicos 1, 2 e 3 completos e validados

### Tarefa

Implemente o middleware de auth, o middleware de tenant injection no Prisma, as RLS policies no PostgreSQL, e o sistema de permission guards.

### Estrutura de Arquivos

```
apps/api/src/middleware/
├── auth.middleware.ts           # extrai JWT, injeta ctx
└── tenant.middleware.ts         # seta tenant no Prisma context

packages/business/auth/
├── guards/
│   └── permission.guard.ts     # RBAC hardcoded
└── domain/
    └── permissions.ts          # mapa de permissões por role

packages/db/
├── src/
│   └── middleware/
│       └── tenant-injection.middleware.ts  # Prisma $use middleware
└── prisma/
    └── migrations/
        └── xxx_rls_policies/
            └── migration.sql   # RLS policies
```

### Camada 1 — Auth Middleware (tRPC)

```typescript
// apps/api/src/middleware/auth.middleware.ts

// Middleware que extrai o JWT e injeta no contexto tRPC
// Todos os campos do JWT ficam disponíveis em ctx:
//   ctx.accountId  (sempre presente se autenticado)
//   ctx.tenantId   (presente se workspace selecionado)
//   ctx.memberId   (presente se workspace selecionado)
//   ctx.role       (presente se workspace selecionado)
//   ctx.plan       (presente se workspace selecionado)

// Criar 3 níveis de procedure:
// 1. publicProcedure    — sem auth
// 2. authedProcedure    — requer accountId (pode não ter tenant)
// 3. tenantProcedure    — requer accountId + tenantId
```

Implemente os 3 níveis de procedure. O `tenantProcedure` é o que a maioria dos routers de negócio vai usar. O `authedProcedure` é para procedures como `listWorkspaces` e `completeOnboarding` que não precisam de tenant.

### Camada 2 — Prisma Tenant Injection Middleware

```typescript
// packages/db/src/middleware/tenant-injection.middleware.ts

// Prisma $use middleware que injeta tenant_id em TODAS as queries
// de models que têm coluna tenant_id.
//
// Para READS (findMany, findFirst, findUnique, count, aggregate):
//   → Adiciona WHERE tenant_id = ctx.tenantId
//
// Para WRITES (create, createMany):
//   → Adiciona tenant_id = ctx.tenantId no data
//
// Para UPDATES e DELETES (update, updateMany, delete, deleteMany):
//   → Adiciona WHERE tenant_id = ctx.tenantId
//
// Models EXCLUÍDOS do middleware (não têm tenant_id):
//   Account, OAuthAccount, Session, Brand (isSystem), CommunityTemplate
//
// O tenantId é propagado via AsyncLocalStorage (cls-hooked ou Node.js native)
// Setado pelo tenant.middleware.ts do tRPC antes de cada request.
```

### Camada 3 — RLS no PostgreSQL

Crie uma migration SQL manual que aplica RLS em TODAS as tabelas com coluna `tenant_id`:

```sql
-- Tabelas que recebem RLS (todas com tenant_id):
-- clients, tags, client_tags, client_wishlists, gift_suggestors,
-- products, showcases, showcase_products, sales, sale_items, payments,
-- cashbacks, returns, stocks, brand_orders, brand_order_items, samples,
-- campaigns, campaign_recipients, scheduled_messages, post_sale_flows,
-- message_templates, quick_replies, expenses, financial_reports,
-- appointments, reminders, opportunities, teams, team_members, team_tasks,
-- ai_generations, deliveries, landing_pages, referrals, onboarding_progress,
-- tenant_members, invites

-- Para CADA tabela:
ALTER TABLE {tabela} ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_{tabela} ON {tabela}
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- IMPORTANTE: usar current_setting com true como segundo parâmetro
-- para retornar NULL em vez de erro se a variável não estiver setada.
-- Isso evita que queries administrativas (migrations, seeds) quebrem.

-- Tabelas SEM RLS (não têm tenant_id):
-- accounts, oauth_accounts, sessions, brands, otp_codes, subscriptions
```

O tenant middleware do Prisma deve executar `SET LOCAL app.current_tenant_id = $1` antes de cada transação.

### Camada 4 — Reset de Estado (Frontend)

Crie um utilitário para o frontend:

```typescript
// apps/web/src/lib/workspace-switch.ts

// Função chamada quando a consultora troca de workspace:
// 1. Chama auth.switchWorkspace via tRPC
// 2. Recebe novo JWT com novo tid/mid/role/plan
// 3. Limpa TODO o cache do React Query: queryClient.clear()
// 4. Limpa todas as stores Zustand: chamar reset() de cada store
// 5. Atualiza a session do Auth.js via update()
// 6. Redireciona para /dashboard
```

### Permission Guards

```typescript
// packages/business/auth/guards/permission.guard.ts

type Permission =
  | 'team:view'
  | 'team:invite'
  | 'team:multi-view'
  | 'team:promote'
  | 'team:promote:director'
  | 'tenant:manage'
  | 'tenant:billing'
  | 'tenant:export';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  CONSULTANT: [],
  LEADER:     ['team:view', 'team:invite', 'team:promote'],
  DIRECTOR:   ['team:view', 'team:invite', 'team:promote', 'team:promote:director', 'team:multi-view'],
  ADMIN:      ['team:view', 'team:invite', 'team:promote', 'team:promote:director', 'team:multi-view',
               'tenant:manage', 'tenant:billing', 'tenant:export'],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function requirePermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Permissão insuficiente' });
  }
}

// Hierarquia de promoção:
export function canPromoteTo(callerRole: Role, targetRole: Role): boolean {
  const hierarchy: Record<Role, number> = {
    CONSULTANT: 0,
    LEADER: 1,
    DIRECTOR: 2,
    ADMIN: 3,
  };
  // Ninguém promove para role >= próprio
  return hierarchy[targetRole] < hierarchy[callerRole];
}
```

### Integrar Guards nos Routers

Atualize o auth.router (Épico 3) para usar os guards:
- `auth.createInvite` → `requirePermission(ctx.role, 'team:invite')`
- `auth.updateMemberRole` → `requirePermission(ctx.role, 'team:promote')` + `canPromoteTo(ctx.role, newRole)`
- `auth.removeMember` → `requirePermission(ctx.role, 'tenant:manage')`
- `auth.listMembers` → `requirePermission(ctx.role, 'team:view')`

### Validação

Ao final:
1. `npx tsc --noEmit` passa sem erros
2. Auth middleware injeta ctx corretamente em todas as procedures
3. Prisma middleware injeta tenant_id em queries
4. RLS policies aplicadas no banco (verificar com `\d+ clients` no psql — deve mostrar policies)
5. Permission guards bloqueiam corretamente (testar: CONSULTANT tentando criar invite → FORBIDDEN)
6. `workspace-switch.ts` exporta função funcional

### Commit

```
git add -A && git commit -m "epic-4: middleware + guards + RLS - 4 camadas de isolamento de tenant"
```

---

## ÉPICO 5 — Frontend Auth (Telas)

### Contexto

Os Épicos 1–4 implementaram todo o backend de auth. Agora precisamos das telas para o usuário interagir: login, registro, onboarding de tenant, onboarding de user (invite), seletor de workspace, e middleware Next.js.

### Pré-requisitos

- Épicos 1, 2, 3 e 4 completos e validados

### Tarefa

Implemente as telas de auth e o middleware Next.js no `apps/web`.

### Stack Frontend

- Next.js App Router (já configurado)
- React + TypeScript
- Tailwind CSS + shadcn/ui (já configurados)
- tRPC client (já configurado)
- React Query / TanStack Query (já configurado)

### Estrutura de Arquivos

```
apps/web/src/
├── app/
│   ├── (auth)/                    # grupo de layout sem sidebar
│   │   ├── login/
│   │   │   └── page.tsx           # tela de login
│   │   ├── register/
│   │   │   └── page.tsx           # tela de registro
│   │   ├── onboarding/
│   │   │   └── page.tsx           # wizard de onboarding (tenant)
│   │   ├── invite/
│   │   │   └── page.tsx           # aceitar invite (onboarding de user)
│   │   ├── select-workspace/
│   │   │   └── page.tsx           # seletor de workspace
│   │   ├── reset-password/
│   │   │   └── page.tsx           # reset de senha
│   │   ├── verify-email/
│   │   │   └── page.tsx           # verificação de email
│   │   ├── suspended/
│   │   │   └── page.tsx           # tenant bloqueado
│   │   └── layout.tsx             # layout limpo, sem sidebar
│   └── (dashboard)/               # grupo com sidebar (já existe)
│       └── ...
├── components/
│   └── auth/
│       ├── google-login-button.tsx
│       ├── credentials-form.tsx
│       ├── onboarding-wizard.tsx
│       ├── workspace-selector.tsx
│       └── email-verification-banner.tsx
└── middleware.ts                   # atualizar
```

### Tela de Login (`/login`)

Componentes:
- Logo WBC no topo
- Botão "Login com Google" (primário, destaque visual)
- Separador "ou"
- Formulário email + senha
- Link "Esqueci minha senha" → `/reset-password`
- Link "Criar conta" → `/register`

Fluxo:
- Google: chama `signIn("google")` do Auth.js
- Credentials: chama `signIn("credentials", { email, password })`
- Após auth: Auth.js redireciona conforme JWT (dashboard, onboarding, ou select-workspace)

### Tela de Registro (`/register`)

Componentes:
- Logo WBC
- Botão "Criar conta com Google"
- Separador "ou"
- Formulário: nome, email, senha, confirmar senha
- Validações: email formato válido, senha mínimo 8 chars com 1 letra e 1 número, senhas coincidem
- Link "Já tem conta? Faça login" → `/login`

Fluxo:
- Google: chama `signIn("google")`
- Credentials: POST para criar Account → auto login → redirect para onboarding

### Tela de Onboarding de Tenant (`/onboarding`)

Wizard de 3 passos (use componente stepper do shadcn/ui ou custom):

**Step 1 — Seu Negócio:**
- Campo: Nome do negócio (ex: "Renata Cosméticos")
- Campo: Slug (auto-gerado a partir do nome, editável) com preview: `renata-cosmeticos.wbc.com.br`
- Validação: slug único (verificar via tRPC em tempo real com debounce)

**Step 2 — Contato:**
- Campo: WhatsApp (com máscara de telefone BR: (XX) XXXXX-XXXX)
- Campo: Marca principal (select com opções: Mary Kay, Natura, Avon, Jequiti, Boticário, Outra)
- Validação: telefone formato válido

**Step 3 — Finalizar:**
- Campo: Foto de perfil (upload opcional com preview, armazenar no R2)
- Checkbox: "Li e aceito os Termos de Uso e Política de Privacidade"
- Botão: "Começar a usar o WBC"

Ao clicar "Começar": chama `auth.completeOnboarding` via tRPC → redirect para `/dashboard`

### Tela de Aceitar Invite (`/invite?token=xxx`)

Uma tela só (mini-onboarding de user):

- Cabeçalho: "Você foi convidado(a) para o time de {tenantName}!"
- Se não tem Account: mostra opção de criar (Google ou email/senha) → volta pra essa tela após auth
- Se já tem Account e está logado:
  - Campo: Confirmar nome (pré-preenchido do Account.name)
  - Campo: WhatsApp (máscara BR)
  - Botão: "Entrar no time"
- Ao clicar: chama `auth.acceptInvite` → redirect para `/dashboard`

### Tela Seletor de Workspace (`/select-workspace`)

- Cabeçalho: "Escolha um workspace"
- Lista de cards com os workspaces da Account:
  - Nome do tenant
  - Role (badge colorido)
  - Plano (ESSENTIAL / PRO)
- Ao clicar num card: chama `auth.switchWorkspace` → redirect para `/dashboard`
- Rodapé: "Ou crie um novo workspace" → link para `/onboarding`

### Tela de Tenant Bloqueado (`/suspended`)

- Ícone de alerta
- Mensagem: "Esta conta está suspensa. Entre em contato com o suporte: suporte@wbc.com.br"
- Se ADMIN: botão adicional "Exportar meus dados" → chama endpoint de export
- Botão: "Voltar para meus workspaces" → `/select-workspace`

### Tela de Reset de Senha (`/reset-password`)

Dois estados:
- **Sem token (solicitar):** campo email + botão "Enviar link de recuperação"
- **Com token (resetar):** campos nova senha + confirmar senha + botão "Salvar nova senha"

### Tela de Verificação de Email (`/verify-email?token=xxx`)

- Ao carregar: chama `auth.verifyEmail` com o token
- Sucesso: "Email verificado!" + redirect para dashboard em 3 segundos
- Erro: "Link inválido ou expirado" + botão "Reenviar email de verificação"

### Componente: Email Verification Banner

Banner fixo no topo do dashboard (acima da sidebar):
- Mensagem: "Confirme seu email para usar todas as funcionalidades"
- Botão: "Reenviar email"
- Aparece quando session.emailVerified é null
- Dismissável por 24 horas (localStorage)

### Middleware Next.js (atualizar)

```typescript
// apps/web/src/middleware.ts

const PUBLIC_ROUTES = ['/login', '/register', '/invite', '/reset-password', '/verify-email'];
const ONBOARDING_ROUTE = '/onboarding';
const WORKSPACE_ROUTE = '/select-workspace';
const SUSPENDED_ROUTE = '/suspended';

// Lógica:
// 1. Rota pública → passa
// 2. Sem session → redirect /login
// 3. Session sem tenantId:
//    - needsOnboarding → redirect /onboarding
//    - needsWorkspaceSelection → redirect /select-workspace
// 4. Tenant.isActive === false → redirect /suspended
// 5. Tudo OK → passa
```

### i18n

Todas as telas devem usar o next-intl já configurado no projeto. Crie as chaves de tradução em:
- `packages/i18n/locales/pt-BR/auth.json`
- `packages/i18n/locales/en/auth.json`

Chaves mínimas: login.title, login.google, login.email, login.password, login.forgotPassword, login.createAccount, register.title, register.google, register.name, register.email, register.password, register.confirmPassword, register.hasAccount, onboarding.step1.title, onboarding.step1.businessName, onboarding.step1.slug, onboarding.step2.title, onboarding.step2.whatsapp, onboarding.step2.brand, onboarding.step3.title, onboarding.step3.photo, onboarding.step3.terms, onboarding.step3.submit, workspace.title, workspace.createNew, invite.title, invite.join, suspended.title, suspended.message, suspended.export, suspended.back

### Validação

Ao final:
1. `npx tsc --noEmit` passa sem erros
2. `/login` renderiza com Google + Credentials
3. `/register` renderiza formulário completo
4. `/onboarding` renderiza wizard de 3 passos
5. `/select-workspace` renderiza lista de workspaces
6. `/invite?token=xxx` renderiza mini-onboarding
7. Middleware redireciona corretamente em todos os cenários
8. i18n funciona em PT-BR e EN

### Commit

```
git add -A && git commit -m "epic-5: frontend auth - login, register, onboarding, workspace selector, middleware"
```

---

## Checklist Final — Pós Todos os Épicos

Após completar os 5 épicos, execute a validação final:

1. **Type-check:** `npx tsc --noEmit` — zero erros
2. **Prisma:** `npx prisma validate` — schema válido
3. **Lint:** `npx eslint .` — sem erros críticos
4. **Banco:** RLS policies ativas (`SELECT * FROM pg_policies`)
5. **Fluxo completo manual:**
   - Registro com Google → onboarding → dashboard ✓
   - Registro com email/senha → onboarding → dashboard ✓
   - Login com Google (conta existente, 1 tenant) → dashboard direto ✓
   - Login com Google (conta existente, 2+ tenants) → seletor → dashboard ✓
   - Convite → aceitar → mini-onboarding → dashboard do líder ✓
   - Troca de workspace → dados limpos, novo contexto ✓
   - Password reset → email → nova senha → login ✓
6. **Isolamento:** criar 2 tenants, verificar que dados não vazam entre eles
