# WBC — Fase 9: UI/UX Redesign — Pacote de Integração na Pipeline

**Objetivo:** Encaixar a Fase 9 (UI/UX Redesign) na pipeline de orquestração autônoma existente.
**Contexto:** O projeto completou Fases 1-7 (BUILD_COMPLETE v1.0.0) e Fase 8 (engorda backend, v1.2.0). A Fase 9 aplica o novo Design System documentado em `begin/WBC-UI-UX-Design-System-v1.0.md`.

Este arquivo contém TUDO que precisa ser atualizado/adicionado. Dividido em 5 seções.

---

# SEÇÃO 1 — Colar no final do WBC_FASES_E_EPICOS.md (antes do RESUMO)

Cole este bloco ANTES da seção `# RESUMO` no arquivo `begin/WBC_FASES_E_EPICOS.md`:

```markdown
# FASE 9 — UI/UX REDESIGN (Design System + Telas Completas)

> **Objetivo:** Aplicar o novo Design System completo (4 temas, tipografia Sora, 17 componentes, navegação, microinterações) substituindo a UI básica da Fase 6. Redesenhar TODAS as telas mobile e web conforme especificação pixel-perfect.
> **Depende de:** Fase 8 completa (v1.2.0)
> **Épicos:** 10 (9 de implementação + 1 checkpoint)
> **Doc de referência obrigatório:** begin/WBC-UI-UX-Design-System-v1.0.md — o ARQUITETO DEVE ler este documento INTEIRO antes de gerar prompts desta fase.

---

### F9.E01 — Design System: Tokens + Theme Provider

**Descrição:** Implementar todos os design tokens (cores, tipografia, espaçamento, radius, bordas) e o sistema de 4 temas (Padrão Light, Padrão Dark, Rose Quartz Light, Rose Quartz Dark) com troca dinâmica.

**Referência:** [Doc UI/UX §1, §2, §3, §4]

**Ações:**
- Substituir tokens de cor no tailwind.config.ts por CSS custom properties dos 4 temas
- Implementar CSS com `[data-theme="default"][data-mode="light"]`, `[data-theme="default"][data-mode="dark"]`, `[data-theme="rose"][data-mode="light"]`, `[data-theme="rose"][data-mode="dark"]`
- Cores semânticas compartilhadas (success, warning, danger, info) com variações light/dark
- Cores de classificação ABC
- Tipografia: carregar Sora (Google Fonts) como fonte principal, Azonix para logo/display
- Escala tipográfica: heading-1 a overline com sizes, weights e line-heights exatos
- Regras tipográficas: max 2 weights (400, 500), nunca 600+, sentence case, tabular-nums
- Espaçamento: escala 4px base (4, 8, 12, 16, 20, 24, 32, 48)
- Border radius: sm (6px), md (10px), lg (12px), xl (16px), full (9999px)
- Bordas: 0.5px padrão, focus ring 2px solid primary
- Sombras: sem box-shadow decorativo (apenas focus ring e segmented control)
- Theme provider React com contexto + persistência (localStorage web, Zustand mobile)
- Toggle de tema funcional (4 combinações)
- Mobile: NativeWind com mesmos tokens via Tailwind config compartilhado

**Dependências:** F6 (UI base existente), F8 (backend estabilizado)

**DoD:**
- [ ] 4 temas funcionando com troca dinâmica
- [ ] Todos os tokens de cor via CSS custom properties
- [ ] Fonte Sora carregada e aplicada
- [ ] Escala tipográfica implementada
- [ ] Tailwind config atualizado com todos os tokens
- [ ] Theme provider funcional (web + mobile)

---

### F9.E02 — Design System: Componentes Base

**Descrição:** Implementar os 17 componentes do Design System em `packages/ui/`, substituindo os componentes básicos da Fase 6.

**Referência:** [Doc UI/UX §5]

**Ações:**
- Button: 6 variantes (Primary, Secondary, Outline, Ghost, Danger, Success) × 4 tamanhos (LG, MD, SM, XS) + Icon Button
- Input: 40px height, 4 estados (resting, focus, error, disabled), labels obrigatórios, helper text
- Search Bar: bg secondary, sem borda, 38px, ícone lupa, sempre visível em listas
- Cards: Elevated (com borda), Flat/Metric (sem borda, bg secondary), Action Card (borda lateral colorida por prioridade)
- Badges: status retangulares (6px radius) com combinações de cor por status
- Tags: pills (radius-full) para etiquetas de cliente e marcas
- Avatares: 3 tamanhos (SM 28px, MD 36px, LG 48px), cores por classificação ABC
- Segmented Control: container bg secondary, item ativo com shadow, 11px font
- Filter Chips: horizontal scroll, dot colorido, estado ativo com primary-surface
- Toggle Switch: 36×20px track, 16×16px knob, transição 200ms
- Progress Bar: 6px track, variantes de cor (primary, success, warning, danger)
- Lista de Itens: avatar 38px + info + right content, separador 0.5px
- Timeline: linha vertical 1px, dots 8×8px coloridos por tipo de evento
- Empty State: ícone 48×48px + título + descrição + CTA
- Alert/Banner: 4 variantes (IA, success, warning, danger), radius-md
- Action Sheet: bottom sheet com handle 40×4px, itens com ícone 32×32px
- Step Indicator: dots 3px height, ativo 36px width, inativo 24px
- Funil Visual: barras horizontais proporcionais com degradê de cores
- Todos os componentes com i18n (zero strings hardcoded)
- Todos os componentes usando tokens do tema (nunca hex direto)

**Dependências:** F9.E01 (tokens e theme provider)

**DoD:**
- [ ] 17 componentes implementados em packages/ui/
- [ ] Todos usam CSS custom properties (theme-aware)
- [ ] Todos com i18n
- [ ] Exports no barrel file de packages/ui/

---

### F9.E03 — Navegação + Layout

**Descrição:** Implementar a estrutura de navegação mobile (bottom nav + FAB + menu hub) e web (sidebar + top bar), substituindo o layout básico da Fase 6.

**Referência:** [Doc UI/UX §7]

**Ações:**
- Mobile Bottom Nav: 5 posições (Meu Dia, Clientes, FAB central, Vendas, Menu)
- FAB: 48×48px circle primary, ícone +, posição 24px acima da bar
- Action Sheet do FAB: 5 ações (Nova venda, Nova cliente, Enviar mensagem, Nova campanha, Pedir pra IA)
- Tela Menu (hub): header perfil + banner IA + 6 grupos grid 3×3 (Comunicação, Produtos, Planejamento, Equipe condicional, Meu Negócio, Configurações)
- Grid items: 36×36px ícone container, radius-lg, bg secondary, label 10px
- Web Sidebar: 220px expandida, 64px collapsed, 6 grupos com dots coloridos
- Web Top Bar: 56px height, bg primary, avatar + nome + plano + notificações + theme toggle
- Transições: push 300ms slide, pop 250ms slide, modal slide-up, tab fade 150ms
- Sidebar responsive: collapsed por padrão < 1024px, oculta < 768px (hamburger)

**Dependências:** F9.E01 (tokens), F9.E02 (componentes base)

**DoD:**
- [ ] Bottom nav mobile com 5 tabs + FAB funcional
- [ ] Action sheet do FAB com 5 ações
- [ ] Menu hub com 6 grupos
- [ ] Sidebar web collapsible com 6 grupos
- [ ] Top bar web funcional
- [ ] Transições implementadas

---

### F9.E04 — Telas Mobile: Meu Dia + Clientes

**Descrição:** Redesenhar as telas de home (Meu Dia) e clientes (lista + perfil) conforme specs.

**Referência:** [Doc UI/UX §8.1, §8.2, §8.3]

**Ações:**
- Meu Dia: greeting contextual + stats row (3 flat cards) + banner gamificação + quick actions chips + 4 seções com action cards (Urgente vermelho, Lembretes âmbar, Aniversários verde, Agenda azul)
- Dados: schedule.getMyDay, analytics.getDashboard, analytics.getGoalProgress
- Clientes Lista: header + search bar + segmented control (Todas/Ativas/Leads/Inativas) + filter chips etiquetas + resumo ABC (4 cards) + lista com avatar classificação + badges inline
- Cliente Perfil: avatar LG + action strip (4 botões) + stats grid 3×2 + card alergia condicional + card cashback condicional + notas editáveis + timeline + lista desejos + perfil beleza
- Dados: clients.list, clients.getById, sales.getCashbackBalance

**Dependências:** F9.E02 (componentes), F9.E03 (navegação)

**DoD:**
- [ ] Meu Dia com dados reais das APIs
- [ ] Action cards com botões que abrem WhatsApp
- [ ] Lista de clientes com filtros e busca
- [ ] Perfil de cliente completo com todas as seções
- [ ] i18n em todas as labels

---

### F9.E05 — Telas Mobile: Vendas + Financeiro

**Descrição:** Redesenhar fluxo de nova venda (4 steps), lista de vendas, e tela financeira.

**Referência:** [Doc UI/UX §8.4, §8.5, §8.6]

**Ações:**
- Nova Venda Step 1: search + lista clientes com radio + "Venda avulsa" + cashback info
- Nova Venda Step 2: search produto + filter chips marca + grid produtos com qty control + cart summary fixo
- Nova Venda Step 3: card cashback checkbox + desconto (valor/percentual) + 3 formas pagamento (PIX, Parcelado com chips parcelas, Dinheiro) + resumo
- Nova Venda Step 4: confirm card completo + método entrega (4 chips) + toggles WhatsApp e pós-venda + 2 botões (rascunho/confirmar) + margem estimada
- Pós-confirmação: animação sucesso + opções
- Step indicator: 4 dots (3px height, ativo 36px, inativo 24px)
- Vendas Lista: stats row + segmented control + lista + tabs secundárias (Vendas/Financeiro/Entregas/Estoque)
- Financeiro: period selector chips + stats grid 4 cards + contas a receber + despesas CRUD + calculadoras

**Dependências:** F9.E02, F9.E03

**DoD:**
- [ ] Fluxo de nova venda 4 steps completo
- [ ] Animação de sucesso pós-confirmação
- [ ] Lista de vendas com filtros
- [ ] Financeiro com stats reais e calculadoras

---

### F9.E06 — Telas Mobile: Campanhas + Catálogo + Estoque + Agenda + Equipe + Landing + Settings

**Descrição:** Redesenhar todas as telas secundárias do mobile.

**Referência:** [Doc UI/UX §8.7 a §8.15]

**Ações:**
- Campanhas: lista cards + criação multi-step + estatísticas com funil visual + botão IA para geração
- Catálogo: brand chips + category chips + grid 2 colunas com thumbnails + toggle grid/list
- Estoque: segmented control (Todos/Baixo/Zero) + lista com badges + ajuste inline + pedidos à marca + amostras
- Agenda: toggle view (Dia/Semana/Mês) + calendário mini + timeline eventos + FAB local + criação bottom sheet
- Equipe (condicional Leader+): segmented (Equipe/Ranking/Tarefas) + lista membros + ranking com barras + tarefas com aprovar inline
- Landing Page Editor: preview + formulário + toggle ativar + link com copiar/compartilhar
- Configurações Tema: 2 opções cor (Padrão/Rose) + toggle dark + select idioma + preview ao vivo

**Dependências:** F9.E02, F9.E03

**DoD:**
- [ ] Todas as telas secundárias redesenhadas
- [ ] Funil visual de campanhas funcional
- [ ] Equipe condicional por role
- [ ] Preview de tema ao vivo
- [ ] i18n em todas as labels

---

### F9.E07 — Tela Mobile: Onboarding Wizard 5 Steps

**Descrição:** Implementar o wizard de onboarding para novos usuários.

**Referência:** [Doc UI/UX §8.16]

**Ações:**
- Step 1 — Bem-vinda + Marca: ilustração + multi-select marcas
- Step 2 — Perfil e Foto: upload avatar + nome + telefone pré-preenchido + slug landing page
- Step 3 — Importar Contatos: 3 opções com ícones (WhatsApp, planilha, manual)
- Step 4 — Configurar Lembretes: toggles reposição + pós-venda 2+2+2 + campo ciclo padrão
- Step 5 — Primeira Venda Guiada: fluxo simplificado com tooltips/hints + dados exemplo + animação celebração
- Step indicator no topo (5 dots)
- Aparece no primeiro login, antes da home
- Ao concluir: marca onboarding como completo via platform.completeStep

**Dependências:** F9.E04 (componentes de venda reutilizados no step 5)

**DoD:**
- [ ] 5 steps funcionais
- [ ] Dados salvos a cada step
- [ ] Primeira venda guiada com tooltips
- [ ] Animação de celebração no final
- [ ] Redireciona pra Meu Dia ao concluir

---

### F9.E08 — Telas Web: Redesign Completo

**Descrição:** Redesenhar todas as telas web conforme specs, usando o grid de 12 colunas e o padrão tabela + sidebar de detalhe.

**Referência:** [Doc UI/UX §9]

**Ações:**
- Dashboard: grid 12 col, greeting + 4 stat cards + gráfico vendas (Recharts line chart 30 dias) + top 5 produtos + atividades hoje + campanhas ativas + clientes atenção
- Clientes: tabela sortável (7 colunas) + filtros topo + bulk actions + sidebar detalhe à direita
- Vendas: tabela (8 colunas) + sidebar detalhe + nova venda modal multi-step
- Campanhas: cards grid ou tabela (toggle view) + card expandido stats + nova campanha editor + estatísticas com gráficos funil
- Financeiro: 4 stat cards + gráfico receita vs despesas (bar chart 6 meses) + tabela contas a receber com ações inline + tabela despesas CRUD + calculadoras sidepanel
- Demais telas: padrão tabela/grid centro + sidebar detalhe direita + filtros topo
- Todos os tamanhos ajustados para desktop (inputs 44px, cards com mais padding)
- Breakpoints aplicados conforme Doc UI/UX §11

**Dependências:** F9.E01 a F9.E03

**DoD:**
- [ ] Dashboard web com dados reais e gráficos
- [ ] Clientes com tabela sortável e sidebar detalhe
- [ ] Vendas com fluxo completo
- [ ] Todas as telas web redesenhadas
- [ ] Responsive em todos os breakpoints

---

### F9.E09 — Polish: Microinterações + Responsividade + Acessibilidade

**Descrição:** Camada final de qualidade: loading states, feedback, haptic, responsividade e acessibilidade.

**Referência:** [Doc UI/UX §10, §11, §12]

**Ações:**
- Loading: skeleton screens (shimmer) em vez de spinners em toda data async
- Pull-to-refresh mobile com indicador circular
- Infinite scroll com skeleton de 3 itens no final
- Feedback de ações: toast success/info/danger com posição topo, duração 3s/5s, slide+fade
- Botão loading: spinner inline dentro do botão (não desabilita)
- Botão success: check icon por 1.5s
- Confirmações destrutivas: modal "Tem certeza?" com consequência + 2 botões
- Haptic feedback mobile: light impact (toggle, button), medium impact (pull-to-refresh, FAB), notification error (ação destrutiva)
- Breakpoints: < 640px (mobile), 640-768px (grid 2 col), 768-1024px (sidebar collapsed), 1024-1280px (sidebar expandida, max-width 1000px), > 1280px (grids 3-4 col, max-width 1200px)
- Acessibilidade WCAG AA: contraste 4.5:1, touch targets 44×44px, labels em todos inputs, states visuais não dependem só de cor, prefers-reduced-motion, screen reader labels, focus ring visível

**Dependências:** F9.E04 a F9.E08 (todas as telas implementadas)

**DoD:**
- [ ] Skeleton screens em toda data async
- [ ] Toasts funcionais com animação
- [ ] Haptic feedback no mobile
- [ ] Responsive em todos os breakpoints
- [ ] Contraste WCAG AA verificado nos 4 temas
- [ ] Touch targets mínimos respeitados

---

### F9.E10 — Checkpoint Fase 9

> **⚠️ CHECKPOINT — NÃO é épico de implementação.**
> O Orchestrator NÃO gera prompt para checkpoints. Executa type-check + tag diretamente em main.
> NÃO criar branch para checkpoints.

**Ações:**
```bash
git checkout main
pnpm install
pnpm type-check
# Se falhar: corrigir, max 3 tentativas, depois BLOCKED
git tag v1.3.0-fase-09
```

**DoD:**
- [ ] type-check passa com zero erros
- [ ] Tag v1.3.0-fase-09 criada
- [ ] STATE.json atualizado (phase 9 = COMPLETED)
```

---

# SEÇÃO 2 — Atualizar tabela RESUMO no WBC_FASES_E_EPICOS.md

Substituir a tabela RESUMO existente por:

```markdown
# RESUMO

| Fase | Nome | Épicos (impl + checkpoint) | Tag |
|------|------|---------------------------|-----|
| 1 | Fundação | 7 + 1 = 8 | v0.2.0-fase-01 |
| 2 | Core de Negócio | 9 + 1 = 10 | v0.3.0-fase-02 |
| 3 | Comunicação | 8 + 1 = 9 | v0.4.0-fase-03 |
| 4 | Agenda & Schedule | 3 + 1 = 4 | v0.5.0-fase-04 |
| 5 | Diferenciadores | 7 + 1 = 8 | v0.6.0-fase-05 |
| 6 | UI Completa | 7 + 1 = 8 | v0.7.0-fase-06 |
| 7 | Testes + QA + Lançamento | 6 (sem checkpoint) | v1.0.0 |
| 8 | Engorda Backend | 2 (sem checkpoint) | v1.2.0 |
| 9 | UI/UX Redesign | 9 + 1 = 10 | v1.3.0-fase-09 |

**Total: 9 fases, ~65 épicos**

> **NOTA SOBRE CHECKPOINTS:** O último épico de cada fase (Fases 1–6, 9) é um CHECKPOINT.
> Checkpoints NÃO são épicos de implementação. O Orchestrator NÃO gera prompt para eles.
> O Orchestrator executa o procedimento de checkpoint diretamente: type-check + tag em main.
```

---

# SEÇÃO 3 — STATE.json para iniciar Fase 9

O agente precisa receber este STATE.json atualizado ANTES de iniciar:

```json
{
  "version": 1,
  "project": "WBC Platform",
  "current_phase": 9,
  "current_epic": "F9.E01",
  "current_task": 0,
  "current_mode": "ARCHITECT",
  "status": "IN_PROGRESS",
  "branch": "main",
  "history": [
    { "epic": "F1.E01-E07", "status": "COMPLETED" },
    { "epic": "F1.E08", "status": "COMPLETED", "type": "CHECKPOINT" },
    { "epic": "F2.E01-E09", "status": "COMPLETED" },
    { "epic": "F2.E10", "status": "COMPLETED", "type": "CHECKPOINT" },
    { "epic": "F3.E01-E08", "status": "COMPLETED" },
    { "epic": "F3.E09", "status": "COMPLETED", "type": "CHECKPOINT" },
    { "epic": "F4.E01-E03", "status": "COMPLETED" },
    { "epic": "F4.E04", "status": "COMPLETED", "type": "CHECKPOINT" },
    { "epic": "F5.E01-E07", "status": "COMPLETED" },
    { "epic": "F5.E08", "status": "COMPLETED", "type": "CHECKPOINT" },
    { "epic": "F6.E01-E07", "status": "COMPLETED" },
    { "epic": "F6.E08", "status": "COMPLETED", "type": "CHECKPOINT" },
    { "epic": "F7.E01-E06", "status": "COMPLETED" },
    { "epic": "F8.E01-E02", "status": "COMPLETED" }
  ],
  "phase_summary": {
    "phase_1": { "status": "COMPLETED", "tag": "v0.2.0-fase-01" },
    "phase_2": { "status": "COMPLETED", "tag": "v0.3.0-fase-02" },
    "phase_3": { "status": "COMPLETED", "tag": "v0.4.0-fase-03" },
    "phase_4": { "status": "COMPLETED", "tag": "v0.5.0-fase-04" },
    "phase_5": { "status": "COMPLETED", "tag": "v0.6.0-fase-05" },
    "phase_6": { "status": "COMPLETED", "tag": "v0.7.0-fase-06" },
    "phase_7": { "status": "COMPLETED", "tag": "v1.0.0" },
    "phase_8": { "status": "COMPLETED", "tag": "v1.2.0" }
  },
  "started_at": "2026-03-20T19:30:00Z",
  "last_updated": null
}
```

---

# SEÇÃO 4 — Atualizações nos outros documentos de orquestração

### 4.1 — WBC_ORCHESTRATOR.md

**No header (pré-requisitos), adicionar:**
```
> - Doc de UI/UX em begin/: WBC-UI-UX-Design-System-v1.0.md
```

**Na tabela da Seção 9 (FASES), adicionar linhas:**
```
| 8 | Engorda Backend | 2 (sem checkpoint) | v1.2.0 | — |
| 9 | UI/UX Redesign | 9 + 1 = 10 | v1.3.0-fase-09 | F9.E10 |
```

**Na Seção 6 (Checkpoints por fase), adicionar:**
```
| 9 | F9.E10 | v1.3.0-fase-09 |
```

### 4.2 — WBC_GERADOR_DE_PROMPTS.md

**Na tabela DOCUMENTOS FONTE, adicionar linha:**
```
| `begin/WBC-UI-UX-Design-System-v1.0.md` | Design system, temas, componentes, telas, specs pixel-perfect | Base para UI — obrigatório na Fase 9 |
```

### 4.3 — WBC_SUPERMEMORY_SETUP.md

**Na TASK 10 (docs de referência), adicionar:**
```
Doc 10 — begin/WBC-UI-UX-Design-System-v1.0.md
  Propósito: Design system completo — 4 temas, tipografia, 17 componentes, 16 telas mobile, 7 telas web, microinterações
  Quando consultar: Fase 9 — UI/UX Redesign. O ARQUITETO DEVE ler este documento INTEIRO antes de gerar prompts.
```

---

# SEÇÃO 5 — Checklist de execução (ordem)

1. [ ] Copiar `WBC-UI-UX-Design-System-v1.0.md` para `begin/` no repo
2. [ ] Atualizar `begin/WBC_FASES_E_EPICOS.md` — colar Fase 9 + atualizar RESUMO (Seções 1 e 2)
3. [ ] Atualizar `begin/WBC_ORCHESTRATOR.md` — header, tabela fases, tabela checkpoints (Seção 4.1)
4. [ ] Atualizar `begin/WBC_GERADOR_DE_PROMPTS.md` — tabela docs fonte (Seção 4.2)
5. [ ] Atualizar `begin/WBC_SUPERMEMORY_SETUP.md` — TASK 10 (Seção 4.3)
6. [ ] Atualizar `prompts/STATE.json` com o conteúdo da Seção 3
7. [ ] Commitar tudo: `git add -A && git commit -m "docs: add Phase 9 UI/UX Redesign to pipeline"`
8. [ ] Dar o prompt do Orchestrator pro Claude Code
9. [ ] Ele lê STATE.json → vê Fase 9, modo ARCHITECT → lê Fase 9 no FASES_E_EPICOS → lê UI/UX doc → gera prompts → executa → checkpoint → v1.3.0-fase-09
