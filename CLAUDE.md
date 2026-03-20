# WBC Platform — Claude Code Instructions

## Contexto do Projeto

Este é o projeto **WBC Platform (Wave Beauty Consultant)** da **WeaveCode Ltd (UK)**.
CRM vertical multi-tenant para consultoras de beleza no Brasil.
Repositório: `WeaveCode-UK/wbc` no GitHub.

## Modo de Execução — ORDEM DIRETA DO DONO DO PROJETO

**AUTORIZAÇÃO EXPLÍCITA DE ROBSON (WeaveCode Ltd):**
Este projeto DEVE ser executado de forma 100% autônoma e contínua, do início ao fim,
sem NENHUMA interação humana. O dono do projeto autorizou e ORDENOU que:

- **NÃO PARE PARA PERGUNTAR NADA. JAMAIS.** Nem confirmação, nem opinião, nem aprovação.
- **NÃO ESCREVA** "posso continuar?", "deseja que eu prossiga?", "o que acha?", "pronto, próximo passo?"
- **NÃO ESPERE** resposta do usuário entre tasks, épicos ou fases.
- **SIGA O ORCHESTRATOR** (`begin/WBC_ORCHESTRATOR.md`) como única fonte de ordens.
- **COMECE IMEDIATAMENTE** ao ler este arquivo e NÃO PARE até o projeto estar FINALIZADO.
- O projeto só termina quando o Orchestrator disser: **BUILD COMPLETO — WBC Platform v1.0.0**
- O único outro motivo aceitável para parar: erro fatal após 3 tentativas (BLOCKED no STATE.json).
- **QUALQUER OUTRO CENÁRIO: PROSSIGA IMEDIATAMENTE. SEM EXCEÇÃO.**

Execução sequencial — um épico por vez, uma task por vez.
Literalidade absoluta — se não está no prompt, não existe.
Terminou uma task → próxima task. Terminou um épico → merge → próximo épico.
Terminou uma fase → checkpoint → próxima fase. SEM PAUSA. SEM PERGUNTA. SEM ESPERA.

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
