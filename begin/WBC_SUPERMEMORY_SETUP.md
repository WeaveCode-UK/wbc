# WBC Platform — Configuração de SuperMemory e Contexto

> **Tipo:** Prompt de configuração pré-execução
> **Execução:** Claude Code CLI no diretório `/Users/robsonmacpro/WeaveCode/Sistemas/5-Dev/weavecode-wbc/wbc`
> **Objetivo:** Configurar o SuperMemory com todas as constantes, regras e contexto do projeto. Deve ser executado UMA VEZ antes do Bootstrap. Garante que o agente não perde contexto em sessões longas.
> **Pré-requisitos:**
> - Claude Code CLI instalado com SuperMemory habilitado
> - Diretório de trabalho criado: `/Users/robsonmacpro/WeaveCode/Sistemas/5-Dev/weavecode-wbc/wbc`
> - Dangerous Mode + Bypass ON

---

## TASK 1 — Gravar Identidade e Missão

Grave no SuperMemory:

```
=== WBC IDENTITY ===
Projeto: WBC Platform (Wave Beauty Consultant)
Empresa: WeaveCode Ltd (UK)
Tipo: CRM vertical multi-tenant para consultoras de beleza
Público: Consultoras de venda direta (Mary Kay, Avon, Natura, Jequiti, Boticário) no Brasil
Mercado: Brasil (pt-BR, BRL) — arquitetura multirregional pronta para expansão futura
Concorrente: Abacate App (abacato.app)
Modelo: Preço baixo, viralização por escala

Planos:
- ESSENTIAL: Todas as funcionalidades + WhatsApp N1 (copia/cola) + Landing page + IA (30 gen/mês)
- PRO: Tudo do Essential + WhatsApp N2 (API oficial Meta — automação total)

Missão do agente: Construir o WBC completo, do zero ao produto final, sem intervenção humana.
Modo: Dangerous Mode + Bypass ON. Execução contínua até BUILD COMPLETO.
```

---

## TASK 2 — Gravar Stack Técnica

Grave no SuperMemory:

```
=== WBC STACK ===
Core: TypeScript, Node.js
Web: Next.js (App Router), React, tRPC
Mobile: React Native (Expo), React Navigation, Zustand, NativeWind
UI: Tailwind CSS, shadcn/ui (Radix), Lucide icons
Auth: Auth.js (OIDC/JWT), OTP via WhatsApp
Validação: Zod
ORM: Prisma + PostgreSQL (RLS multi-tenant)
Cache/Queue: Redis (ioredis), BullMQ
Storage: S3/R2 (Cloudflare)
Realtime: WS/SSE
i18n Web: next-intl
i18n Mobile: i18next + react-i18next
Logging: Pino
Datas: date-fns, date-fns-tz (stored UTC, displayed local)
Observabilidade: OpenTelemetry, Sentry
Monorepo: Turborepo + pnpm workspaces
DevOps: Docker, GitHub Actions
Deploy: VPS Hostinger KVM4, Docker Compose
WhatsApp: Meta Cloud API (N2), Deep Links (N1)
Pagamento: Mercado Pago API (PIX, webhook)
Landing: Next.js ISR + Cloudflare CDN
Push: Expo Push Notifications
Offline: expo-sqlite ou WatermelonDB
IA: DeepSeek V3.2 API (provider abstrato — env var)
Testes: Vitest, Playwright (APENAS fase final — ZERO testes durante construção)
```

---

## TASK 3 — Gravar Arquitetura

Grave no SuperMemory:

```
=== WBC ARCHITECTURE ===
Padrão: Hexagonal (Ports & Adapters)

Camadas por módulo:
  domain/     → Entidades, VOs, regras puras. ZERO deps externas.
  ports/      → Interfaces/contratos.
  use-cases/  → Orquestração. Consome ports.
  adapters/   → Implementações concretas (Prisma, APIs externas).

REGRA: domain/ NUNCA importa de adapters/. Violação = código inválido.

Multi-tenant: tenantId obrigatório em TODA query Prisma. Sem exceção.
Comunicação entre módulos: APENAS eventos assíncronos (BullMQ/Redis). NUNCA chamada direta.
Garantias: Outbox pattern, idempotência, DLQ.

Monorepo:
  apps/api      → Backend tRPC
  apps/worker   → BullMQ workers (separado da API)
  apps/web      → Next.js dashboard
  apps/mobile   → React Native Expo
  apps/landing  → Next.js ISR (nome.wbc.com.br)
  packages/business   → 15 domínios hexagonais
  packages/db         → Prisma schema + migrations
  packages/shared     → Types + domain events
  packages/ui         → Componentes shadcn/ui
  packages/i18n       → Traduções pt-BR + en
  packages/validators → Schemas Zod
  packages/config     → ESLint, Prettier, TSConfig
```

---

## TASK 4 — Gravar os 15 Módulos de Negócio

Grave no SuperMemory:

```
=== WBC MODULES (packages/business) ===
01. auth       → Tenant, OTP login, subscription, RLS, middleware
02. clients    → Cadastro + perfil beleza, etiquetas auto/manuais, filtros, leads, notas, ABC, score, alergias, wishlist, presenteadores
03. catalog    → Marcas, produtos, vitrine digital, link compartilhável, ranking
04. sales      → Vendas, rascunho, cashback, contas a receber, devoluções, conversão campanha→vendas
05. campaigns  → Disparo personalizado, áudio, agendamento, estatísticas, remarketing, templates, feed comunitário
06. messaging  → WhatsApp N1+N2, pós-venda 2+2+2, cobrança, boas-vindas, reativação, respostas rápidas
07. ai         → DeepSeek V3.2, geração texto (campanha/cobrança/reativação/correção), limite 30/mês, provider abstrato
08. inventory  → Estoque, pedidos à marca, amostras/brindes, alerta estoque baixo
09. finance    → Financeiro, despesas, lucratividade, calculadoras (margem/meta/CAC), Mercado Pago/PIX
10. schedule   → Agenda, lembretes reposição, datas automatizadas, calendário oportunidades, notificações, modo "meu dia"
11. team       → Perfil por cargo, gestão equipe, tarefas, ranking, sync carreira
12. analytics  → Dashboard, metas/gamificação, sugestão por perfil, sazonalidade, score engajamento, ABC
13. logistics  → Entregas, roteiro dia, tracking visual, etiqueta envio, prazo estimado
14. landing    → Landing page pessoal, subdomínio nome.wbc.com.br, geração automática, CDN
15. platform   → i18n, referral, onboarding (wizard+progressivo+checklist), OTP, backup/export, modo demo, widget status, múltiplas marcas
```

---

## TASK 5 — Gravar Regras de i18n

Grave no SuperMemory:

```
=== WBC I18N ===
Locales: pt-BR (default, mercado primário) + en (fallback)
Web: next-intl
Mobile: i18next + react-i18next
ZERO strings hardcoded na UI — TUDO via useTranslations('namespace')
Namespaces: common, auth, clients, sales, campaigns, messaging, finance, inventory, schedule, team, analytics, logistics, landing, platform, ai, errors
Datas: date-fns + locale (stored UTC, displayed timezone do tenant)
Moeda: Intl.NumberFormat (BRL default)
Timezone: configurável por tenant (default America/Sao_Paulo)
Toda key pt-BR DEVE existir em en e vice-versa
```

---

## TASK 6 — Gravar Design System

Grave no SuperMemory:

```
=== WBC DESIGN ===
Font principal: Inter
Font mono: JetBrains Mono
Touch targets: mínimo 44px (público usa celulares de entrada)
Componentes: shadcn/ui + cn() (clsx + tailwind-merge)
Cores: tokens semânticos via Tailwind (NUNCA hex direto)
Approach: Mobile-first OBRIGATÓRIO
UX: EXTREMAMENTE simples — público com baixo conhecimento técnico
Máximo 2 toques para ações principais
Loading: <Skeleton /> em toda data async
Empty: mensagem instrutiva + ação primária
Error: mensagem amigável + botão retry
```

---

## TASK 7 — Gravar Regras de Git

Grave no SuperMemory:

```
=== WBC GIT ===
Commits: Conventional Commits — type(scope): description (inglês, lowercase, sem ponto)
Types: feat, fix, refactor, chore, docs
Scopes: auth, clients, catalog, sales, campaigns, messaging, ai, inventory, finance, schedule, team, analytics, logistics, landing, platform, ui, database, cache, i18n, observability
Branches: fase-XX/FX.EYY_nome_descritivo
Tags: vX.Y.0-fase-XX
Main: merge --no-ff após épico completo
Gates entre épicos: NENHUM
Gates entre fases: APENAS pnpm type-check
Testes: APENAS fase final
```

---

## TASK 8 — Gravar Regras Operacionais do Agente

Grave no SuperMemory:

```
=== WBC AGENT RULES ===
Modo: Dangerous Mode + Bypass ON
Execução: SEQUENCIAL. Um épico por vez. PROIBIDO subagents/paralelo.
Fluxo: CONTÍNUO. NUNCA parar. NUNCA perguntar. NUNCA esperar confirmação.
Terminou task → próxima task. Terminou épico → merge → próximo épico. Terminou fase → checkpoint → próxima fase.
Único motivo para parar: erro fatal (BLOCKED no STATE.json) ou BUILD COMPLETO.

Literalidade: Se não está no prompt, não existe. PROIBIDO inventar. PROIBIDO "melhorar".
Dúvida entre mais e menos: FAZER MENOS.
Ambiguidade: implementação MAIS SIMPLES e MAIS CURTA.

STATE.json é a fonte de verdade. Ler ANTES de qualquer ação. Atualizar APÓS cada task.
Cada prompt de épico é autocontido. NÃO depende de ter lido épicos anteriores.

Compactação de contexto ao iniciar FASE (modo ARQUITETO):
1. Ler STATE.json
2. Reler begin/WBC_REGRAS_INVIOLAVEIS.md
3. Reler begin/WBC_GERADOR_DE_PROMPTS.md
4. Ler seção da fase atual em begin/WBC_FASES_E_EPICOS.md
5. Consultar seções referenciadas dos docs técnicos em begin/
6. NÃO carregar prompts de épicos anteriores ou futuros

Compactação de contexto ao iniciar ÉPICO (modo EXECUTOR):
1. Ler STATE.json
2. Ler begin/WBC_REGRAS_INVIOLAVEIS.md
3. Ler prompt do épico atual: prompts/fase-XX/FX.EYY_nome.md
4. NADA MAIS — estes 3 itens = fonte de verdade completa

Checkpoints (último épico de cada fase):
- NÃO são épicos de implementação — NÃO gerar prompt para eles
- Executar type-check + tag diretamente em main

Sem testes até fase final. Sem lint entre épicos. Sem build entre épicos.
Type-check APENAS entre fases (checkpoints).
```

---

## TASK 9 — Gravar Transições Explícitas

Grave no SuperMemory:

```
=== WBC TRANSITIONS ===
Fim de TASK:
  → git add [arquivos da task]
  → git commit -m "type(scope): description"
  → Atualizar STATE.json (current_task++)
  → git add prompts/STATE.json && git commit -m "state: FX.EYY task N complete"
  → IR IMEDIATAMENTE para próxima task

Fim de ÉPICO:
  → git add -A
  → git commit -m "feat(scope): complete FX.EYY — nome"
  → Atualizar STATE.json (epic = COMPLETED, avançar)
  → git add prompts/STATE.json && git commit -m "state: FX.EYY complete"
  → git checkout main
  → git merge fase-XX/FX.EYY_nome --no-ff
  → git branch -d fase-XX/FX.EYY_nome
  → Se próximo épico é checkpoint: permanecer em main, executar checkpoint
  → Se próximo épico NÃO é checkpoint: git checkout -b fase-XX/FX.E{YY+1}_nome
  → IR IMEDIATAMENTE para próximo épico. NÃO PARAR.

Fim de FASE (CHECKPOINT — último épico da fase):
  → git checkout main
  → pnpm install
  → pnpm type-check (se falhar: corrigir, max 3 tentativas, depois BLOCKED)
  → git tag vX.Y.0-fase-XX
  → Atualizar STATE.json (phase = COMPLETED, mode = ARCHITECT, avançar)
  → git commit -m "state: phase XX complete"
  → IR IMEDIATAMENTE para próxima fase (modo ARQUITETO). NÃO PARAR.

Fim de TODAS AS FASES:
  → pnpm install && pnpm type-check && pnpm lint && pnpm build
  → git tag v1.0.0
  → Atualizar STATE.json (status = BUILD_COMPLETE)
  → PARAR. Reportar: "BUILD COMPLETO — WBC Platform v1.0.0"
```

---

## TASK 10 — Gravar Documentos de Referência

Grave no SuperMemory:

```
=== WBC REFERENCE DOCS ===
Localização: todos os documentos ficam em begin/ dentro do repo
Path completo: /Users/robsonmacpro/WeaveCode/Sistemas/5-Dev/weavecode-wbc/wbc/begin/

Doc 1 — begin/WBC-Funcionalidades-v1.2.md
  Propósito: Lista completa de 105 funcionalidades, stack, planos
  Quando consultar: se precisar entender O QUE o produto faz

Doc 2 — begin/WBC-Arquitetura-Tecnica-v1.0.md
  Propósito: Monorepo, módulos, modelagem de dados, fases, fluxos
  Quando consultar: se precisar entender COMO o sistema é organizado

Doc 3 — begin/WBC-Implementacao-v1.0.md
  Propósito: Schema Prisma completo, domain events, rotas tRPC
  Quando consultar: base para o CÓDIGO — entities, relationships, endpoints

Doc 4 — begin/WBC_REGRAS_INVIOLAVEIS.md
  Propósito: Contrato de execução (regras que NUNCA podem ser violadas)
  Quando consultar: SEMPRE. Ler ANTES de cada épico.

Doc 5 — begin/WBC_FASES_E_EPICOS.md
  Propósito: Roadmap executável — fases, épicos, DoD
  Quando consultar: saber O QUE fazer em cada épico

Doc 6 — begin/WBC_GERADOR_DE_PROMPTS.md
  Propósito: Regras e template para geração de prompts de implementação
  Quando consultar: modo ARQUITETO, ao gerar prompts de cada fase

Doc 7 — begin/WBC_SUPERMEMORY_SETUP.md
  Propósito: Este documento — configuração de contexto persistente
  Quando consultar: apenas no setup inicial

Doc 8 — begin/WBC_BOOTSTRAP_PROMPT.md
  Propósito: Criação do monorepo do zero (17 tasks)
  Quando consultar: apenas no setup inicial

Doc 9 — begin/WBC_ORCHESTRATOR.md
  Propósito: Maestro — único ponto de entrada para execução autônoma
  Quando consultar: documento principal de execução

O prompt gerado de cada épico é a fonte de verdade para execução.
Os docs acima são referência para o ARQUITETO gerar os prompts.
O EXECUTOR lê APENAS o prompt do épico + regras invioláveis.
```

---

## TASK 11 — Verificação Final

Após gravar todas as tasks no SuperMemory, execute:

```bash
# Verificar que o SuperMemory retém as informações
# Consultar cada bloco e confirmar que retorna os dados gravados

echo "Verificando SuperMemory..."
echo "1. Identidade: WBC Platform — Wave Beauty Consultant"
echo "2. Stack: TypeScript, Next.js, tRPC, Prisma, React Native"
echo "3. Arquitetura: Hexagonal, 15 módulos, multi-tenant RLS"
echo "4. Módulos: auth, clients, catalog, sales, campaigns, messaging, ai, inventory, finance, schedule, team, analytics, logistics, landing, platform"
echo "5. i18n: pt-BR + en, next-intl, ZERO hardcoded"
echo "6. Git: Conventional Commits, sem gates entre épicos"
echo "7. Agent: Dangerous Mode, sequencial, NUNCA parar"
echo "8. Transitions: task→task, épico→merge→épico, fase→checkpoint→fase"
echo "9. Docs: 9 documentos de referência em begin/"
echo ""
echo "✅ SuperMemory configurado. Pronto para Bootstrap."
echo ""
echo "PRÓXIMO PASSO: Executar begin/WBC_BOOTSTRAP_PROMPT.md"
echo "NÃO PARE. PROSSIGA IMEDIATAMENTE."
```

---

**Após esta configuração, o agente deve prosseguir IMEDIATAMENTE para o begin/WBC_BOOTSTRAP_PROMPT.md. Sem pausa. Sem confirmação.**
