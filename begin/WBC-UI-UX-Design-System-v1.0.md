# WBC — UI/UX Design System & Screen Specifications

**Projeto:** Wave Beauty Consultant (WBC)
**Empresa:** Weave Code UK
**Versão:** 1.0
**Data:** 21/03/2026
**Tipo:** Documento de referência para implementação de UI/UX
**Stack UI:** Tailwind CSS + shadcn/ui (Web), NativeWind (Mobile), Lucide Icons
**Fontes:** Sora (principal), Azonix (display/logo), Nexa + Montserrat (secundárias)

---

## 1. Fundação do Design System

### 1.1 Filosofia de Design

O WBC é usado por consultoras de beleza brasileiras que trabalham pelo celular entre visitas, eventos e entregas. Toda decisão de design segue três princípios:

- **Máximo 2 toques para qualquer ação frequente.** Nova venda, enviar mensagem, registrar cliente — tudo deve estar a 2 interações da tela inicial.
- **Profundidade sem sobrecarga.** 105 funcionalidades organizadas em camadas progressivas. A consultora vê o essencial no primeiro nível e descobre o avançado conforme precisa.
- **A consultora pensa em ações, não em módulos.** A navegação reflete jornadas de uso ("preciso cobrar a Maria"), não arquitetura técnica ("módulo de messaging").

### 1.2 Público-Alvo (Persona)

- Consultora de beleza (Mary Kay, Natura, Avon, Jequiti, Boticário)
- Idade: 25-50 anos
- Dispositivo principal: celular (Android e iOS)
- Contexto de uso: entre visitas, em transporte, em eventos de beleza
- Nível técnico: básico a intermediário
- Canal principal de comunicação: WhatsApp

---

## 2. Paleta de Cores — 4 Temas

O WBC oferece uma matriz 2×2 de temas. A consultora escolhe a combinação preferida. Implementação via CSS custom properties no root/provider.

### 2.1 Tema 1 — Padrão Light

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-primary` | `#8127E8` | Botões primários, links, ícones ativos, barra de navegação ativa |
| `--color-primary-hover` | `#9F5AED` | Hover de botões primários |
| `--color-primary-surface` | `#EDE5FB` | Background de cards de destaque, chips selecionados |
| `--color-primary-surface-hover` | `#DDD6FE` | Hover de superfícies primárias |
| `--color-accent` | `#240B33` | Uso superficial: tooltips, dividers especiais, texto de peso máximo sobre fundo claro. Máximo 5% da superfície visual |
| `--color-bg-primary` | `#FFFFFF` | Background principal de cards, modais, inputs |
| `--color-bg-secondary` | `#F3F4F6` | Background de áreas, stat cards, menu items |
| `--color-bg-tertiary` | `#F9FAFB` | Background da página/tela |
| `--color-text-primary` | `#111827` | Títulos, valores, texto de destaque |
| `--color-text-secondary` | `#4A4A4A` | Texto de corpo, descrições |
| `--color-text-tertiary` | `#6B7280` | Labels, captions, placeholders, timestamps |
| `--color-border-primary` | `#D1D5DB` | Bordas de inputs em foco |
| `--color-border-secondary` | `#E5E7EB` | Bordas de cards, inputs em repouso |
| `--color-border-tertiary` | `#F3F4F6` | Dividers, separadores de lista |

### 2.2 Tema 2 — Padrão Dark

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-primary` | `#9F5AED` | Botões primários (mais claro para contraste) |
| `--color-primary-hover` | `#B07CF0` | Hover |
| `--color-primary-surface` | `#1E1232` | Superfícies de destaque |
| `--color-accent` | `#240B33` | Superfícies secundárias de destaque |
| `--color-bg-primary` | `#130E1F` | Background principal (preto com subtom roxo) |
| `--color-bg-secondary` | `#1A1128` | Background de cards |
| `--color-bg-tertiary` | `#0F0A1A` | Background da página |
| `--color-text-primary` | `#F3F4F6` | Texto principal |
| `--color-text-secondary` | `#D1D5DB` | Texto secundário |
| `--color-text-tertiary` | `#9CA3AF` | Labels, captions |
| `--color-border-primary` | `#4B3A6B` | Bordas em foco |
| `--color-border-secondary` | `#2D2640` | Bordas padrão |
| `--color-border-tertiary` | `#1E1830` | Dividers |

### 2.3 Tema 3 — Rose Quartz Light

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-primary` | `#E91E8C` | Botões primários, links, ícones ativos |
| `--color-primary-hover` | `#F472B6` | Hover |
| `--color-primary-surface` | `#FDF2F8` | Superfícies de destaque |
| `--color-primary-surface-hover` | `#FBCFE8` | Hover de superfícies |
| `--color-accent` | `#831843` | Texto de peso sobre fundo rosa |
| `--color-bg-primary` | `#FFFFFF` | Background principal |
| `--color-bg-secondary` | `#FDF2F8` | Background de áreas |
| `--color-bg-tertiary` | `#FFFBFC` | Background da página |
| `--color-text-primary` | `#1F1115` | Texto principal |
| `--color-text-secondary` | `#6B4555` | Texto secundário |
| `--color-text-tertiary` | `#9D7A8A` | Labels, captions |
| `--color-border-primary` | `#F9A8D4` | Bordas em foco |
| `--color-border-secondary` | `#F3E0E6` | Bordas padrão |
| `--color-border-tertiary` | `#FDF2F8` | Dividers |

### 2.4 Tema 4 — Rose Quartz Dark

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-primary` | `#F472B6` | Botões primários |
| `--color-primary-hover` | `#F9A8D4` | Hover |
| `--color-primary-surface` | `#2D1422` | Superfícies de destaque |
| `--color-accent` | `#831843` | Accent elements |
| `--color-bg-primary` | `#1A0D14` | Background principal (preto com subtom rosado) |
| `--color-bg-secondary` | `#2D1422` | Background de cards |
| `--color-bg-tertiary` | `#150A10` | Background da página |
| `--color-text-primary` | `#F3F4F6` | Texto principal |
| `--color-text-secondary` | `#D1D5DB` | Texto secundário |
| `--color-text-tertiary` | `#9CA3AF` | Labels, captions |
| `--color-border-primary` | `#6B2340` | Bordas em foco |
| `--color-border-secondary` | `#3D1F2E` | Bordas padrão |
| `--color-border-tertiary` | `#2D1422` | Dividers |

### 2.5 Cores Semânticas (Compartilhadas)

Estas cores são idênticas nos 4 temas, apenas invertendo intensidade entre light e dark.

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `--color-success` | `#059669` | `#6EE7B7` | Pago, ativo, positivo |
| `--color-success-bg` | `#ECFDF5` | `#064E3B` | Background success |
| `--color-success-text` | `#065F46` | `#6EE7B7` | Texto sobre bg success |
| `--color-warning` | `#D97706` | `#FCD34D` | Pendente, atenção |
| `--color-warning-bg` | `#FEF3C7` | `#78350F` | Background warning |
| `--color-warning-text` | `#92400E` | `#FCD34D` | Texto sobre bg warning |
| `--color-danger` | `#DC2626` | `#FCA5A5` | Atrasado, erro, urgente |
| `--color-danger-bg` | `#FEE2E2` | `#7F1D1D` | Background danger |
| `--color-danger-text` | `#991B1B` | `#FCA5A5` | Texto sobre bg danger |
| `--color-info` | `#2563EB` | `#93C5FD` | Informativo, links |
| `--color-info-bg` | `#E6F1FB` | `#1E3A5F` | Background info |
| `--color-info-text` | `#1E40AF` | `#93C5FD` | Texto sobre bg info |

### 2.6 Cores de Classificação ABC

| Classificação | Cor | Background | Significado |
|---------------|-----|------------|-------------|
| A (Top) | `#059669` | `#ECFDF5` | Melhores clientes: alta frequência e alto valor |
| B (Regular) | `#D97706` | `#FEF3C7` | Clientes regulares: frequência e valor medianos |
| C (Esporádica) | `#6B7280` | `#F3F4F6` | Clientes esporádicos: baixa frequência |

### 2.7 Nota sobre o Laranja (#FF6600)

A cor laranja do manual da marca WeaveCode NÃO é utilizada na interface do WBC. Se absolutamente necessário em algum contexto futuro, deve ser limitada a micro-detalhes decorativos (nunca em botões, backgrounds, ou elementos estruturais).

---

## 3. Tipografia

### 3.1 Escala Tipográfica

| Token | Size | Weight | Line-height | Uso |
|-------|------|--------|-------------|-----|
| `heading-1` | 24px | 500 (Medium) | 1.3 | Títulos de página. Máximo 1 por tela |
| `heading-2` | 18px | 500 | 1.3 | Seções dentro de uma página |
| `heading-3` | 15px | 500 | 1.4 | Cards, grupos, sub-seções |
| `body` | 14px | 400 (Regular) | 1.5 | Texto principal, parágrafos, descrições |
| `body-small` | 13px | 400 | 1.5 | Texto secundário, campos de formulário, itens de lista |
| `caption` | 11px | 400 | 1.4 | Helpers, timestamps, labels de input, metadata |
| `overline` | 10px | 500 | 1.2 | Section headers em maiúsculas. Letter-spacing: 0.5px |

### 3.2 Famílias de Fonte

- **Principal:** Sora (Google Fonts) — usada em toda a interface
- **Display/Logo:** Azonix — apenas na logo e splash screen
- **Fallback web:** `system-ui, -apple-system, sans-serif`
- **Fallback mobile:** sistema nativo (SF Pro no iOS, Roboto no Android)
- **Monospace (código/dados):** `'SF Mono', 'Fira Code', monospace`

### 3.3 Regras Tipográficas

- Tamanho mínimo: 10px (apenas para overline). Nunca menor.
- Máximo 2 weights na mesma tela: 400 (regular) e 500 (medium).
- Nunca usar 600 ou 700 — muito pesado para a estética do app.
- Títulos: sempre sentence case. Nunca Title Case, nunca ALL CAPS (exceto overline).
- Números financeiros: sempre font-variant-numeric: tabular-nums para alinhamento.

---

## 4. Espaçamento e Layout

### 4.1 Escala de Espaçamento

Base unit: 4px. Escala: 4, 8, 12, 16, 20, 24, 32, 48.

| Token | Valor | Uso |
|-------|-------|-----|
| `space-1` | 4px | Gap mínimo entre ícone e texto |
| `space-2` | 8px | Gap entre badges, gap interno de chips |
| `space-3` | 12px | Gap entre cards em grid, padding interno de stats |
| `space-4` | 16px | Margens laterais mobile, padding interno de cards |
| `space-5` | 20px | Espaço entre seções menores |
| `space-6` | 24px | Margens laterais web, gap entre seções |
| `space-8` | 32px | Espaço entre blocos maiores |
| `space-12` | 48px | Margem superior de página, espaço de respiro |

### 4.2 Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `radius-sm` | 6px | Badges, chips pequenos, step indicators |
| `radius-md` | 10px | Botões, inputs, action cards, menu items |
| `radius-lg` | 12px | Cards, modais, containers |
| `radius-xl` | 16px | Cards de destaque, banners |
| `radius-full` | 9999px | Pills, avatares, FAB, tags |

### 4.3 Bordas

- Espessura padrão: 0.5px (visual refinado)
- Cor padrão: `--color-border-secondary`
- Focus ring: 2px solid `--color-primary` com box-shadow 0 0 0 2px `--color-primary-surface`
- Bordas laterais de prioridade: 3px solid (vermelho=urgente, âmbar=atenção, azul=info, verde=positivo)

### 4.4 Sombras

O WBC não usa box-shadow decorativo. Exceções:

- Focus ring em inputs: `box-shadow: 0 0 0 2px var(--color-primary-surface)`
- Segmented control ativo: `box-shadow: 0 1px 2px rgba(0,0,0,0.06)`

---

## 5. Componentes

### 5.1 Botões

**Variantes:**

| Variante | Background | Texto | Borda | Uso |
|----------|------------|-------|-------|-----|
| Primary | `--color-primary` | `#FFFFFF` | none | Ação principal: "Nova venda", "Confirmar" |
| Secondary | `--color-primary-surface` | `--color-primary` | none | Ação secundária: "Filtrar", "Editar" |
| Outline | transparent | `--color-text-primary` | 0.5px `--color-border-secondary` | Ações neutras: "Cancelar", "Voltar" |
| Ghost | transparent | `--color-primary` | none | Ações inline: "Ver mais", "Ver tudo" |
| Danger | `--color-danger-bg` | `--color-danger-text` | none | Ações destrutivas: "Excluir", "Cancelar venda" |
| Success | `--color-success-bg` | `--color-success-text` | none | Ações positivas: "Pago", "Confirmar campanha" |

**Tamanhos:**

| Tamanho | Height | Padding H | Font-size | Uso |
|---------|--------|-----------|-----------|-----|
| LG | 48px | 24px | 15px | CTAs full-width, ação principal da página |
| MD | 40px | 18px | 13px | Padrão geral |
| SM | 32px | 14px | 12px | Ações inline, dentro de cards |
| XS | 26px | 10px | 11px | Badges interativas, ações mínimas |

**Icon Button:** 40×40px, radius-md, borda 0.5px. Variante filled: bg primary, ícone branco.

**Regras:**
- Nunca mais que 2 botões lado a lado.
- Botão primário sempre à direita ou na posição de maior peso visual.
- Em fluxos multi-step, o botão de avanço é primary e o de voltar é outline ou ghost.
- Border-radius: radius-md (10px) para todos os tamanhos.

### 5.2 Inputs

- Height: 40px
- Border-radius: radius-md (10px)
- Padding horizontal: 12px
- Font-size: 13px
- Background: `--color-bg-primary`
- Border: 0.5px solid `--color-border-secondary`

**Estados:**

| Estado | Borda | Shadow | Label color |
|--------|-------|--------|-------------|
| Resting | `--color-border-secondary` | none | `--color-text-secondary` |
| Focus | `--color-primary` | 0 0 0 2px `--color-primary-surface` | `--color-primary` |
| Error | `--color-danger` | 0 0 0 2px `--color-danger-bg` | `--color-danger` |
| Disabled | `--color-border-tertiary` | none | `--color-text-tertiary` |

**Regras:**
- Labels sempre acima do campo, nunca placeholder-only.
- Helper text abaixo do campo em caption (11px, tertiary).
- Erro substitui helper text com mensagem em vermelho.
- Placeholder em `--color-text-tertiary`.

### 5.3 Search Bar

- Background: `--color-bg-secondary` (sem borda)
- Height: 38px
- Border-radius: radius-md
- Ícone de lupa à esquerda em `--color-text-tertiary`
- Placeholder: "Buscar por nome ou telefone"
- Sempre visível no topo de telas de lista

### 5.4 Cards

**Elevated Card:**
- Background: `--color-bg-primary`
- Border: 0.5px solid `--color-border-secondary`
- Border-radius: radius-lg (12px)
- Padding: 14px 16px
- Uso: conteúdo clicável, itens de lista expandidos, formulários

**Flat Card (Metric Card):**
- Background: `--color-bg-secondary`
- Border: none
- Border-radius: radius-lg (12px)
- Padding: 10px 12px
- Uso: stats, métricas, resumos numéricos

**Action Card (com borda lateral de prioridade):**
- Base: elevated card
- Border-left: 3px solid (cor da prioridade)
- Border-radius: radius-md (10px)
- Contém: ícone + título + subtítulo + botão de ação
- Cores da borda: danger (vermelho), warning (âmbar), info (azul), success (verde)

### 5.5 Badges & Tags

**Badges (Status):**
- Forma: retangular, radius 6px
- Padding: 2px 8px
- Font-size: 11px, weight 500
- Uso: status de pagamento (Pago, Pendente, Atrasado), status de campanha (Enviando, Concluída, Agendada)

**Tags (Classificação):**
- Forma: pill, radius-full
- Padding: 4px 10px
- Font-size: 11px, weight 500
- Uso: etiquetas de cliente (VIP, Ativa, Inativa, Sumindo), marcas (Mary Kay, Natura)

**Combinações de cores para badges:**

| Status | Background | Texto |
|--------|------------|-------|
| Pago / Ativo / Concluída | `--color-success-bg` | `--color-success-text` |
| Pendente / Regular | `--color-warning-bg` | `--color-warning-text` |
| Atrasado / Sumindo / Erro | `--color-danger-bg` | `--color-danger-text` |
| Rascunho / Info / Agendada | `--color-primary-surface` | `--color-primary` |
| Enviando / Enviado | `--color-info-bg` | `--color-info-text` |
| Neutro / Marca | `--color-bg-secondary` | `--color-text-secondary` |

### 5.6 Avatares (Classificação ABC)

- Forma: círculo
- Tamanhos: SM (28px), MD (36px), LG (48px)
- Font-weight: 500
- Letra: inicial da classificação (A, B, C) ou iniciais do nome (MS, AP)
- Cores:
  - A: bg `#ECFDF5`, texto `#059669`
  - B: bg `#FEF3C7`, texto `#D97706`
  - C: bg `--color-bg-secondary`, texto `--color-text-tertiary`

### 5.7 Segmented Control

- Background container: `--color-bg-secondary`
- Border-radius container: 8px
- Padding container: 2px
- Item ativo: bg `--color-bg-primary`, shadow `0 1px 2px rgba(0,0,0,0.06)`, radius 6px
- Item inativo: bg transparent, texto `--color-text-tertiary`
- Font-size: 11px, weight 500
- Uso: filtro de status em telas de lista (Todas/Ativas/Leads/Inativas)

### 5.8 Filter Chips (Horizontal Scroll)

- Border: 0.5px solid `--color-border-secondary`
- Border-radius: radius-full (16px)
- Padding: 5px 10px
- Font-size: 11px
- Estado ativo: bg `--color-primary-surface`, texto `--color-primary`, borda `--color-primary-surface-hover`
- Dot indicador de cor: 6×6px circle à esquerda do label
- Container: horizontal scroll com overflow-x auto
- Uso: filtro por etiqueta em lista de clientes

### 5.9 Toggle Switch

- Track: 36×20px (44×24px na versão touch-friendly), radius-full
- Knob: 16×16px (18×18px), branco, radius-full
- Estado on: track `--color-primary`, knob à direita
- Estado off: track `--color-border-secondary`, knob à esquerda
- Transição: 200ms ease

### 5.10 Progress Bar

- Track: height 6px (mini: 4px), bg `--color-bg-secondary`, radius 3px
- Fill: height 100%, bg `--color-primary`, radius 3px
- Variantes de cor: success (verde), warning (âmbar), danger (vermelho)

### 5.11 Lista de Itens

- Padding vertical: 10px
- Separador: 0.5px solid `--color-border-tertiary`
- Layout: avatar (38px) + info (flex:1) + right content
- Info: título (13px, 500) + subtítulo (11px, tertiary)
- Right: valor ou badge + data/caption
- Último item: sem separador

### 5.12 Timeline (Linha do Tempo)

- Linha vertical: 1px solid `--color-border-tertiary`, posição left: 5px
- Dot: 8×8px circle, cor por tipo de evento
- Padding-left do conteúdo: 18px
- Cores dos dots:
  - Venda: `#059669` (success)
  - Mensagem: `#2563EB` (info)
  - Campanha: `#8127E8` (primary)
  - Pós-venda: `#D97706` (warning)
  - Agendamento: `#7C3AED` (purple)

### 5.13 Empty State

- Container: centralizado, padding 24px 16px
- Ícone: 48×48px circle, bg `--color-bg-secondary`, ícone em `--color-text-tertiary`
- Título: 14px, 500, `--color-text-primary`
- Descrição: 12px, `--color-text-tertiary`
- CTA: botão primary MD abaixo

### 5.14 Alert / Banner

- Border-radius: radius-md (10px)
- Padding: 10px 12px
- Layout: ícone (28-32px circle) + texto (flex:1)
- Variantes:
  - IA: bg `--color-primary-surface`, ícone bg `--color-primary`, texto `--color-primary`
  - Success: bg `--color-success-bg`, texto `--color-success-text`
  - Warning: bg `--color-warning-bg`, texto `--color-warning-text`
  - Danger: bg `--color-danger-bg`, ícone com `!`, texto `--color-danger-text`

### 5.15 Action Sheet (Bottom Sheet)

- Aparece: slide de baixo pra cima com backdrop escurecido
- Background: `--color-bg-primary`
- Border-radius top: 16px
- Padding: 16px
- Handle: 40×4px pill centralizada no topo, bg `--color-border-secondary`
- Itens: 10px padding vertical, ícone 32×32px (radius 8px) + título + subtítulo
- Hover: bg `--color-bg-secondary`

### 5.16 Step Indicator (Multi-Step Flow)

- Dots: height 3px, radius 2px
- Dot inativo: width 24px, bg `--color-border-tertiary`
- Dot ativo: width 36px, bg `--color-primary`
- Dot concluído: width 24px, bg `--color-primary`
- Gap entre dots: 4px
- Posição: centralizado horizontalmente, abaixo do nav bar

### 5.17 Funil Visual (Campanha Stats)

- Barras horizontais: height 20px, radius 4px
- Largura proporcional ao percentual
- Cores em degradê por etapa: primary → info → success → warning
- Label à esquerda (70px min-width), valor dentro da barra, percentual à direita
- Fundo: nenhum (barras flutuam sobre bg da tela)

---

## 6. Iconografia

### 6.1 Biblioteca

- **Primária:** Lucide Icons (já na stack)
- **Tamanho padrão:** 18×18px em navegação, 16×16px em botões/listas, 14×14px inline
- **Stroke-width:** 1.5px
- **Cor:** herda do contexto (texto ou ícone ativo)

### 6.2 Ícones por Módulo (Tab/Menu)

| Módulo | Ícone Lucide | Contexto |
|--------|-------------|----------|
| Meu Dia | `Clock` | Tab bar, sidebar |
| Clientes | `User` | Tab bar, sidebar |
| Vendas | `Calendar` (como receipt) | Tab bar, sidebar |
| Menu | `List` | Tab bar |
| Campanhas | `MessageSquare` | Menu grid, sidebar |
| Templates | `FileText` | Menu grid, sidebar |
| Respostas Rápidas | `AlignLeft` | Menu grid, sidebar |
| Catálogo | `ShoppingBag` | Menu grid, sidebar |
| Estoque | `Grid` | Menu grid, sidebar |
| Vitrines | `Store` | Menu grid, sidebar |
| Agenda | `CalendarDays` | Menu grid, sidebar |
| Calendário | `Clock` | Menu grid, sidebar |
| Metas | `TrendingUp` | Menu grid, sidebar |
| Equipe | `Users` | Menu grid, sidebar |
| Ranking | `ArrowUp` | Menu grid |
| Tarefas | `LayoutGrid` | Menu grid |
| Landing Page | `Globe` | Menu grid, sidebar |
| QR Code | `QrCode` | Menu grid |
| Indicações | `Share2` | Menu grid, sidebar |
| Configurações | `Settings` | Menu grid, sidebar |
| Financeiro | `DollarSign` | Sidebar |
| Entregas | `Truck` | Sidebar |
| IA | `Sparkles` | Menu, sidebar, action sheet |

---

## 7. Navegação

### 7.1 Mobile — Bottom Navigation (5 tabs + FAB)

**Layout:** 5 posições na barra inferior com FAB central flutuante.

| Posição | Tab | Ícone | Destino |
|---------|-----|-------|---------|
| 1 (esquerda) | Meu Dia | `Clock` | Tela home/briefing matinal |
| 2 | Clientes | `User` | Lista de clientes |
| 3 (centro) | FAB (+) | `Plus` em circle | Action sheet com ações rápidas |
| 4 | Vendas | `Calendar` | Lista de vendas + financeiro |
| 5 (direita) | Menu | `List` | Hub de módulos |

**FAB (Floating Action Button):**
- Tamanho: 48×48px
- Forma: circle
- Cor: `--color-primary`
- Ícone: `+` em branco, 24px
- Posição: centralizado na bottom bar, 24px acima da linha do bar
- Ação: abre action sheet com slide de baixo pra cima

**Action Sheet do FAB (5 ações):**

| Ordem | Ação | Ícone | Cor do ícone | Descrição |
|-------|------|-------|-------------|-----------|
| 1 | Nova venda | `$` | primary-surface / primary | Registrar venda rápida |
| 2 | Nova cliente | `+` | success-bg / success | Cadastrar contato |
| 3 | Enviar mensagem | `M` | info-bg / info | WhatsApp rápido |
| 4 | Nova campanha | `C` | warning-bg / warning | Marketing em massa |
| 5 | Pedir pra IA | `A` | rose-surface / rose | Gerar texto com IA |

### 7.2 Mobile — Tela Menu (Hub de Módulos)

**Layout:** Scroll vertical com grid 3×3 por grupo.

**Header:** Perfil da consultora (avatar + nome + plano) com seta de navegação para conta.

**Banner IA:** Sempre visível, mostra gerações restantes do mês. Bg `--color-primary-surface`.

**6 grupos:**

| Grupo | Cor | Itens |
|-------|-----|-------|
| Comunicação | `--color-info` (#2563EB) | Campanhas, Templates, Respostas rápidas |
| Produtos | `--color-warning` (#D97706) | Catálogo, Estoque, Vitrines |
| Planejamento | Purple (#7C3AED) | Agenda, Calendário, Metas |
| Equipe (condicional: cargo Leader+) | `--color-success` (#059669) | Minha equipe, Ranking, Tarefas |
| Meu Negócio | Rose (#E91E8C) | Landing page, QR Code captação, Indicações |
| Configurações | `--color-text-secondary` | Tema e idioma, Conta e plano, Pós-venda, Exportar dados, Modo treino, Suporte |

**Grid items:**
- Padding: 14px 4px 10px
- Border-radius: radius-lg (12px)
- Background: `--color-bg-secondary`
- Ícone: 36×36px container (radius 10px) com background da cor do grupo
- Label: 10px, centralizado, `--color-text-primary`

### 7.3 Web — Sidebar

**Layout:** Sidebar fixa à esquerda, collapsible. Largura expandida: 220px. Collapsed: 64px (apenas ícones).

**6 grupos com labels overline:**

| Grupo | Cor do dot | Itens |
|-------|-----------|-------|
| (sem label) | `--color-primary` | Meu Dia, Dashboard |
| PESSOAS | `#059669` | Clientes, Leads, Equipe (badge "Líder" condicional) |
| NEGÓCIO | `#D97706` | Vendas, Catálogo, Estoque, Financeiro, Entregas |
| COMUNICAÇÃO | `#2563EB` | Campanhas, Templates, Respostas rápidas, Assistente IA |
| PLANEJAMENTO | `#9333EA` | Agenda, Calendário, Metas |
| MEU PERFIL | `--color-text-tertiary` | Landing page, Configurações, Indicações |

**Item ativo:** bg `--color-primary-surface`, texto `--color-primary`, font-weight 500.

**Dot indicador:** 6×6px circle à esquerda de cada item, cor do grupo.

### 7.4 Padrões de Transição

| Ação | Transição | Duração |
|------|-----------|---------|
| Push (navegar pra frente) | Slide horizontal da direita pra esquerda | 300ms ease-out |
| Pop (voltar) | Slide horizontal da esquerda pra direita | 250ms ease-in |
| Modal / Action Sheet | Slide de baixo pra cima + backdrop fade | 300ms ease-out |
| Dismiss modal | Slide pra baixo + backdrop fade out | 250ms ease-in |
| Tab switch | Fade crossfade | 150ms ease |
| Card expand | Scale de 0.95 → 1.0 + fade in | 200ms ease-out |

---

## 8. Telas — Mobile

### 8.1 Tela: Meu Dia (Home)

**Rota:** `/` (tab 1)
**Dados:** `schedule.getMyDay`, `analytics.getDashboard`, `analytics.getGoalProgress`

**Estrutura (top-down):**

1. **Greeting contextual** — "Bom dia, {nome}!" / "Boa tarde" / "Boa noite". Font: heading-1 (24px/500). Abaixo: data por extenso em caption.

2. **Stats Row** — 3 flat cards lado a lado:
   - Vendas do mês: valor em heading-2, variação percentual vs mês anterior (success se +, danger se -)
   - Meta mensal: percentual em heading-2, progress bar mini (4px) abaixo
   - Clientes ativos: número em heading-2, alerta "X sumindo" em warning se houver

3. **Banner de Gamificação** — bg `--color-primary-surface`, ícone estrela em circle primary, texto motivacional: "Faltam R$ X pra bater a meta!" + sub-texto encorajador.

4. **Quick Actions** — chips horizontais scroll: "Nova venda" (primary), "Mensagem" (neutral), "Nova cliente" (neutral). Funcionam como atalho alternativo ao FAB.

5. **Seção: Urgente** (vermelho) — Cobranças que vencem hoje ou estão atrasadas. Action cards com borda esquerda vermelha. Botão "Cobrar" em cada card. Counter badge vermelho no header.

6. **Seção: Lembretes** (âmbar) — Reposição, cashback expirando, follow-ups. Action cards com borda âmbar. Botão "Lembrar" ou "Avisar". Counter badge âmbar.

7. **Seção: Aniversários** (verde) — Aniversariantes do dia. Action cards com borda verde. Botão "Parabéns" (abre WhatsApp com mensagem pré-formatada). Counter badge verde.

8. **Seção: Agenda de Hoje** (azul) — Timeline vertical com horários. Dots coloridos por tipo (entrega=azul, demo=roxo, follow-up=cinza). Cada item mostra horário, descrição e endereço/detalhe.

**Ações dos botões dos action cards:** Abrem o WhatsApp com mensagem pré-formatada (N1) ou disparam automaticamente (N2). Máximo 2 toques: ver → agir.

### 8.2 Tela: Clientes — Lista

**Rota:** `/clients` (tab 2)
**Dados:** `clients.list`, `clients.listLeads`

**Estrutura:**

1. **Header:** Título "Clientes" (heading-1) + 2 icon buttons (filtro avançado + novo cliente em primary filled).

2. **Search Bar:** Sempre visível. Placeholder "Buscar por nome ou telefone".

3. **Segmented Control:** Todas (count) | Ativas (count) | Leads (count) | Inativas (count)

4. **Filter Chips:** Scroll horizontal. Chips de etiquetas: Todas, VIP, por marca (Mary Kay, Natura, Avon), Sumindo. Dot colorido em cada chip.

5. **Resumo ABC:** 4 flat cards compactos lado a lado mostrando contagem por classificação (A top, B regular, C esporádica, ! sumindo).

6. **Lista de Clientes:** Cada item:
   - Avatar com classificação (A/B/C, cores definidas)
   - Nome + badges inline (VIP, Cashback, Sumindo)
   - Sub-texto: marca + tipo de pele + número de compras
   - À direita: valor total gasto + data da última compra
   - Toque: navega para perfil da cliente

### 8.3 Tela: Cliente — Perfil

**Rota:** `/clients/:id`
**Dados:** `clients.getById`, `sales.list({clientId})`, `sales.getCashbackBalance`, `messaging.listScheduled`

**Estrutura:**

1. **Nav bar:** Botão voltar "Clientes" em primary.

2. **Header:** Avatar LG (52px) com iniciais + Nome (heading-2) + badge VIP + telefone + idade. Tags abaixo: marca, status, tipo de pele.

3. **Action Strip:** 4 botões em grid horizontal:
   - WhatsApp (primary surface) — abre WhatsApp
   - Vender — inicia fluxo de nova venda com cliente pré-selecionado
   - Agendar — abre criação de agendamento
   - Mais — abre action sheet (editar, excluir, exportar, etc.)

4. **Stats Grid:** 6 flat cards em grid 3×2:
   - Total gasto, Número de compras, Ticket médio
   - Frequência média (dias), Score de engajamento, Data última compra

5. **Card de Alergia** (condicional) — bg danger, ícone de alerta, texto em negrito. Visualmente impossível de ignorar. Só aparece se o campo allergies estiver preenchido.

6. **Card de Cashback** (condicional) — bg success. Mostra valor disponível, dias pra expirar, ação "Lembrar cliente".

7. **Notas da Consultora** — flat card com texto em itálico. Campo editável.

8. **Linha do Tempo** — Timeline vertical mostrando vendas, mensagens, campanhas, pós-venda. Cada tipo com dot colorido. Link "Ver tudo" para timeline completa.

9. **Lista de Desejos** — Itens com thumbnail, nome do produto, preço, marca. Badge "Avisar" (quando produto entrar em promoção). Link "Adicionar".

10. **Perfil de Beleza** — Flat card com pares chave-valor: tipo de pele, cabelo, tom de maquiagem, profissão, aniversário, fonte do cadastro.

### 8.4 Tela: Nova Venda (Fluxo 4 Steps)

**Rota:** `/sales/new`
**Step indicator:** 4 dots no topo

**Step 1 — Selecionar Cliente:**
- Search bar para busca
- Lista de clientes com radio selection (check circle)
- Informação contextual: classificação, última compra, cashback disponível
- Botão "Venda sem cliente (avulsa)" em estilo secondary/draft
- CTA: "Próximo" (primary, full-width)

**Step 2 — Adicionar Produtos:**
- Search bar para busca de produto
- Filter chips por marca em scroll horizontal
- Lista de produtos: thumbnail (38px, radius 8px) + nome + marca/preço + qty control (- / num / +)
- Produtos com qty 0: controles esmaecidos (opacity 0.3-0.4)
- Cart summary fixo na parte inferior: itens adicionados com subtotal
- CTA: "Próximo"

**Step 3 — Pagamento e Desconto:**
- Card de cashback com checkbox (se cliente tiver saldo) — mostra valor como desconto
- Desconto: dois inputs lado a lado (valor fixo OU percentual)
- Forma de pagamento: 3 opções com radio selection
  - PIX (Mercado Pago): ícone verde, descrição "QR Code gerado na confirmação"
  - Parcelado: ícone azul, descrição "Parcelas com data de vencimento"
  - Dinheiro/Outros: ícone âmbar, descrição "Registra sem gerar link"
- Se "Parcelado" selecionado: chips de parcelas (1x, 2x, 3x, 4x, 5x, 6x)
- Resumo com subtotal, cashback, desconto, total
- CTA: "Próximo"

**Step 4 — Confirmar e Enviar:**
- Confirm card: cliente (avatar + nome + telefone), itens com valores, deduções, forma de pagamento, total em destaque
- Método de entrega: 4 chips (Pessoal, Correio, Motoboy, Retirada)
- Toggle: "Enviar confirmação pelo WhatsApp" (default: ON, cor success)
- Toggle: "Agendar pós-venda automático" (default: ON, cor primary)
- Dois botões lado a lado: "Salvar rascunho" (draft) | "Confirmar venda" (primary, flex:2)
- Rodapé: margem de lucro estimada (caption, cor success)

**Pós-confirmação:** Animação de sucesso (checkmark), card de resumo, opções: "Ver venda", "Nova venda", "Voltar ao início".

### 8.5 Tela: Vendas — Lista

**Rota:** `/sales` (tab 4)
**Dados:** `sales.list`, `finance.getDashboard`

**Estrutura:**

1. **Header:** "Vendas" + botão "Nova venda" (primary SM).

2. **Stats Row:** 3 flat cards — Faturamento do mês, Contas a receber, Entregas pendentes.

3. **Segmented Control:** Todas | Confirmadas | Rascunhos | Entregues | Canceladas

4. **Lista de Vendas:** Cada item:
   - Nome da cliente + badge de status (Pago, Pendente, Entregue, etc.)
   - Produtos resumidos (1-2 nomes) + quantidade total de itens
   - Valor total + data
   - Ícone de método de pagamento

5. **Tabs secundárias:** Vendas | Financeiro | Entregas | Estoque (horizontal scroll). Cada tab mostra a sub-tela correspondente.

### 8.6 Tela: Financeiro

**Rota:** `/sales/finance`
**Dados:** `finance.getDashboard`, `finance.listExpenses`, `sales.getAccountsReceivable`

**Estrutura:**

1. **Period Selector:** Chips (Este mês, Último mês, Últimos 3 meses, Custom).

2. **Stats Grid:** 4 flat cards:
   - Receita total (heading-2, success)
   - Despesas (heading-2, danger)
   - Lucro líquido (heading-2, primary)
   - Margem média (percentual)

3. **Contas a Receber:** Lista de parcelas pendentes/atrasadas com badge de status, nome da cliente, valor, data de vencimento. Ação direta: "Cobrar" ou "Marcar pago".

4. **Despesas:** Lista com ícone de categoria, descrição, valor, data. Botão "Nova despesa" no topo.

5. **Ferramentas:** Calculadora de margem (input custo + venda = margem), Meta reversa (input quanto quer ganhar = quanto precisa vender).

### 8.7 Tela: Campanhas — Lista

**Rota:** `/campaigns` (via Menu)
**Dados:** `campaigns.list`

**Estrutura:**

1. **Header:** "Campanhas" + botão "Nova" (primary SM com ícone +).

2. **Segmented Control:** Todas | Ativas | Agendadas | Encerradas

3. **Campaign Cards:** Cada card contém:
   - Nome + data + contagem de destinatárias
   - Badge de status (Concluída/Enviando/Agendada/Rascunho)
   - Preview da mensagem (truncada em 2 linhas, mostrando {nome} como variável)
   - Mini stats inline: 4 métricas (Receberam, Visualizaram, Responderam, Vendas)
   - Botões contextuais:
     - Concluída: "Ver detalhes" + "Remarketing"
     - Enviando: sem ações (read-only)
     - Agendada: "Editar" + "Cancelar"
     - Rascunho: "Continuar" + "Excluir"

### 8.8 Tela: Nova Campanha (Fluxo 3 Steps)

**Step 1 — Selecionar Destinatárias:**
- Segmented control: Por etiqueta | Individual | Todas
- Se "Por etiqueta": filter chips de etiquetas com contagem
- Se "Individual": lista de clientes com checkbox múltiplo
- Resumo: "X destinatárias selecionadas"
- CTA: "Próximo"

**Step 2 — Escrever Mensagem:**
- Textarea grande (min 80px height) com placeholder
- Variáveis: hint "{nome} será substituído pelo nome de cada cliente"
- Bar IA: banner roxo "Pedir pra IA escrever ou melhorar" com botão "Gerar"
- Anexos: 4 botões (Foto, Áudio, PDF, Vídeo) em row
- Agendamento: date picker + time picker
- Resumo de destinatárias: "32 destinatárias selecionadas" com link "Editar"
- Botões: "Enviar teste pra mim" (primary) + "Confirmar campanha" (success)

**Step 3 — Revisão (se agendada):**
- Resumo completo: mensagem, anexos, destinatárias, data/hora
- Preview da mensagem com variável substituída por nome de exemplo
- Botão "Confirmar agendamento"

### 8.9 Tela: Campanha — Estatísticas

**Rota:** `/campaigns/:id`
**Dados:** `campaigns.getById`, `sales.getConversionStats({campaignId})`

**Estrutura:**

1. **Stats Row:** 4 métricas grandes: Enviadas, % Receberam, % Visualizaram, % Responderam.

2. **Funil Visual:** Barras horizontais decrescentes — Enviadas → Recebidas → Visualizadas → Responderam → Compraram. Cada barra com label, contagem, percentual.

3. **Resultado:** Card com Receita gerada (success) + Taxa de conversão.

4. **Remarketing CTA:** Botão âmbar "Remarketing: X não responderam" — cria nova campanha filtrada.

5. **Listas Negativas:** Pills clicáveis: "X não receberam" (danger), "X não visualizaram" (warning), "X não responderam" (neutral). Cada pill abre a lista filtrada.

### 8.10 Tela: Catálogo de Produtos

**Rota:** `/catalog` (via Menu)
**Dados:** `catalog.listProducts`, `catalog.listBrands`

**Estrutura:**

1. **Header:** "Catálogo" + botão "Novo produto" + icon button filtro.

2. **Brand Chips:** Scroll horizontal com logo/nome da marca. "Todas" como default.

3. **Category Chips:** Scroll horizontal (Skincare, Maquiagem, Cabelo, Perfumaria, Corpo).

4. **Grid de Produtos:** 2 colunas. Cada card:
   - Thumbnail (quadrado, radius 8px)
   - Nome do produto
   - Marca (caption)
   - Preço
   - Badge de estoque (se baixo: warning "Estoque: 3")
   - Ícone de ação: enviar pra cliente via WhatsApp

5. **Visualização alternativa:** Toggle grid/list no header.

### 8.11 Tela: Estoque

**Rota:** `/inventory` (via Menu)
**Dados:** `inventory.listStock`

**Estrutura:**

1. **Header:** "Estoque" + botão "Pedido à marca".

2. **Segmented Control:** Todos | Estoque baixo | Sem estoque

3. **Lista de Produtos com Estoque:**
   - Thumbnail + nome + marca
   - Quantidade atual (destaque se baixo)
   - Badge: "OK" (success), "Baixo" (warning com min_alert), "Zero" (danger)
   - Botão inline: ajustar quantidade (+/-)

4. **Seção: Pedidos à Marca:** Cards por pedido com status (Pedido/Recebido/Parcial), data, itens.

5. **Seção: Amostras:** Lista de amostras distribuídas com ROI.

### 8.12 Tela: Agenda

**Rota:** `/schedule` (via Menu)
**Dados:** `schedule.listAppointments`, `schedule.getCalendar`

**Estrutura:**

1. **Toggle View:** Dia | Semana | Mês

2. **Calendário mini (mês):** Grid com dots nos dias que têm eventos. Dia selecionado em primary.

3. **Lista de Eventos do Dia:** Timeline vertical (como na tela Meu Dia, mas completa). Tipos: visita, demonstração, dia de beleza, entrega, follow-up, outro.

4. **FAB local:** "Novo agendamento" (primary circle).

5. **Criação de Agendamento:** Bottom sheet ou tela completa com: título, tipo (select), cliente (search), endereço, data/hora, notas.

### 8.13 Tela: Equipe (Condicional: Leader+)

**Rota:** `/team` (via Menu, visível apenas se role = LEADER/DIRECTOR)
**Dados:** `team.getTeam`, `team.getTeamStats`, `team.getRanking`

**Estrutura:**

1. **Segmented Control:** Minha Equipe | Ranking | Tarefas

2. **Minha Equipe:** Lista de membros com avatar, nome, cargo, nível de carreira, status, vendas do mês.

3. **Ranking:** Lista ordenada por vendas/metas. Posição (#1, #2...), avatar, nome, valor de vendas, barra de progresso da meta.

4. **Tarefas:** Lista de tarefas com status (Pendente/Aprovada/Enviada), botão "Aprovar" inline, "Aprovar em massa" no header.

### 8.14 Tela: Landing Page Editor

**Rota:** `/landing` (via Menu)
**Dados:** `landing.get`

**Estrutura:**

1. **Preview:** Miniatura da landing page (foto, bio, marcas, botão WhatsApp, QR Code).

2. **Formulário de Edição:** Foto (upload), bio (textarea), filosofia (textarea), marcas (multi-select), link WhatsApp.

3. **Toggle:** Ativar/desativar landing page.

4. **Link:** Exibição do subdomínio (nome.wbc.com.br) com botão "Copiar" e "Compartilhar".

### 8.15 Tela: Configurações — Tema e Idioma

**Rota:** `/settings/theme`

**Estrutura:**

1. **Tema de Cor:** 2 opções com preview visual (Padrão roxo / Rose Quartz rosa). Radio selection.

2. **Modo:** Toggle Dark Mode (on/off).

3. **Idioma:** Select (Português BR / English).

4. **Preview ao vivo:** A tela muda em tempo real conforme a seleção.

### 8.16 Tela: Onboarding Wizard (5 Steps)

**Rota:** Aparece no primeiro login, antes da home.

**Step 1 — Bem-vinda + Marca:**
- Ilustração de boas-vindas com logo WBC
- "Qual(is) marca(s) você trabalha?"
- Multi-select de marcas (Mary Kay, Natura, Avon, Jequiti, Boticário, Outra)
- CTA: "Próximo"

**Step 2 — Perfil e Foto:**
- Upload de foto (avatar)
- Nome completo (input)
- Telefone principal (já preenchido do OTP)
- Slug da landing page (auto-gerado, editável)
- CTA: "Próximo"

**Step 3 — Importar Contatos:**
- 3 opções com ícones:
  - Importar do WhatsApp (sync automático)
  - Importar de planilha (upload .xlsx/.csv)
  - Cadastrar manualmente depois
- CTA: "Próximo"

**Step 4 — Configurar Lembretes:**
- "Quer ativar lembretes de reposição automáticos?"
- Toggle ON/OFF
- Se ON: campo de ciclo padrão (ex: 90 dias)
- "Quer ativar pós-venda automático (2+2+2)?"
- Toggle ON/OFF
- CTA: "Próximo"

**Step 5 — Primeira Venda Guiada:**
- "Vamos registrar sua primeira venda juntas!"
- Fluxo simplificado de nova venda com tooltips/hints em cada campo
- Dados de exemplo pré-preenchidos com opção de editar
- Ao concluir: animação de celebração + "Seu WBC está pronto!"
- CTA: "Ir para Meu Dia"

---

## 9. Telas — Web (Dashboard)

A versão web usa o mesmo design system, expandido para telas maiores.

### 9.1 Layout Geral Web

```
┌──────────┬──────────────────────────────┐
│          │  Top Bar (nome, avatar,      │
│ Sidebar  │  notificações, tema)         │
│ (220px)  ├──────────────────────────────┤
│          │                              │
│ Grupos   │  Content Area                │
│ com dots │  (padding: 24px)             │
│ coloridos│                              │
│          │  Max-width: 1200px           │
│          │  Centered                    │
│          │                              │
└──────────┴──────────────────────────────┘
```

- Sidebar: fixa, 220px expandida, 64px collapsed. Toggle no topo.
- Top bar: height 56px, bg primary, avatar + nome + badge de plano + sino de notificações + theme toggle.
- Content: padding 24px, max-width 1200px, centralizado.
- Breakpoints: 1024px (sidebar collapsed por padrão), 768px (sidebar oculta, hamburger menu).

### 9.2 Web: Dashboard (Home)

**Layout:** Grid de 12 colunas.

**Row 1 (full-width):** Greeting + data + botão "Nova venda" primary.

**Row 2 (4 colunas):** 4 stat cards:
- Vendas do mês (valor + variação)
- Meta mensal (percentual + progress bar)
- Clientes ativos (contagem + alertas)
- Contas a receber (valor pendente)

**Row 3 (8 + 4 colunas):**
- Esquerda (8col): Gráfico de vendas (line chart, últimos 30 dias). Biblioteca: Recharts.
- Direita (4col): Top 5 produtos do mês (mini lista com ranking).

**Row 4 (6 + 6 colunas):**
- Esquerda: Atividades de hoje (versão expandida do "Meu Dia" — urgentes, lembretes, agenda).
- Direita: Campanhas ativas (cards resumidos com stats inline).

**Row 5 (full-width):** Clientes que precisam de atenção: Sumindo (badge danger), Cashback expirando (badge warning), Aniversariantes (badge success).

### 9.3 Web: Clientes

**Layout:** Tabela completa com colunas sortáveis.

| Coluna | Conteúdo |
|--------|----------|
| Cliente | Avatar + nome + badges |
| Classificação | Badge A/B/C |
| Telefone | Com botão WhatsApp inline |
| Marca | Tag pill |
| Total gasto | Valor formatado |
| Última compra | Data relativa |
| Status | Badge (Ativa/Inativa/Lead/Sumindo) |
| Ações | Ícones: WhatsApp, Vender, Editar |

- Filtros no topo: busca, etiquetas, classificação, status, marca.
- Bulk actions: selecionar múltiplos → "Enviar campanha", "Adicionar etiqueta", "Editar nomes em massa".
- Sidebar de detalhe: clicar num cliente abre panel à direita com perfil completo (sem navegar).

### 9.4 Web: Vendas

**Layout:** Tabela + sidebar de detalhe.

| Coluna | Conteúdo |
|--------|----------|
| # | Número da venda |
| Cliente | Nome + avatar |
| Produtos | Lista resumida |
| Total | Valor |
| Pagamento | Método + badge status |
| Entrega | Método + status |
| Data | Data da venda |
| Ações | Ver, Editar, WhatsApp confirmação |

- Nova venda: modal multi-step (mesmo fluxo mobile, adaptado pra tela larga — steps lado a lado ou em tabs).

### 9.5 Web: Campanhas

**Layout:** Cards em grid (2-3 colunas) ou tabela (toggle view).

- Card expandido: stats completas, funil visual, botões de ação.
- Nova campanha: modal ou página dedicada com editor de texto rico e preview lado a lado.
- Estatísticas: página dedicada com gráficos de funil, timeline de envio, e listas filtráveis.

### 9.6 Web: Financeiro

**Layout:** Dashboard financeiro com gráficos.

- Topo: 4 stat cards (Receita, Despesas, Lucro, Margem).
- Gráfico: Receita vs Despesas (bar chart, últimos 6 meses).
- Tabela: Contas a receber com status, ações inline (cobrar, marcar pago, gerar PIX).
- Tabela: Despesas com CRUD inline.
- Ferramentas: Calculadora de margem + Meta reversa (sidepanel).

### 9.7 Web: Demais Telas

Todas as telas do mobile têm equivalente web, seguindo o padrão: tabela/grid no centro + sidebar de detalhe à direita + filtros no topo. Os mesmos componentes do design system aplicam, com tamanhos ajustados para desktop (inputs podem ser 44px height, cards com mais padding, etc).

---

## 10. Microinterações e Feedback

### 10.1 Loading States

- **Skeleton screens** em vez de spinners. Retângulos animados (shimmer) com as mesmas dimensões do conteúdo final.
- **Pull-to-refresh** no mobile: indicador circular no topo com animação de rotação.
- **Infinite scroll** em listas longas: skeleton de 3 itens aparece no final ao carregar mais.

### 10.2 Feedback de Ações

| Ação | Feedback |
|------|----------|
| Venda confirmada | Animação de checkmark + toast success "Venda registrada!" |
| Mensagem enviada | Toast info "Mensagem enviada para {nome}" |
| Campanha disparada | Toast success "Campanha enviada para X contatos" |
| Erro | Toast danger no topo com ícone de alerta + mensagem |
| Salvando | Botão muda para loading spinner inline (não desabilita, mostra spinner dentro) |
| Sucesso de save | Botão volta ao normal + check icon por 1.5s |

### 10.3 Toasts

- Posição: topo da tela, centralizado
- Duration: 3s (success/info), 5s (danger/warning)
- Layout: ícone + texto + botão dismiss (×)
- Border-radius: radius-md
- Cores: seguem semântica (success-bg, danger-bg, etc.)
- Animação: slide de cima + fade in, fade out ao expirar

### 10.4 Confirmações Destrutivas

Ações destrutivas (excluir cliente, cancelar venda, cancelar campanha) mostram modal de confirmação:
- Título: "Tem certeza?"
- Descrição: explica consequência
- 2 botões: "Cancelar" (outline) | "Sim, excluir" (danger)
- Nunca pré-seleciona a ação destrutiva

### 10.5 Haptic Feedback (Mobile)

- Toggle switch: light impact
- Botão primary tap: light impact
- Ação destrutiva confirmada: notification error
- Pull-to-refresh threshold: medium impact
- FAB tap: medium impact

---

## 11. Responsividade e Breakpoints

| Breakpoint | Device | Comportamento |
|------------|--------|---------------|
| < 640px | Mobile portrait | Layout padrão mobile. Bottom nav + FAB |
| 640-768px | Mobile landscape / tablet portrait | Grid 2 colunas em listas. Bottom nav |
| 768-1024px | Tablet landscape | Sidebar collapsed (64px). Content area ampliada |
| 1024-1280px | Desktop small | Sidebar expandida (220px). Content max-width 1000px |
| > 1280px | Desktop large | Sidebar expandida. Content max-width 1200px. Grids de 3-4 colunas |

---

## 12. Acessibilidade

- Contraste mínimo: 4.5:1 para texto normal, 3:1 para texto grande (WCAG AA)
- Touch targets mínimos: 44×44px (iOS HIG) / 48×48dp (Material)
- Labels em todos os inputs (never placeholder-only)
- States visuais: não depender apenas de cor (usar ícones + texto + cor)
- Animações: respeitar `prefers-reduced-motion`
- Screen readers: labels semânticos em todos os botões e ícones interativos
- Navegação por tab no web: focus ring visível em todos os interativos

---

## 13. Estratégia de Implementação

### 13.1 Pacote UI Compartilhado

Componentes vivem em `packages/ui/` e são importados pelo web e landing. O mobile usa NativeWind com os mesmos tokens via Tailwind config compartilhado.

### 13.2 CSS Variables (Tailwind Config)

Todos os tokens de cor, espaçamento e radius devem ser definidos como CSS custom properties e mapeados no `tailwind.config.ts`:

```typescript
// tailwind.config.ts (exemplo da estrutura)
theme: {
  extend: {
    colors: {
      primary: 'var(--color-primary)',
      'primary-hover': 'var(--color-primary-hover)',
      'primary-surface': 'var(--color-primary-surface)',
      accent: 'var(--color-accent)',
      // ... todos os tokens
    },
    borderRadius: {
      sm: '6px',
      md: '10px',
      lg: '12px',
      xl: '16px',
    },
    fontSize: {
      'heading-1': ['24px', { lineHeight: '1.3', fontWeight: '500' }],
      'heading-2': ['18px', { lineHeight: '1.3', fontWeight: '500' }],
      // ... todos os tokens
    }
  }
}
```

### 13.3 Tema Provider

O tema é controlado por um atributo `data-theme` no root element e um `data-mode` para light/dark:

```html
<html data-theme="default" data-mode="light">
<!-- ou -->
<html data-theme="rose" data-mode="dark">
```

No mobile (React Native), usar Zustand store para persistir preferência e Context provider para distribuir o tema.

### 13.4 Ordem de Implementação Sugerida

1. Design system tokens (cores, tipografia, espaçamento) no Tailwind config
2. Theme provider (4 temas + toggle)
3. Componentes base (Button, Input, Card, Badge, Avatar, Toggle)
4. Layout (Sidebar web, Bottom nav mobile, FAB + action sheet)
5. Tela: Meu Dia (home mobile + dashboard web)
6. Tela: Clientes (lista + perfil)
7. Tela: Nova Venda (fluxo 4 steps)
8. Tela: Vendas (lista + detalhe)
9. Tela: Campanhas (lista + criação + stats)
10. Tela: Financeiro
11. Tela: Catálogo + Estoque
12. Tela: Agenda + Calendário
13. Tela: Equipe (condicional)
14. Tela: Menu mobile + Settings + Landing editor
15. Onboarding wizard (5 steps)
16. Polish: loading states, toasts, animações, microinterações

---

**FIM DO DOCUMENTO**

*WBC UI/UX Design System v1.0 — Referência para geração de prompts de implementação.*
*Complementar a: WBC-Funcionalidades-v1.2, WBC-Arquitetura-Tecnica-v1.0, WBC-Implementacao-v1.0*
