# WBC Platform — Claude Code Instructions

## Contexto do Projeto

Este é o projeto **WBC Platform (Wave Beauty Consultant)** da **WeaveCode Ltd (UK)**.
CRM vertical multi-tenant para consultoras de beleza no Brasil.
Repositório: `WeaveCode-UK/wbc` no GitHub.

## Modo de Execução

Este projeto é executado de forma **autônoma e contínua** pelo Claude Code:
- **NUNCA pare para perguntar.** NUNCA espere confirmação.
- Siga o Orchestrator (`begin/WBC_ORCHESTRATOR.md`) do início ao fim.
- O único motivo para parar: erro fatal (BLOCKED) ou BUILD COMPLETO (v1.0.0).
- Execução sequencial — um épico por vez, uma task por vez.
- Literalidade absoluta — se não está no prompt, não existe.

## Fonte de Verdade

- `prompts/STATE.json` — estado atual (fase, épico, task, modo)
- `begin/WBC_REGRAS_INVIOLAVEIS.md` — 16 regras que NUNCA podem ser violadas
- Prompt do épico atual — fonte de verdade para execução

## Regras Críticas

- **Arquitetura Hexagonal:** domain/ NUNCA importa de adapters/
- **Multi-tenant:** tenantId obrigatório em TODA query Prisma
- **i18n:** ZERO strings hardcoded na UI — tudo via useTranslations()
- **Tipagem:** ZERO `any` em código próprio
- **Comunicação entre módulos:** APENAS eventos assíncronos (BullMQ)
- **Git:** Conventional Commits em inglês, lowercase, sem ponto
- **Testes:** ZERO testes até Fase 7
- **Gates:** type-check APENAS entre fases (checkpoints)

## Stack

TypeScript, Next.js 15, tRPC 11, Prisma, PostgreSQL, Redis, BullMQ,
React Native (Expo), Tailwind, shadcn/ui, Turborepo, pnpm workspaces.

## Documentos de Referência

Todos em `begin/`:
- `WBC_ORCHESTRATOR.md` — ponto de entrada principal
- `WBC_REGRAS_INVIOLAVEIS.md` — contrato de execução
- `WBC_FASES_E_EPICOS.md` — roadmap (7 fases, ~53 épicos)
- `WBC_GERADOR_DE_PROMPTS.md` — template de geração de prompts
- `WBC-Implementacao-v1.0.md` — Prisma schema, events, rotas tRPC
- `WBC-Arquitetura-Tecnica-v1.0.md` — estrutura do monorepo
- `WBC-Funcionalidades-v1.2.md` — 105 funcionalidades

## Fluxo

1. **ARQUITETO** gera prompts da fase → salva em `prompts/fase-XX/`
2. **EXECUTOR** implementa cada épico task por task
3. Merge → próximo épico → repete
4. Checkpoint (último épico da fase) → type-check + tag
5. Próxima fase → volta ao passo 1
