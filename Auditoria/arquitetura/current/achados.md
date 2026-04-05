# Achados da Auditoria

## Identificacao
- dominio: arquitetura
- run_id: 2026-04-05_18-00-00
- ultima_atualizacao: 2026-04-05 18:40:00

## Achados Registrados

### ACH-001
- titulo: 5 use-cases violam hexagonal importando diretamente de adapters ou @wbc/db
- severidade: medio
- categoria: aderencia-arquitetural
- status: aberto
- resumo: 5 use-cases importam prisma ou adapters concretos em vez de usar ports (interfaces injetadas). Viola ADR-001 (hexagonal architecture).

#### Evidencia
- arquivo_ou_area: packages/business/auth/use-cases/delete-account.use-case.ts — import { prisma } from '@wbc/db'
- arquivo_ou_area: packages/business/auth/use-cases/complete-onboarding.use-case.ts — import { prisma } from '@wbc/db'
- arquivo_ou_area: packages/business/schedule/use-cases/notifications.ts — import PrismaNotificationRepository from adapters
- arquivo_ou_area: packages/business/messaging/use-cases/post-sale-flow.ts — import PrismaPostSaleFlowRepository from adapters
- arquivo_ou_area: packages/business/messaging/use-cases/auto-messages.ts — import PrismaScheduledMessageRepository from adapters

#### Impacto
- tecnico: use-cases nao testáveis isoladamente sem banco real
- negocio: aumenta custo de mudanca se infraestrutura mudar

#### Recomendacao
- acao_sugerida: criar ports para estes repositorios e injetar via parametro no use-case
- prioridade: media

### ACH-002
- titulo: packages/business/ nao e workspace package — usa path alias implicito
- severidade: baixo
- categoria: estrutura-monorepo
- status: aberto
- resumo: O diretorio packages/business/ nao tem package.json e nao e um workspace pnpm. Os 15 modulos de negocio sao incluidos via tsconfig include path (../../packages/business/**/*.ts). Funciona mas e fragil — tooling (eslint, turbo) nao reconhece como package.

#### Evidencia
- arquivo_ou_area: packages/business/ (sem package.json)
- arquivo_ou_area: apps/api/tsconfig.json — include: ["../../packages/business/**/*.ts"]
- arquivo_ou_area: apps/web/tsconfig.json — include: ["../../packages/business/**/*.ts"]

#### Impacto
- tecnico: turborepo nao pode cachear builds do business separadamente, linting parcial
- negocio: nenhum impacto direto

#### Recomendacao
- acao_sugerida: adicionar package.json a packages/business/ com workspace:* dependencies
- prioridade: baixa

### ACH-003
- titulo: Arquitetura hexagonal, ADRs e separacao de concerns bem implementados (positivo)
- severidade: informativo
- categoria: postura-geral
- status: confirmado
- resumo: O projeto segue a arquitetura hexagonal declarada na grande maioria dos modulos (15/15 tem domain/ports/adapters/use-cases). 4 ADRs documentam decisoes chave. Separacao clara entre apps (web/api/worker/mobile/landing) e packages (shared/db/ui/validators/i18n/config). Domain layer nunca importa de adapters. Multi-tenant isolado via middleware. Event system via outbox pattern com BullMQ.

#### Evidencia
- arquivo_ou_area: packages/business/*/domain/ — zero imports de adapters
- arquivo_ou_area: docs/adr/ — 4 ADRs (hexagonal, multi-tenant RLS, outbox, auth)
- arquivo_ou_area: apps/ — 5 apps claramente separados por responsabilidade

#### Impacto
- tecnico: codebase sustentavel e evolutiva
- negocio: custo de manutencao controlado

#### Recomendacao
- acao_sugerida: manter e corrigir as 5 violacoes hexagonais pendentes
- prioridade: baixa
