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

### Convenção de use-cases (ACH-020, codigo-manutenibilidade run 2026-04-18_21-45-58)

- **Forma padrão:** classe com método `execute(input)` recebendo dependências via construtor.
  ```ts
  export class CreateClient {
    constructor(private readonly repo: ClientRepository) {}
    async execute(input: CreateClientInput): Promise<Client> { ... }
  }
  ```
- **Quando usar função pura `async function execute(input, deps)`:** apenas para utilitários
  sem dependências próprias, sem estado, sem variações por tenant/usuário. Na dúvida, use classe.
- Use-cases NUNCA instanciam adapters diretamente — recebem via construtor a partir da
  composition root (`apps/api/src/composition-root.ts`, introduzido pelo ACH-003).

## Stack

TypeScript, Next.js 15, tRPC 11, Prisma, PostgreSQL, Redis, BullMQ,
React Native (Expo), Tailwind, shadcn/ui, Turborepo, pnpm workspaces.

## Documentos de Referência

Todos em `begin/`:

- `WBC_ORCHESTRATOR.md` — ponto de entrada principal
- `WBC_REGRAS_INVIOLAVEIS.md` — contrato de execução
- `WBC_FASES_E_EPICOS.md` — roadmap (7 fases, ~53 épicos)
- `WBC_GERADOR_DE_PROMPTS.md` — template de geração de prompts
- `WBC-UI-UX-Design-System-v1.0.md` — design system e UI/UX
- `WBC-Fase9-Pacote-Integracao.md` — pacote de integração fase 9

## Fluxo

1. **ARQUITETO** gera prompts da fase → salva em `prompts/fase-XX/`
2. **EXECUTOR** implementa cada épico task por task
3. Merge → próximo épico → repete
4. Checkpoint (último épico da fase) → type-check + tag
5. Próxima fase → volta ao passo 1

---

## Design System — WeaveCode Design System

This repo uses the **WeaveCode Design System**, located in `WeaveCode Design System/` at the root.
Any UI work — components, pages, prototypes, slides — MUST follow it. Do not invent colors, fonts, spacing, shadows, or radii.

### Read these before any UI work

1. `WeaveCode Design System/SKILL.md` — copy-paste recipes, do/don't list, the Georgia `{moment}` rule.
2. `WeaveCode Design System/README.md` — full brand reference: voice, content, visual foundations.
3. `WeaveCode Design System/colors_and_type.css` — every available token. Use `var(--wc-*)` exclusively.
4. `WeaveCode Design System/preview/` — static HTML examples of every component, template, and foundation. **When in doubt, lift markup directly from here.**

### Setup (once per app)

Import the tokens once in your root layout:

```ts
// apps/web/src/app/layout.tsx (Next.js)
import "@/weavecode/colors_and_type.css";
```

If the design system is not yet wired into an app, copy `colors_and_type.css` (and `fonts/`) into the app under `src/weavecode/` and import as above.

### Hard rules

- ✅ **Tokens only.** `var(--wc-purple)`, never `#8127E8`.
- ✅ **Inter for UI**, **Georgia italic only for `{moments}`** — once per surface, on a single highlighted noun.
- ✅ **One primary CTA per surface.** Filled purple. Demote others.
- ✅ **Build all four states** for any async surface: loading, empty, error, success. See `WeaveCode Design System/preview/components-skeleton.html`, `components-empty.html`, `components-error.html`.
- ✅ **Focus rings:** 3px orange, 2px offset, on every interactive element.
- ✅ **Touch targets ≥ 44×44px**, on every breakpoint.
- ✅ **Respect `prefers-reduced-motion`** — fall back to fade or instant.

- ❌ No hex outside the token palette.
- ❌ No emoji as iconography. Use the line icon set (`WeaveCode Design System/preview/brand-icons.html`).
- ❌ No invented gradients — use the assets in `WeaveCode Design System/assets/grafismos/`.
- ❌ No two primary CTAs on the same surface.

### The brand in one line

> Calm, technical, electric purple on deep navy, with a Georgia italic `{moment}` once per surface.

### Component reference

Every component you need has a static example in `WeaveCode Design System/preview/`:

| Need                                        | File                            |
| ------------------------------------------- | ------------------------------- |
| Buttons                                     | `components-buttons.html`       |
| Inputs / Select / Checkbox / Radio / Switch | `components-inputs.html`        |
| Textarea + form section                     | `components-textarea-form.html` |
| Cards                                       | `components-cards.html`         |
| Badges                                      | `components-badges.html`        |
| Alerts                                      | `components-alerts.html`        |
| Toast                                       | `components-toast.html`         |
| Modal / Dialog                              | `components-modal.html`         |
| Drawer / Sheet                              | `components-drawer.html`        |
| Dropdown menu                               | `components-dropdown.html`      |
| Tabs                                        | `components-tabs.html`          |
| Table                                       | `components-table.html`         |
| Skeleton                                    | `components-skeleton.html`      |
| Empty state                                 | `components-empty.html`         |
| Error / 404                                 | `components-error.html`         |
| Tooltip                                     | `components-tooltip.html`       |
| App shell (sidebar + topbar)                | `components-shell.html`         |
| Page header                                 | `components-page-header.html`   |
| Container + 12-col grid                     | `components-container.html`     |
| Pagination                                  | `components-pagination.html`    |
| Hero                                        | `components-hero.html`          |

### Templates

Full-page references: `template-dashboard.html`, `template-auth.html`, `template-settings.html` (em `WeaveCode Design System/preview/`).

### Foundations

`foundations-motion.html`, `foundations-interactions.html`, `foundations-responsive.html`, `foundations-accessibility.html` (em `WeaveCode Design System/preview/`).

### When the design system is missing something

Ask before inventing. Open a discussion or note it in the PR. Do not silently extend the palette, scale, or component set.

### Relação com `begin/WBC-UI-UX-Design-System-v1.0.md`

`begin/WBC-UI-UX-Design-System-v1.0.md` descreve o produto WBC (telas, fluxos, conteúdo).
`WeaveCode Design System/` é a fonte de verdade visual (tokens, componentes, foundations) e tem prioridade em qualquer conflito de cor/tipografia/spacing/iconografia.
