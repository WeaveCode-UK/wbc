# WBC Platform — Bootstrap Prompt (Setup Completo do Ambiente)

> **Tipo:** Prompt de inicialização — cria o monorepo inteiro do zero
> **Execução:** Claude Code CLI no diretório `/Users/robsonmacpro/WeaveCode/Sistemas/5-Dev/weavecode-wbc/wbc`
> **Objetivo:** Preparar TODO o ambiente de desenvolvimento — estrutura de pastas, dependências, configurações, schema Prisma, design system, i18n, Docker, e infraestrutura base — para que o projeto receba implementação de features imediatamente após a execução.
> **Pré-requisitos:**
> - macOS com Node.js (v20+), pnpm instalado globalmente
> - Repositório Git já inicializado e conectado ao remote no GitHub
> - Docker Desktop rodando
> - SuperMemory configurado (WBC_SUPERMEMORY_SETUP.md executado)
> - WBC_REGRAS_INVIOLAVEIS.md lido e gravado no contexto
>
> **REGRAS DE EXECUÇÃO:**
> 1. Cada TASK é atômica e termina com um `git add . && git commit`
> 2. Tasks são sequenciais e em ordem crescente — nenhuma depende de algo futuro
> 3. Mensagens de commit: Conventional Commits (`type(scope): description`)
> 4. NUNCA pare entre tasks. Terminou uma → inicie a próxima imediatamente.
> 5. NUNCA pergunte "posso continuar?" ou "deseja que eu prossiga?"
> 6. Se algo falhar: tente corrigir (max 3 tentativas). Se não resolver: registre o erro e CONTINUE com a próxima task.

---

## TASK 01 — Inicialização do Monorepo com Turborepo + pnpm

**Objetivo:** Criar estrutura raiz do monorepo.

**Ações:**

1. Criar `package.json` raiz:
```json
{
  "name": "wbc-platform",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@9.15.4",
  "engines": { "node": ">=20.0.0" },
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "test": "turbo test",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "clean": "turbo clean && rm -rf node_modules",
    "db:generate": "turbo db:generate",
    "db:push": "turbo db:push",
    "db:migrate": "turbo db:migrate",
    "db:seed": "turbo db:seed"
  }
}
```

2. Criar `pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

3. Criar `turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "globalEnv": [
    "NODE_ENV",
    "DATABASE_URL",
    "REDIS_URL",
    "AUTH_SECRET",
    "AUTH_URL",
    "WHATSAPP_API_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
    "MERCADOPAGO_ACCESS_TOKEN",
    "DEEPSEEK_API_KEY"
  ],
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**", "dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^build"] },
    "type-check": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] },
    "clean": { "cache": false },
    "db:generate": { "cache": false },
    "db:push": { "cache": false },
    "db:migrate": { "cache": false },
    "db:seed": { "cache": false }
  }
}
```

4. Criar `.gitignore`:
```
node_modules/
.next/
dist/
.turbo/
.env
.env.local
.env.*.local
*.log
.DS_Store
coverage/
.prisma/
```

5. Criar `.nvmrc`:
```
20
```

6. Criar estrutura de pastas:
```bash
mkdir -p apps/{api,worker,web,mobile,landing}
mkdir -p packages/{business,db,shared,ui,i18n,validators,config}
mkdir -p packages/business/{auth,clients,catalog,sales,campaigns,messaging,ai,inventory,finance,schedule,team,analytics,logistics,landing,platform}
```

Para cada módulo em packages/business, criar subpastas:
```bash
for module in auth clients catalog sales campaigns messaging ai inventory finance schedule team analytics logistics landing platform; do
  mkdir -p packages/business/$module/{domain,ports,use-cases,adapters}
done
```

**Commit:**
```bash
git add -A
git commit -m "chore(monorepo): initialize Turborepo with pnpm workspaces and folder structure"
```

**PROSSIGA IMEDIATAMENTE para TASK 02.**

---

## TASK 02 — Configurações Compartilhadas (packages/config)

**Objetivo:** ESLint, Prettier, e TypeScript configs compartilhados.

**Ações:**

1. Criar `packages/config/package.json`:
```json
{
  "name": "@wbc/config",
  "version": "0.1.0",
  "private": true
}
```

2. Criar `packages/config/tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": false,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "incremental": true
  },
  "exclude": ["node_modules", "dist", ".next", "coverage"]
}
```

3. Criar `packages/config/eslint.base.mjs`:
```javascript
import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: true },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  { ignores: ["node_modules/", "dist/", ".next/", "coverage/"] },
];
```

4. Criar `packages/config/prettier.config.mjs`:
```javascript
export default {
  semi: true,
  singleQuote: true,
  trailingComma: "all",
  printWidth: 100,
  tabWidth: 2,
  arrowParens: "always",
};
```

**Commit:**
```bash
git add -A
git commit -m "chore(config): add shared TypeScript, ESLint, and Prettier configs"
```

**PROSSIGA IMEDIATAMENTE para TASK 03.**

---

## TASK 03 — Package de Types Compartilhados (packages/shared)

**Objetivo:** Types TypeScript e definições de domain events compartilhados entre todos os apps e packages.

**Ações:**

1. Criar `packages/shared/package.json`:
```json
{
  "name": "@wbc/shared",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "eslint src/"
  }
}
```

2. Criar `packages/shared/tsconfig.json`:
```json
{
  "extends": "@wbc/config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

3. Criar `packages/shared/src/types/tenant.ts`:
```typescript
export type Plan = 'ESSENTIAL' | 'PRO';
export type Role = 'CONSULTANT' | 'LEADER' | 'DIRECTOR' | 'ADMIN';
export type SubStatus = 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED';

export interface TenantContext {
  tenantId: string;
  userId: string;
  plan: Plan;
  role: Role;
  locale: string;
  timezone: string;
  currency: string;
}
```

4. Criar `packages/shared/src/types/common.ts`:
```typescript
export interface PaginatedRequest {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

5. Criar `packages/shared/src/events/domain-event.ts`:
```typescript
export interface DomainEvent<T = unknown> {
  id: string;
  type: string;
  tenantId: string;
  payload: T;
  timestamp: Date;
  version: number;
}

// Event type constants — organized by module
export const EVENTS = {
  // Auth
  TENANT_CREATED: 'tenant.created',
  TENANT_PLAN_CHANGED: 'tenant.plan_changed',
  TENANT_DEACTIVATED: 'tenant.deactivated',

  // Clients
  CLIENT_CREATED: 'client.created',
  CLIENT_UPDATED: 'client.updated',
  CLIENT_IMPORTED: 'client.imported',
  CLIENT_TAGGED: 'client.tagged',
  CLIENT_CLASSIFICATION_CHANGED: 'client.classification_changed',
  CLIENT_GOING_INACTIVE: 'client.going_inactive',

  // Sales
  SALE_CREATED: 'sale.created',
  SALE_CONFIRMED: 'sale.confirmed',
  SALE_DELIVERED: 'sale.delivered',
  SALE_CANCELLED: 'sale.cancelled',
  SALE_STATUS_CHANGED: 'sale.status_changed',

  // Payments
  PAYMENT_RECEIVED: 'payment.received',
  PAYMENT_OVERDUE: 'payment.overdue',
  PAYMENT_PIX_GENERATED: 'payment.pix_generated',

  // Cashback
  CASHBACK_GENERATED: 'cashback.generated',
  CASHBACK_EXPIRING: 'cashback.expiring',
  CASHBACK_USED: 'cashback.used',

  // Campaigns
  CAMPAIGN_CREATED: 'campaign.created',
  CAMPAIGN_DISPATCHED: 'campaign.dispatched',
  CAMPAIGN_COMPLETED: 'campaign.completed',
  CAMPAIGN_RECIPIENT_REPLIED: 'campaign.recipient_replied',

  // Messaging
  MESSAGE_SENT: 'message.sent',
  MESSAGE_FAILED: 'message.failed',
  POSTSALE_STAGE_COMPLETED: 'postsale.stage_completed',

  // Inventory
  STOCK_LOW: 'stock.low',
  STOCK_DEPLETED: 'stock.depleted',
  BRAND_ORDER_RECEIVED: 'brand_order.received',

  // Schedule
  REMINDER_TRIGGERED: 'reminder.triggered',
  APPOINTMENT_UPCOMING: 'appointment.upcoming',

  // Team
  TEAM_MEMBER_ADDED: 'team.member_added',
  TEAM_TASK_CREATED: 'team.task_created',
  TEAM_TASK_APPROVED: 'team.task_approved',

  // AI
  AI_GENERATION_USED: 'ai.generation_used',
  AI_LIMIT_REACHED: 'ai.limit_reached',

  // Logistics
  DELIVERY_SHIPPED: 'delivery.shipped',
  DELIVERY_DELIVERED: 'delivery.delivered',
} as const;

export type EventType = (typeof EVENTS)[keyof typeof EVENTS];
```

6. Criar `packages/shared/src/index.ts`:
```typescript
export * from './types/tenant';
export * from './types/common';
export * from './events/domain-event';
```

**Commit:**
```bash
git add -A
git commit -m "feat(shared): add shared types, tenant context, and domain event definitions"
```

**PROSSIGA IMEDIATAMENTE para TASK 04.**

---

## TASK 04 — Package de Validação (packages/validators)

**Objetivo:** Schemas Zod compartilhados para validação de inputs.

**Ações:**

1. Criar `packages/validators/package.json`:
```json
{
  "name": "@wbc/validators",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": { "zod": "^3.23.0" },
  "scripts": { "type-check": "tsc --noEmit" }
}
```

2. Criar `packages/validators/tsconfig.json`:
```json
{
  "extends": "@wbc/config/tsconfig.base.json",
  "compilerOptions": { "outDir": "./dist", "rootDir": "./src" },
  "include": ["src/**/*"]
}
```

3. Criar `packages/validators/src/common.ts`:
```typescript
import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const uuidSchema = z.string().uuid();

export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number (E.164)');

export const dateRangeSchema = z.object({
  from: z.date(),
  to: z.date(),
}).refine((data) => data.to >= data.from, { message: 'End date must be after start date' });
```

4. Criar `packages/validators/src/index.ts`:
```typescript
export * from './common';
```

**Commit:**
```bash
git add -A
git commit -m "feat(validators): add shared Zod schemas for pagination, UUID, phone, dateRange"
```

**PROSSIGA IMEDIATAMENTE para TASK 05.**

---

## TASK 05 — Package de i18n (packages/i18n)

**Objetivo:** Estrutura de traduções centralizada com pt-BR e en.

**Ações:**

1. Criar `packages/i18n/package.json`:
```json
{
  "name": "@wbc/i18n",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

2. Criar `packages/i18n/src/locales/pt-BR/common.json`:
```json
{
  "app_name": "Wave Beauty Consultant",
  "loading": "Carregando...",
  "error": "Algo deu errado",
  "retry": "Tentar novamente",
  "save": "Salvar",
  "cancel": "Cancelar",
  "delete": "Excluir",
  "edit": "Editar",
  "create": "Criar",
  "search": "Buscar",
  "filter": "Filtrar",
  "clear_filters": "Limpar filtros",
  "no_results": "Nenhum resultado encontrado",
  "confirm": "Confirmar",
  "back": "Voltar",
  "next": "Próximo",
  "previous": "Anterior",
  "yes": "Sim",
  "no": "Não",
  "close": "Fechar",
  "copy": "Copiar",
  "copied": "Copiado!",
  "share": "Compartilhar",
  "export": "Exportar",
  "import": "Importar"
}
```

3. Criar `packages/i18n/src/locales/en/common.json`:
```json
{
  "app_name": "Wave Beauty Consultant",
  "loading": "Loading...",
  "error": "Something went wrong",
  "retry": "Try again",
  "save": "Save",
  "cancel": "Cancel",
  "delete": "Delete",
  "edit": "Edit",
  "create": "Create",
  "search": "Search",
  "filter": "Filter",
  "clear_filters": "Clear filters",
  "no_results": "No results found",
  "confirm": "Confirm",
  "back": "Back",
  "next": "Next",
  "previous": "Previous",
  "yes": "Yes",
  "no": "No",
  "close": "Close",
  "copy": "Copy",
  "copied": "Copied!",
  "share": "Share",
  "export": "Export",
  "import": "Import"
}
```

4. Criar namespaces adicionais (pt-BR e en) com estrutura vazia para serem preenchidos por cada módulo:
```bash
for ns in auth clients sales campaigns messaging finance inventory schedule team analytics logistics landing platform ai errors; do
  echo '{}' > packages/i18n/src/locales/pt-BR/$ns.json
  echo '{}' > packages/i18n/src/locales/en/$ns.json
done
```

5. Criar `packages/i18n/src/index.ts`:
```typescript
// Locale exports for next-intl and i18next
export const locales = ['pt-BR', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'pt-BR';

export const namespaces = [
  'common', 'auth', 'clients', 'sales', 'campaigns', 'messaging',
  'finance', 'inventory', 'schedule', 'team', 'analytics', 'logistics',
  'landing', 'platform', 'ai', 'errors',
] as const;
export type Namespace = (typeof namespaces)[number];
```

**Commit:**
```bash
git add -A
git commit -m "feat(i18n): add translation structure with pt-BR and en locales and 16 namespaces"
```

**PROSSIGA IMEDIATAMENTE para TASK 06.**

---

## TASK 06 — Package de UI (packages/ui)

**Objetivo:** Design system base com shadcn/ui, Tailwind, e componentes fundamentais.

**Ações:**

1. Criar `packages/ui/package.json`:
```json
{
  "name": "@wbc/ui",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.400.0"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

2. Criar `packages/ui/tsconfig.json`:
```json
{
  "extends": "@wbc/config/tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

3. Criar `packages/ui/src/lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

4. Criar `packages/ui/src/index.ts`:
```typescript
export { cn } from './lib/utils';
// Components will be added by each module during implementation
```

**Commit:**
```bash
git add -A
git commit -m "feat(ui): initialize design system package with cn utility and shadcn/ui base"
```

**PROSSIGA IMEDIATAMENTE para TASK 07.**

---

## TASK 07 — Package de Database (packages/db)

**Objetivo:** Prisma schema completo com todos os models, enums, e configuração.

**Ações:**

1. Criar `packages/db/package.json`:
```json
{
  "name": "@wbc/db",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@prisma/client": "^5.20.0"
  },
  "devDependencies": {
    "prisma": "^5.20.0"
  },
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "ts-node prisma/seed.ts",
    "db:studio": "prisma studio"
  }
}
```

2. Criar `packages/db/tsconfig.json`:
```json
{
  "extends": "@wbc/config/tsconfig.base.json",
  "compilerOptions": { "outDir": "./dist", "rootDir": "./src" },
  "include": ["src/**/*", "prisma/**/*"]
}
```

3. Criar `packages/db/prisma/schema.prisma` — COPIAR INTEGRALMENTE o schema Prisma completo do documento WBC-Implementacao-v1.0.md, Seção 1. O schema contém todos os 40+ models, enums, relações e índices. NÃO resumir. NÃO omitir models. Copiar na íntegra.

4. Criar `packages/db/src/index.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { PrismaClient } from '@prisma/client';
export * from '@prisma/client';
```

**Commit:**
```bash
git add -A
git commit -m "feat(database): add Prisma schema with all 40+ models, enums, and relationships"
```

**PROSSIGA IMEDIATAMENTE para TASK 08.**

---

## TASK 08 — Docker Compose (Infraestrutura Local)

**Objetivo:** PostgreSQL + Redis para desenvolvimento local.

**Ações:**

1. Criar `docker-compose.yml` na raiz:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: wbc-postgres
    environment:
      POSTGRES_USER: wbc
      POSTGRES_PASSWORD: wbc_dev_2026
      POSTGRES_DB: wbc
    ports:
      - "5432:5432"
    volumes:
      - wbc_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wbc"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: wbc-redis
    ports:
      - "6379:6379"
    volumes:
      - wbc_redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  wbc_postgres_data:
  wbc_redis_data:
```

2. Criar `.env` na raiz (e adicionar ao .gitignore se não estiver):
```env
DATABASE_URL="postgresql://wbc:wbc_dev_2026@localhost:5432/wbc?schema=public"
REDIS_URL="redis://localhost:6379/0"
AUTH_SECRET="wbc-dev-secret-change-in-production-2026"
AUTH_URL="http://localhost:3000"
NODE_ENV="development"
DEEPSEEK_API_KEY=""
MERCADOPAGO_ACCESS_TOKEN=""
WHATSAPP_API_TOKEN=""
WHATSAPP_PHONE_NUMBER_ID=""
```

3. Criar `.env.example` (mesma estrutura mas sem valores sensíveis):
```env
DATABASE_URL="postgresql://wbc:wbc_dev_2026@localhost:5432/wbc?schema=public"
REDIS_URL="redis://localhost:6379/0"
AUTH_SECRET="generate-a-secure-secret"
AUTH_URL="http://localhost:3000"
NODE_ENV="development"
DEEPSEEK_API_KEY="your-deepseek-key"
MERCADOPAGO_ACCESS_TOKEN="your-mercadopago-token"
WHATSAPP_API_TOKEN="your-whatsapp-token"
WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id"
```

**Commit:**
```bash
git add -A
git commit -m "chore(infra): add Docker Compose with PostgreSQL 16 and Redis 7, env files"
```

**PROSSIGA IMEDIATAMENTE para TASK 09.**

---

## TASK 09 — App Web (apps/web) — Next.js Base

**Objetivo:** Criar app Next.js com App Router, Tailwind, tRPC client, e i18n configurados.

**Ações:**

1. Inicializar Next.js em `apps/web/`:
```bash
cd apps/web
pnpm init
```

2. Criar `apps/web/package.json`:
```json
{
  "name": "@wbc/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@trpc/client": "^11.0.0",
    "@trpc/react-query": "^11.0.0",
    "@trpc/server": "^11.0.0",
    "@trpc/next": "^11.0.0",
    "@tanstack/react-query": "^5.0.0",
    "next-intl": "^3.20.0",
    "superjson": "^2.2.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "@wbc/ui": "workspace:*",
    "@wbc/shared": "workspace:*",
    "@wbc/validators": "workspace:*",
    "@wbc/i18n": "workspace:*",
    "@wbc/db": "workspace:*"
  }
}
```

3. Criar `apps/web/tsconfig.json`:
```json
{
  "extends": "@wbc/config/tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "src/**/*", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

4. Criar `apps/web/next.config.mjs`:
```javascript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@wbc/ui', '@wbc/shared', '@wbc/validators', '@wbc/i18n'],
};

export default withNextIntl(nextConfig);
```

5. Criar `apps/web/tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
```

6. Criar `apps/web/postcss.config.mjs`:
```javascript
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

7. Criar `apps/web/src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WBC — Wave Beauty Consultant',
  description: 'CRM para consultoras de beleza',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

8. Criar `apps/web/src/app/page.tsx`:
```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-4xl font-bold">WBC Platform</h1>
    </main>
  );
}
```

9. Criar `apps/web/src/styles/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

10. Criar `apps/web/src/i18n/request.ts`:
```typescript
import { getRequestConfig } from 'next-intl/server';
import { defaultLocale } from '@wbc/i18n';

export default getRequestConfig(async () => {
  const locale = defaultLocale;
  return {
    locale,
    messages: (await import(`@wbc/i18n/src/locales/${locale}/common.json`)).default,
  };
});
```

**Commit:**
```bash
cd ../..
git add -A
git commit -m "feat(web): initialize Next.js 15 app with Tailwind, tRPC, next-intl, and workspace deps"
```

**PROSSIGA IMEDIATAMENTE para TASK 10.**

---

## TASK 10 — App API (apps/api) — tRPC Server Base

**Objetivo:** Backend tRPC com routers base, middleware de auth e tenant.

**Ações:**

1. Criar `apps/api/package.json`:
```json
{
  "name": "@wbc/api",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@trpc/server": "^11.0.0",
    "superjson": "^2.2.0",
    "zod": "^3.23.0",
    "pino": "^9.0.0",
    "@wbc/shared": "workspace:*",
    "@wbc/validators": "workspace:*",
    "@wbc/db": "workspace:*"
  },
  "devDependencies": {
    "tsx": "^4.0.0"
  }
}
```

2. Criar `apps/api/tsconfig.json`:
```json
{
  "extends": "@wbc/config/tsconfig.base.json",
  "compilerOptions": { "outDir": "./dist", "rootDir": "./src" },
  "include": ["src/**/*"]
}
```

3. Criar `apps/api/src/trpc/context.ts`:
```typescript
import type { TenantContext } from '@wbc/shared';

export interface TRPCContext {
  tenant: TenantContext | null;
}

export function createContext(): TRPCContext {
  return { tenant: null };
}
```

4. Criar `apps/api/src/trpc/trpc.ts`:
```typescript
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { TRPCContext } from './context';

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure — requires authenticated tenant
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.tenant) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  return next({ ctx: { tenant: ctx.tenant } });
});
```

5. Criar `apps/api/src/trpc/router.ts`:
```typescript
import { router } from './trpc';

// Root router — domain routers will be added during implementation
export const appRouter = router({
  // Placeholder — each module adds its router here
});

export type AppRouter = typeof appRouter;
```

6. Criar `apps/api/src/index.ts`:
```typescript
import { createLogger } from './lib/logger';

const logger = createLogger('api');

logger.info('WBC API starting...');

// HTTP server setup will be added during implementation
// For now, just verify the module loads correctly
logger.info('WBC API module loaded successfully');
```

7. Criar `apps/api/src/lib/logger.ts`:
```typescript
import pino from 'pino';

export function createLogger(service: string) {
  return pino({
    name: `wbc-${service}`,
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  });
}
```

**Commit:**
```bash
git add -A
git commit -m "feat(api): initialize tRPC server with context, protected procedures, and logger"
```

**PROSSIGA IMEDIATAMENTE para TASK 11.**

---

## TASK 11 — App Worker (apps/worker) — BullMQ Base

**Objetivo:** Worker de filas BullMQ separado da API.

**Ações:**

1. Criar `apps/worker/package.json`:
```json
{
  "name": "@wbc/worker",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "bullmq": "^5.0.0",
    "ioredis": "^5.4.0",
    "pino": "^9.0.0",
    "@wbc/shared": "workspace:*",
    "@wbc/db": "workspace:*"
  },
  "devDependencies": { "tsx": "^4.0.0" }
}
```

2. Criar `apps/worker/tsconfig.json`:
```json
{
  "extends": "@wbc/config/tsconfig.base.json",
  "compilerOptions": { "outDir": "./dist", "rootDir": "./src" },
  "include": ["src/**/*"]
}
```

3. Criar `apps/worker/src/lib/redis.ts`:
```typescript
import Redis from 'ioredis';

export const connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379/0', {
  maxRetriesPerRequest: null, // Required by BullMQ
});
```

4. Criar `apps/worker/src/lib/logger.ts`:
```typescript
import pino from 'pino';

export const logger = pino({
  name: 'wbc-worker',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});
```

5. Criar `apps/worker/src/queues/index.ts`:
```typescript
import { Queue } from 'bullmq';
import { connection } from '../lib/redis';

// Queue definitions — handlers added during implementation
export const messagingQueue = new Queue('wbc:messaging', { connection });
export const campaignQueue = new Queue('wbc:campaigns', { connection });
export const scheduleQueue = new Queue('wbc:schedule', { connection });
export const analyticsQueue = new Queue('wbc:analytics', { connection });
export const outboxQueue = new Queue('wbc:outbox', { connection });
```

6. Criar `apps/worker/src/index.ts`:
```typescript
import { logger } from './lib/logger';

logger.info('WBC Worker starting...');

// Workers will be registered during implementation
// For now, just verify the module loads correctly
logger.info('WBC Worker module loaded successfully');
```

**Commit:**
```bash
git add -A
git commit -m "feat(worker): initialize BullMQ worker with Redis connection and queue definitions"
```

**PROSSIGA IMEDIATAMENTE para TASK 12.**

---

## TASK 12 — App Landing (apps/landing) — Next.js ISR Base

**Objetivo:** App separado para landing pages das consultoras (nome.wbc.com.br).

**Ações:**

1. Criar `apps/landing/package.json`:
```json
{
  "name": "@wbc/landing",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwindcss": "^3.4.0",
    "@wbc/db": "workspace:*",
    "@wbc/ui": "workspace:*"
  }
}
```

2. Criar `apps/landing/tsconfig.json`:
```json
{
  "extends": "@wbc/config/tsconfig.base.json",
  "compilerOptions": { "jsx": "preserve", "plugins": [{ "name": "next" }], "paths": { "@/*": ["./src/*"] } },
  "include": ["next-env.d.ts", "src/**/*"],
  "exclude": ["node_modules"]
}
```

3. Criar `apps/landing/src/app/[slug]/page.tsx`:
```tsx
// ISR landing page — regenerates when consultant updates profile
export default function ConsultantLandingPage({ params }: { params: { slug: string } }) {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">Landing page: {params.slug}</h1>
    </main>
  );
}

// ISR: regenerate every 60 seconds
export const revalidate = 60;
```

4. Criar `apps/landing/src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WBC — Consultora de Beleza',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
```

**Commit:**
```bash
git add -A
git commit -m "feat(landing): initialize Next.js ISR app for consultant landing pages"
```

**PROSSIGA IMEDIATAMENTE para TASK 13.**

---

## TASK 13 — Instalar Dependências e Verificar Monorepo

**Objetivo:** Instalar todas as dependências e garantir que o monorepo compila.

**Ações:**

```bash
# Na raiz do projeto (já estamos aqui)

# Instalar todas as dependências
pnpm install

# Verificar que o Prisma client pode ser gerado
cd packages/db
pnpm db:generate
cd ../..

# Verificar type-check (pode ter warnings, não deve ter errors fatais)
pnpm type-check || echo "Type-check warnings expected at bootstrap stage"

# Verificar que a estrutura existe
echo "Verificando estrutura..."
ls apps/
ls packages/
ls packages/business/
echo "✅ Monorepo structure verified"
```

**Commit:**
```bash
git add -A
git commit -m "chore(monorepo): install dependencies, generate Prisma client, verify structure"
```

**PROSSIGA IMEDIATAMENTE para TASK 14.**

---

## TASK 14 — Verificar Documentos de Referência em begin/

**Objetivo:** Garantir que todos os documentos de referência estão na pasta `begin/` do projeto.

**Ações:**

```bash
# Criar pasta begin/ se não existir
mkdir -p begin

# Verificar que os documentos existem em begin/:
echo "Verificando documentos de referência em begin/..."
test -f begin/WBC-Funcionalidades-v1.2.md && echo "✅ Funcionalidades" || echo "❌ Funcionalidades AUSENTE"
test -f begin/WBC-Arquitetura-Tecnica-v1.0.md && echo "✅ Arquitetura" || echo "❌ Arquitetura AUSENTE"
test -f begin/WBC-Implementacao-v1.0.md && echo "✅ Implementação" || echo "❌ Implementação AUSENTE"
test -f begin/WBC_REGRAS_INVIOLAVEIS.md && echo "✅ Regras" || echo "❌ Regras AUSENTE"
test -f begin/WBC_FASES_E_EPICOS.md && echo "✅ Fases e Épicos" || echo "❌ Fases e Épicos AUSENTE"
test -f begin/WBC_GERADOR_DE_PROMPTS.md && echo "✅ Gerador de Prompts" || echo "❌ Gerador de Prompts AUSENTE"
test -f begin/WBC_SUPERMEMORY_SETUP.md && echo "✅ SuperMemory" || echo "❌ SuperMemory AUSENTE"
test -f begin/WBC_BOOTSTRAP_PROMPT.md && echo "✅ Bootstrap" || echo "❌ Bootstrap AUSENTE"
test -f begin/WBC_ORCHESTRATOR.md && echo "✅ Orchestrator" || echo "❌ Orchestrator AUSENTE"
```

Se algum documento estiver ausente: reportar como aviso mas NÃO bloquear. Os documentos essenciais para execução são WBC_REGRAS_INVIOLAVEIS.md, WBC_FASES_E_EPICOS.md e WBC_GERADOR_DE_PROMPTS.md — se algum destes faltar, STATUS=BLOCKED.

**Commit:**
```bash
git add -A
git commit -m "docs: verify all reference documents in begin/"
```

**PROSSIGA IMEDIATAMENTE para TASK 15.**

---

## TASK 15 — Inicializar Infraestrutura Docker e Banco

**Objetivo:** Subir PostgreSQL e Redis, rodar migration inicial.

**Ações:**

```bash
# Subir containers
docker compose up -d

# Aguardar containers ficarem healthy
echo "Aguardando PostgreSQL..."
until docker compose exec postgres pg_isready -U wbc; do sleep 2; done
echo "✅ PostgreSQL ready"

echo "Aguardando Redis..."
until docker compose exec redis redis-cli ping | grep -q PONG; do sleep 2; done
echo "✅ Redis ready"

# Rodar migration inicial
cd packages/db
pnpm db:migrate --name init
cd ../..

echo "✅ Database migrated successfully"
```

**Commit:**
```bash
git add -A
git commit -m "chore(database): run initial Prisma migration with all models"
```

**PROSSIGA IMEDIATAMENTE para TASK 16.**

---

## TASK 16 — Estrutura de Prompts e STATE.json Inicial

**Objetivo:** Criar a estrutura base para os prompts de implementação e o estado inicial do Orchestrator.

**Ações:**

1. Criar estrutura de pastas:
```bash
mkdir -p prompts/{fase-01,fase-02,fase-03,fase-04,fase-05,fase-06,fase-07,reports}
```

2. Criar `prompts/STATE.json`:
```json
{
  "version": 1,
  "project": "WBC Platform",
  "current_phase": 1,
  "current_epic": "F1.E01",
  "current_task": 0,
  "current_mode": "ARCHITECT",
  "status": "IN_PROGRESS",
  "branch": "main",
  "history": [],
  "phase_summary": {},
  "started_at": null,
  "last_updated": null
}
```

3. Criar `prompts/README.md`:
```markdown
# WBC Platform — Prompts de Implementação

Gerados automaticamente pelo WBC Orchestrator.

## Estrutura

- `STATE.json` — Estado atual do Orchestrator
- `fase-XX/` — Prompts de implementação por fase
- `reports/` — Relatórios de checkpoint por fase

## Regras

- O Orchestrator gera prompts fase a fase
- O Executor implementa sequencialmente, sem parar
- Sem testes até a fase final
- Gates (type-check) apenas entre fases
```

**Commit:**
```bash
git add -A
git commit -m "chore(orchestrator): initialize prompt structure with STATE.json"
```

---

## TASK 17 — Tag de Bootstrap e Validação Final

**Objetivo:** Fechar o bootstrap com tag e verificação.

**Ações:**

```bash
# Verificação final
echo "=== WBC BOOTSTRAP VERIFICATION ==="
echo ""
echo "Monorepo:"
ls -la apps/
ls -la packages/
echo ""
echo "Docker:"
docker compose ps
echo ""
echo "Database:"
cd packages/db && pnpm db:generate && cd ../..
echo ""
echo "Structure:"
find packages/business -type d -maxdepth 2 | sort
echo ""
echo "Prompts:"
cat prompts/STATE.json
echo ""
echo "=== BOOTSTRAP COMPLETE ==="

# Tag
git tag v0.1.0-bootstrap

echo ""
echo "✅ WBC Bootstrap completo. Tag: v0.1.0-bootstrap"
echo ""
echo "PRÓXIMO PASSO: Executar begin/WBC_ORCHESTRATOR.md"
echo "NÃO PARE. PROSSIGA IMEDIATAMENTE."
```

**Commit final:**
```bash
git add -A
git commit -m "chore(bootstrap): complete WBC Platform bootstrap — v0.1.0"
```

---

**BOOTSTRAP COMPLETO. O agente deve prosseguir IMEDIATAMENTE para o begin/WBC_ORCHESTRATOR.md. NÃO PARAR. NÃO PERGUNTAR.**
