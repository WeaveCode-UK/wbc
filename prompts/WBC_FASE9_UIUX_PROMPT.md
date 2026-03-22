# [FASE 9] — UI/UX Design System Redesign Completo

> **Fase:** 9 — UI/UX Redesign
> **Épicos:** F9.E01 a F9.E09 (este prompt unificado)
> **Estimativa de tasks:** 55 tasks
> **Doc de referência:** begin/WBC-UI-UX-Design-System-v1.0.md (LER INTEIRO antes de executar)

> **⚠️ ANTES DE EXECUTAR:** Leia begin/WBC_REGRAS_INVIOLAVEIS.md. As seguintes regras são absolutas:
> - NUNCA pare, NUNCA pergunte, NUNCA espere confirmação
> - Execução sequencial — sem subagents
> - Literalidade absoluta — se não está no prompt, não existe
> - domain/ NUNCA importa de adapters/
> - tenantId OBRIGATÓRIO em toda query Prisma
> - ZERO strings hardcoded na UI — tudo via i18n
> - ZERO `any` — tipagem estrita
> - Commits: Conventional Commits em inglês
> - Sem testes durante construção
> - Ao concluir este prompt → checkpoint → NÃO PARAR

---

## CONTEXTO

O WBC completou Fases 1-8. A UI implementada na Fase 6 é funcional mas básica: usa Inter como fonte, não tem sistema de temas, os componentes são genéricos. Este prompt aplica o Design System completo definido em `begin/WBC-UI-UX-Design-System-v1.0.md`.

**CRÍTICO — WEB vs MOBILE são stacks diferentes:**

| | Web (`apps/web/`, `packages/ui/`) | Mobile (`apps/mobile/`, `packages/ui-native/`) |
|---|---|---|
| Elementos | `<div>`, `<button>`, `<input>` | `<View>`, `<TouchableOpacity>`, `<TextInput>` |
| Estilo | Tailwind CSS + CSS custom properties | NativeWind + Zustand ThemeProvider |
| Tema | `[data-theme][data-mode]` no `<html>` | Zustand store + React Context |
| Componentes | `packages/ui/` (já existe, será reescrito) | `packages/ui-native/` (NOVO package) |

Os design tokens são compartilhados via `packages/shared/src/theme/`. Web e mobile consomem o mesmo objeto de tokens, mas cada um aplica do seu jeito.

## PRÉ-CONDIÇÕES

- [x] Fases 1-8 completas
- [x] `packages/ui/` existe com componentes básicos
- [x] `apps/web/` com layout e telas funcionais
- [x] `apps/mobile/` com estrutura Expo base
- [x] Tailwind configurado em `apps/web/tailwind.config.ts`

## RESULTADO ESPERADO

Ao final deste prompt:
- 4 temas (Padrão Light/Dark, Rose Quartz Light/Dark) com troca dinâmica
- Fonte Sora aplicada em toda a interface
- 17 componentes web redesenhados em `packages/ui/`
- 17 componentes mobile nativos em `packages/ui-native/` (NOVO)
- Navegação mobile (bottom nav + FAB + menu hub) e web (sidebar + top bar) redesenhadas
- Todas as telas mobile e web redesenhadas conforme specs
- Microinterações, loading states, responsividade e acessibilidade aplicados

---

# BLOCO 1 — TOKENS DE DESIGN (Tasks 1–6)

---

### TASK 1 de 55 — Tokens de cor compartilhados (TypeScript)

**Objetivo:** Criar arquivo de tokens de cor que web e mobile consomem. Objeto TypeScript puro, zero dependência de CSS ou React Native.

**Arquivos criados:**
- `packages/shared/src/theme/colors.ts` (novo)

**Código:**

```typescript
// packages/shared/src/theme/colors.ts

export const themes = {
  default: {
    light: {
      primary: '#8127E8',
      primaryHover: '#9F5AED',
      primarySurface: '#EDE5FB',
      primarySurfaceHover: '#DDD6FE',
      accent: '#240B33',
      bgPrimary: '#FFFFFF',
      bgSecondary: '#F3F4F6',
      bgTertiary: '#F9FAFB',
      textPrimary: '#111827',
      textSecondary: '#4A4A4A',
      textTertiary: '#6B7280',
      borderPrimary: '#D1D5DB',
      borderSecondary: '#E5E7EB',
      borderTertiary: '#F3F4F6',
      // Semantic
      success: '#059669',
      successBg: '#ECFDF5',
      successText: '#065F46',
      warning: '#D97706',
      warningBg: '#FEF3C7',
      warningText: '#92400E',
      danger: '#DC2626',
      dangerBg: '#FEE2E2',
      dangerText: '#991B1B',
      info: '#2563EB',
      infoBg: '#E6F1FB',
      infoText: '#1E40AF',
    },
    dark: {
      primary: '#9F5AED',
      primaryHover: '#B07CF0',
      primarySurface: '#1E1232',
      primarySurfaceHover: '#2A1B45',
      accent: '#240B33',
      bgPrimary: '#130E1F',
      bgSecondary: '#1A1128',
      bgTertiary: '#0F0A1A',
      textPrimary: '#F3F4F6',
      textSecondary: '#D1D5DB',
      textTertiary: '#9CA3AF',
      borderPrimary: '#4B3A6B',
      borderSecondary: '#2D2640',
      borderTertiary: '#1E1830',
      // Semantic
      success: '#6EE7B7',
      successBg: '#064E3B',
      successText: '#6EE7B7',
      warning: '#FCD34D',
      warningBg: '#78350F',
      warningText: '#FCD34D',
      danger: '#FCA5A5',
      dangerBg: '#7F1D1D',
      dangerText: '#FCA5A5',
      info: '#93C5FD',
      infoBg: '#1E3A5F',
      infoText: '#93C5FD',
    },
  },
  rose: {
    light: {
      primary: '#E91E8C',
      primaryHover: '#F472B6',
      primarySurface: '#FDF2F8',
      primarySurfaceHover: '#FBCFE8',
      accent: '#831843',
      bgPrimary: '#FFFFFF',
      bgSecondary: '#FDF2F8',
      bgTertiary: '#FFFBFC',
      textPrimary: '#1F1115',
      textSecondary: '#6B4555',
      textTertiary: '#9D7A8A',
      borderPrimary: '#F9A8D4',
      borderSecondary: '#F3E0E6',
      borderTertiary: '#FDF2F8',
      success: '#059669',
      successBg: '#ECFDF5',
      successText: '#065F46',
      warning: '#D97706',
      warningBg: '#FEF3C7',
      warningText: '#92400E',
      danger: '#DC2626',
      dangerBg: '#FEE2E2',
      dangerText: '#991B1B',
      info: '#2563EB',
      infoBg: '#E6F1FB',
      infoText: '#1E40AF',
    },
    dark: {
      primary: '#F472B6',
      primaryHover: '#F9A8D4',
      primarySurface: '#2D1422',
      primarySurfaceHover: '#3D1F2E',
      accent: '#831843',
      bgPrimary: '#1A0D14',
      bgSecondary: '#2D1422',
      bgTertiary: '#150A10',
      textPrimary: '#F3F4F6',
      textSecondary: '#D1D5DB',
      textTertiary: '#9CA3AF',
      borderPrimary: '#6B2340',
      borderSecondary: '#3D1F2E',
      borderTertiary: '#2D1422',
      success: '#6EE7B7',
      successBg: '#064E3B',
      successText: '#6EE7B7',
      warning: '#FCD34D',
      warningBg: '#78350F',
      warningText: '#FCD34D',
      danger: '#FCA5A5',
      dangerBg: '#7F1D1D',
      dangerText: '#FCA5A5',
      info: '#93C5FD',
      infoBg: '#1E3A5F',
      infoText: '#93C5FD',
    },
  },
} as const;

export type ThemeName = keyof typeof themes;
export type ThemeMode = 'light' | 'dark';
export type ThemeColors = typeof themes.default.light;

export const classificationColors = {
  A: { bg: '#ECFDF5', text: '#059669' },
  B: { bg: '#FEF3C7', text: '#D97706' },
  C: { bg: '#F3F4F6', text: '#6B7280' },
} as const;
```

**Commit:**
```bash
git add packages/shared/src/theme/colors.ts
git commit -m "feat(shared): add design system color tokens for 4 themes"
```

**PROSSIGA IMEDIATAMENTE para TASK 2.**

---

### TASK 2 de 55 — Tokens de tipografia e espaçamento compartilhados

**Objetivo:** Criar tokens de tipografia, espaçamento, radius e bordas como objetos TypeScript puros.

**Arquivos criados:**
- `packages/shared/src/theme/typography.ts` (novo)
- `packages/shared/src/theme/spacing.ts` (novo)
- `packages/shared/src/theme/index.ts` (novo)

**Código:**

```typescript
// packages/shared/src/theme/typography.ts

export const typography = {
  fonts: {
    primary: 'Sora',
    display: 'Azonix',
    fallbackWeb: 'system-ui, -apple-system, sans-serif',
    fallbackMobile: undefined, // usa fonte nativa do sistema
    mono: "'SF Mono', 'Fira Code', monospace",
  },
  scale: {
    'heading-1': { size: 24, weight: '500' as const, lineHeight: 1.3 },
    'heading-2': { size: 18, weight: '500' as const, lineHeight: 1.3 },
    'heading-3': { size: 15, weight: '500' as const, lineHeight: 1.4 },
    body: { size: 14, weight: '400' as const, lineHeight: 1.5 },
    'body-small': { size: 13, weight: '400' as const, lineHeight: 1.5 },
    caption: { size: 11, weight: '400' as const, lineHeight: 1.4 },
    overline: { size: 10, weight: '500' as const, lineHeight: 1.2, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  },
} as const;

export type TypographyToken = keyof typeof typography.scale;
```

```typescript
// packages/shared/src/theme/spacing.ts

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  12: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const borders = {
  default: 0.5,
  focus: 2,
  priority: 3,
} as const;
```

```typescript
// packages/shared/src/theme/index.ts

export { themes, classificationColors } from './colors';
export type { ThemeName, ThemeMode, ThemeColors } from './colors';
export { typography } from './typography';
export type { TypographyToken } from './typography';
export { spacing, radius, borders } from './spacing';
```

**Arquivos modificados:**
- `packages/shared/src/index.ts` — adicionar: `export * from './theme';`

**Commit:**
```bash
git add packages/shared/src/theme/ packages/shared/src/index.ts
git commit -m "feat(shared): add typography, spacing, radius, and border tokens"
```

**PROSSIGA IMEDIATAMENTE para TASK 3.**

---

### TASK 3 de 55 — CSS dos 4 temas (Web)

**Objetivo:** Criar arquivo CSS com os 4 temas como CSS custom properties. Substituir o arquivo de temas existente.

**Arquivos criados/substituídos:**
- `apps/web/src/styles/themes.css` (substituir integralmente)

**Código:**

Criar o arquivo com EXATAMENTE os 4 blocos de tema. Cada bloco define todas as CSS custom properties para aquela combinação theme+mode. Usar os valores EXATOS do arquivo `begin/WBC-UI-UX-Design-System-v1.0.md` seções 2.1 a 2.5.

Formato:
```css
/* Tema Padrão Light */
[data-theme="default"][data-mode="light"] {
  --color-primary: #8127E8;
  --color-primary-hover: #9F5AED;
  --color-primary-surface: #EDE5FB;
  --color-primary-surface-hover: #DDD6FE;
  --color-accent: #240B33;
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #F3F4F6;
  --color-bg-tertiary: #F9FAFB;
  --color-text-primary: #111827;
  --color-text-secondary: #4A4A4A;
  --color-text-tertiary: #6B7280;
  --color-border-primary: #D1D5DB;
  --color-border-secondary: #E5E7EB;
  --color-border-tertiary: #F3F4F6;
  --color-success: #059669;
  --color-success-bg: #ECFDF5;
  --color-success-text: #065F46;
  --color-warning: #D97706;
  --color-warning-bg: #FEF3C7;
  --color-warning-text: #92400E;
  --color-danger: #DC2626;
  --color-danger-bg: #FEE2E2;
  --color-danger-text: #991B1B;
  --color-info: #2563EB;
  --color-info-bg: #E6F1FB;
  --color-info-text: #1E40AF;
}

/* Tema Padrão Dark */
[data-theme="default"][data-mode="dark"] {
  --color-primary: #9F5AED;
  --color-primary-hover: #B07CF0;
  --color-primary-surface: #1E1232;
  --color-primary-surface-hover: #2A1B45;
  --color-accent: #240B33;
  --color-bg-primary: #130E1F;
  --color-bg-secondary: #1A1128;
  --color-bg-tertiary: #0F0A1A;
  --color-text-primary: #F3F4F6;
  --color-text-secondary: #D1D5DB;
  --color-text-tertiary: #9CA3AF;
  --color-border-primary: #4B3A6B;
  --color-border-secondary: #2D2640;
  --color-border-tertiary: #1E1830;
  --color-success: #6EE7B7;
  --color-success-bg: #064E3B;
  --color-success-text: #6EE7B7;
  --color-warning: #FCD34D;
  --color-warning-bg: #78350F;
  --color-warning-text: #FCD34D;
  --color-danger: #FCA5A5;
  --color-danger-bg: #7F1D1D;
  --color-danger-text: #FCA5A5;
  --color-info: #93C5FD;
  --color-info-bg: #1E3A5F;
  --color-info-text: #93C5FD;
}

/* Tema Rose Quartz Light */
[data-theme="rose"][data-mode="light"] {
  --color-primary: #E91E8C;
  --color-primary-hover: #F472B6;
  --color-primary-surface: #FDF2F8;
  --color-primary-surface-hover: #FBCFE8;
  --color-accent: #831843;
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #FDF2F8;
  --color-bg-tertiary: #FFFBFC;
  --color-text-primary: #1F1115;
  --color-text-secondary: #6B4555;
  --color-text-tertiary: #9D7A8A;
  --color-border-primary: #F9A8D4;
  --color-border-secondary: #F3E0E6;
  --color-border-tertiary: #FDF2F8;
  --color-success: #059669;
  --color-success-bg: #ECFDF5;
  --color-success-text: #065F46;
  --color-warning: #D97706;
  --color-warning-bg: #FEF3C7;
  --color-warning-text: #92400E;
  --color-danger: #DC2626;
  --color-danger-bg: #FEE2E2;
  --color-danger-text: #991B1B;
  --color-info: #2563EB;
  --color-info-bg: #E6F1FB;
  --color-info-text: #1E40AF;
}

/* Tema Rose Quartz Dark */
[data-theme="rose"][data-mode="dark"] {
  --color-primary: #F472B6;
  --color-primary-hover: #F9A8D4;
  --color-primary-surface: #2D1422;
  --color-primary-surface-hover: #3D1F2E;
  --color-accent: #831843;
  --color-bg-primary: #1A0D14;
  --color-bg-secondary: #2D1422;
  --color-bg-tertiary: #150A10;
  --color-text-primary: #F3F4F6;
  --color-text-secondary: #D1D5DB;
  --color-text-tertiary: #9CA3AF;
  --color-border-primary: #6B2340;
  --color-border-secondary: #3D1F2E;
  --color-border-tertiary: #2D1422;
  --color-success: #6EE7B7;
  --color-success-bg: #064E3B;
  --color-success-text: #6EE7B7;
  --color-warning: #FCD34D;
  --color-warning-bg: #78350F;
  --color-warning-text: #FCD34D;
  --color-danger: #FCA5A5;
  --color-danger-bg: #7F1D1D;
  --color-danger-text: #FCA5A5;
  --color-info: #93C5FD;
  --color-info-bg: #1E3A5F;
  --color-info-text: #93C5FD;
}
```

**Commit:**
```bash
git add apps/web/src/styles/themes.css
git commit -m "feat(ui): add CSS custom properties for 4 themes (default/rose × light/dark)"
```

**PROSSIGA IMEDIATAMENTE para TASK 4.**

---

### TASK 4 de 55 — Tailwind config atualizado com tokens

**Objetivo:** Atualizar o tailwind.config.ts para usar CSS custom properties e a escala tipográfica com Sora.

**Arquivos modificados:**
- `apps/web/tailwind.config.ts` (substituir integralmente)

**Código:**

O tailwind.config.ts deve mapear TODOS os tokens de cor para `var(--color-*)`, a escala tipográfica completa (heading-1 a overline), espaçamento (space-1 a space-12), radius (sm, md, lg, xl, full), e definir Sora como font-sans. Copiar a estrutura exata da seção 13.2 do doc de UI/UX, expandindo para TODOS os tokens.

Cores mapeadas: primary, primary-hover, primary-surface, primary-surface-hover, accent, bg-primary, bg-secondary, bg-tertiary, text-primary, text-secondary, text-tertiary, border-primary, border-secondary, border-tertiary, success, success-bg, success-text, warning, warning-bg, warning-text, danger, danger-bg, danger-text, info, info-bg, info-text.

FontFamily: `sans: ['Sora', 'system-ui', '-apple-system', 'sans-serif']`

**Commit:**
```bash
git add apps/web/tailwind.config.ts
git commit -m "feat(ui): update tailwind config with design system tokens and Sora font"
```

**PROSSIGA IMEDIATAMENTE para TASK 5.**

---

### TASK 5 de 55 — Web ThemeProvider

**Objetivo:** Criar provider React que gerencia tema (default/rose) e modo (light/dark) com persistência em localStorage.

**Arquivos criados:**
- `apps/web/src/providers/theme-provider.tsx` (novo)

**Código:**

O ThemeProvider deve:
- Usar React context para expor `{ theme, mode, setTheme, setMode, toggleMode }`
- Persistir em localStorage: `wbc-theme` e `wbc-mode`
- Aplicar `data-theme` e `data-mode` no `document.documentElement` via useEffect
- Default: `theme = 'default'`, `mode = 'light'`
- Tipo: `ThemeName` e `ThemeMode` importados de `@wbc/shared`

**Arquivos modificados:**
- `apps/web/src/app/layout.tsx` — envolver children com `<ThemeProvider>`
- `apps/web/src/styles/globals.css` — adicionar `@import './themes.css';` no topo

**Commit:**
```bash
git add apps/web/src/providers/theme-provider.tsx apps/web/src/app/layout.tsx apps/web/src/styles/globals.css
git commit -m "feat(ui): add web ThemeProvider with localStorage persistence and 4 theme support"
```

**PROSSIGA IMEDIATAMENTE para TASK 6.**

---

### TASK 6 de 55 — Package ui-native + Mobile ThemeProvider

**Objetivo:** Criar o package `packages/ui-native/` para componentes React Native e um ThemeProvider mobile com Zustand.

**Arquivos criados:**
- `packages/ui-native/package.json` (novo)
- `packages/ui-native/tsconfig.json` (novo)
- `packages/ui-native/src/theme/theme-provider.tsx` (novo)
- `packages/ui-native/src/theme/use-theme.ts` (novo)
- `packages/ui-native/src/index.ts` (novo)

**Código:**

`package.json`: name `@wbc/ui-native`, dependencies: `@wbc/shared`, peerDependencies: `react`, `react-native`.

`theme-provider.tsx`: Zustand store com `{ theme: ThemeName, mode: ThemeMode, colors: ThemeColors, setTheme, setMode, toggleMode }`. Quando theme ou mode muda, recalcular `colors` a partir de `themes[theme][mode]` importado de `@wbc/shared`. React Context provider que expõe o store.

`use-theme.ts`: hook `useTheme()` que retorna `{ colors, theme, mode, setTheme, setMode, toggleMode }` do contexto.

**Commit:**
```bash
git add packages/ui-native/
git commit -m "feat(ui-native): create React Native UI package with Zustand ThemeProvider"
```

**PROSSIGA IMEDIATAMENTE para TASK 7.**

---

### TASK 7 de 55 — Carregar fonte Sora (Web)

**Objetivo:** Substituir Inter por Sora no layout web.

**Arquivos modificados:**
- `apps/web/src/app/layout.tsx` — trocar `import { Inter }` por `import { Sora }` de `next/font/google`. Aplicar `sora.className` no `<body>`.

**Commit:**
```bash
git add apps/web/src/app/layout.tsx
git commit -m "feat(ui): replace Inter with Sora font family"
```

**PROSSIGA IMEDIATAMENTE para TASK 8.**

---

### TASK 8 de 55 — Carregar fonte Sora (Mobile)

**Objetivo:** Configurar Sora no Expo via `expo-font` ou Google Fonts. Criar helper de estilos tipográficos para React Native.

**Arquivos criados:**
- `packages/ui-native/src/theme/typography-styles.ts` (novo) — exporta objeto `textStyles` com StyleSheet.create para cada token tipográfico (heading-1 a overline), usando Sora como fontFamily e os valores exatos da escala.

**Arquivos modificados:**
- `apps/mobile/src/App.tsx` — carregar fonte Sora com `useFonts` antes de renderizar. Mostrar splash/loading enquanto carrega.

**Commit:**
```bash
git add packages/ui-native/src/theme/typography-styles.ts apps/mobile/src/App.tsx
git commit -m "feat(ui-native): load Sora font and add typography style objects for React Native"
```

**PROSSIGA IMEDIATAMENTE para TASK 9.**

---

# BLOCO 2 — COMPONENTES WEB (Tasks 9–20)

Cada componente é criado/substituído em `packages/ui/src/components/`. Todos usam CSS custom properties via classes Tailwind mapeadas. Todos exportados no barrel file `packages/ui/src/index.ts`. Todos com i18n onde aplicável. ZERO hex direto — sempre tokens.

---

### TASK 9 de 55 — Web: Button

**Objetivo:** Implementar componente Button com 6 variantes × 4 tamanhos + IconButton conforme seção 5.1 do doc UI/UX.

**Arquivo:** `packages/ui/src/components/button.tsx` (substituir)

Variantes: Primary, Secondary, Outline, Ghost, Danger, Success. Tamanhos: LG (48px), MD (40px), SM (32px), XS (26px). Usar `cva` (class-variance-authority) para variantes. Border-radius: radius-md (10px). IconButton: 40×40px, radius-md. Props tipadas: `variant`, `size`, `icon?`, `loading?`, `disabled?`, `children`.

**Commit:**
```bash
git add packages/ui/src/components/button.tsx
git commit -m "feat(ui): redesign Button with 6 variants, 4 sizes, and IconButton"
```

**PROSSIGA IMEDIATAMENTE para TASK 10.**

---

### TASK 10 de 55 — Web: Input

**Objetivo:** Implementar Input com 4 estados, label obrigatório, helper text, conforme seção 5.2.

**Arquivo:** `packages/ui/src/components/input.tsx` (substituir)

Height: 40px. Radius: radius-md. 4 estados visuais (resting, focus, error, disabled). Label acima do campo (nunca placeholder-only). Helper text abaixo em caption. Error substitui helper em vermelho. Props: `label`, `helperText?`, `error?`, `disabled?`, + todos os props de HTMLInputElement.

**Commit:**
```bash
git add packages/ui/src/components/input.tsx
git commit -m "feat(ui): redesign Input with labeled states and error handling"
```

**PROSSIGA IMEDIATAMENTE para TASK 11.**

---

### TASK 11 de 55 — Web: SearchBar

**Objetivo:** Implementar SearchBar conforme seção 5.3.

**Arquivo:** `packages/ui/src/components/search-bar.tsx` (novo ou substituir)

Bg: bg-secondary. Sem borda. Height: 38px. Radius: radius-md. Ícone lupa à esquerda (Lucide `Search`, 16px, text-tertiary). Placeholder via i18n.

**Commit:**
```bash
git add packages/ui/src/components/search-bar.tsx
git commit -m "feat(ui): add SearchBar component with icon and themed styling"
```

**PROSSIGA IMEDIATAMENTE para TASK 12.**

---

### TASK 12 de 55 — Web: Cards (Elevated, Flat, Action)

**Objetivo:** Implementar 3 variantes de card conforme seção 5.4.

**Arquivo:** `packages/ui/src/components/card.tsx` (substituir)

ElevatedCard: bg-primary, borda 0.5px border-secondary, radius-lg, padding 14px 16px. FlatCard: bg-secondary, sem borda, radius-lg, padding 10px 12px. ActionCard: elevated + border-left 3px (prop `priority`: danger/warning/info/success). Todos com children slot.

**Commit:**
```bash
git add packages/ui/src/components/card.tsx
git commit -m "feat(ui): redesign Card with Elevated, Flat, and Action variants"
```

**PROSSIGA IMEDIATAMENTE para TASK 13.**

---

### TASK 13 de 55 — Web: Badge + Tag

**Objetivo:** Implementar Badge (status) e Tag (classificação) conforme seção 5.5.

**Arquivo:** `packages/ui/src/components/badge.tsx` (substituir)

Badge: retangular, radius 6px, padding 2px 8px, 11px/500. 6 cores (success, warning, danger, primary, info, neutral). Tag: pill radius-full, padding 4px 10px, 11px/500. Props: `variant`, `children`.

**Commit:**
```bash
git add packages/ui/src/components/badge.tsx
git commit -m "feat(ui): redesign Badge and Tag with semantic color variants"
```

**PROSSIGA IMEDIATAMENTE para TASK 14.**

---

### TASK 14 de 55 — Web: Avatar

**Objetivo:** Implementar Avatar com classificação ABC conforme seção 5.6.

**Arquivo:** `packages/ui/src/components/avatar.tsx` (substituir)

Círculo. 3 tamanhos: SM (28px), MD (36px), LG (48px). Font-weight 500. Letra: inicial da classificação ou iniciais do nome. Cores por classificação: A (bg success-bg, text success), B (bg warning-bg, text warning), C (bg bg-secondary, text text-tertiary). Props: `size`, `classification?`, `name`, `imageUrl?`.

**Commit:**
```bash
git add packages/ui/src/components/avatar.tsx
git commit -m "feat(ui): redesign Avatar with ABC classification colors and 3 sizes"
```

**PROSSIGA IMEDIATAMENTE para TASK 15.**

---

### TASK 15 de 55 — Web: SegmentedControl + FilterChips

**Objetivo:** Implementar SegmentedControl e FilterChips conforme seções 5.7 e 5.8.

**Arquivos:**
- `packages/ui/src/components/segmented-control.tsx` (novo)
- `packages/ui/src/components/filter-chips.tsx` (novo)

SegmentedControl: container bg-secondary, radius 8px, padding 2px. Item ativo: bg-primary com shadow, radius 6px. 11px/500. Props: `items: { label, value, count? }[]`, `value`, `onChange`.

FilterChips: horizontal scroll. Pill com borda 0.5px, radius-full, 11px. Ativo: bg primary-surface, text primary. Dot colorido 6×6px opcional. Props: `chips: { label, value, color?, count? }[]`, `selected`, `onChange`.

**Commit:**
```bash
git add packages/ui/src/components/segmented-control.tsx packages/ui/src/components/filter-chips.tsx
git commit -m "feat(ui): add SegmentedControl and FilterChips components"
```

**PROSSIGA IMEDIATAMENTE para TASK 16.**

---

### TASK 16 de 55 — Web: Toggle + ProgressBar

**Objetivo:** Implementar Toggle Switch e Progress Bar conforme seções 5.9 e 5.10.

**Arquivos:**
- `packages/ui/src/components/toggle.tsx` (novo)
- `packages/ui/src/components/progress-bar.tsx` (novo)

Toggle: track 36×20px, knob 16px, radius-full, transição 200ms. On: track primary, knob direita. Off: track border-secondary, knob esquerda. ProgressBar: track 6px (mini: 4px), bg-secondary, radius 3px. Fill: primary por padrão, variantes success/warning/danger. Props: `value` (0-100), `variant?`, `mini?`.

**Commit:**
```bash
git add packages/ui/src/components/toggle.tsx packages/ui/src/components/progress-bar.tsx
git commit -m "feat(ui): add Toggle switch and ProgressBar components"
```

**PROSSIGA IMEDIATAMENTE para TASK 17.**

---

### TASK 17 de 55 — Web: ListItem + Timeline

**Objetivo:** Implementar ListItem e Timeline conforme seções 5.11 e 5.12.

**Arquivos:**
- `packages/ui/src/components/list-item.tsx` (novo)
- `packages/ui/src/components/timeline.tsx` (novo)

ListItem: avatar 38px + info (título 13px/500 + subtítulo 11px/tertiary) + right slot. Padding vertical 10px. Separador 0.5px border-tertiary (exceto último). Timeline: linha vertical 1px border-tertiary. Dots 8×8px coloridos por tipo (success/info/primary/warning/purple). Padding-left conteúdo 18px.

**Commit:**
```bash
git add packages/ui/src/components/list-item.tsx packages/ui/src/components/timeline.tsx
git commit -m "feat(ui): add ListItem and Timeline components"
```

**PROSSIGA IMEDIATAMENTE para TASK 18.**

---

### TASK 18 de 55 — Web: EmptyState + Alert/Banner

**Objetivo:** Implementar EmptyState e Alert conforme seções 5.13 e 5.14.

**Arquivos:**
- `packages/ui/src/components/empty-state.tsx` (novo)
- `packages/ui/src/components/alert.tsx` (novo)

EmptyState: centralizado, ícone 48×48px circle bg-secondary, título 14px/500, descrição 12px/tertiary, CTA botão primary MD. Alert: radius-md, padding 10px 12px, ícone 28-32px circle + texto flex:1. 4 variantes: ia (primary-surface), success, warning, danger.

**Commit:**
```bash
git add packages/ui/src/components/empty-state.tsx packages/ui/src/components/alert.tsx
git commit -m "feat(ui): add EmptyState and Alert/Banner components"
```

**PROSSIGA IMEDIATAMENTE para TASK 19.**

---

### TASK 19 de 55 — Web: ActionSheet + StepIndicator + FunnelChart

**Objetivo:** Implementar os 3 componentes restantes conforme seções 5.15, 5.16, 5.17.

**Arquivos:**
- `packages/ui/src/components/action-sheet.tsx` (novo)
- `packages/ui/src/components/step-indicator.tsx` (novo)
- `packages/ui/src/components/funnel-chart.tsx` (novo)

ActionSheet: slide-up com backdrop, bg-primary, radius top 16px, handle 40×4px pill. StepIndicator: dots 3px height, ativo 36px/primary, inativo 24px/border-tertiary, concluído 24px/primary. FunnelChart: barras horizontais 20px height, radius 4px, largura proporcional, cores degradê.

**Commit:**
```bash
git add packages/ui/src/components/action-sheet.tsx packages/ui/src/components/step-indicator.tsx packages/ui/src/components/funnel-chart.tsx
git commit -m "feat(ui): add ActionSheet, StepIndicator, and FunnelChart components"
```

**PROSSIGA IMEDIATAMENTE para TASK 20.**

---

### TASK 20 de 55 — Web: Barrel file + Toast

**Objetivo:** Atualizar barrel file de `packages/ui/` com todos os componentes novos. Adicionar componente Toast.

**Arquivos:**
- `packages/ui/src/components/toast.tsx` (novo) — posição topo, centralizado, 3s (success/info) ou 5s (danger/warning), ícone + texto + dismiss, slide-down + fade, cores semânticas.
- `packages/ui/src/index.ts` (substituir) — exportar TODOS os componentes: Button, Input, SearchBar, Card (Elevated/Flat/Action), Badge, Tag, Avatar, SegmentedControl, FilterChips, Toggle, ProgressBar, ListItem, Timeline, EmptyState, Alert, ActionSheet, StepIndicator, FunnelChart, Toast, cn.

**Commit:**
```bash
git add packages/ui/src/components/toast.tsx packages/ui/src/index.ts
git commit -m "feat(ui): add Toast component and update barrel file with all 18 components"
```

**PROSSIGA IMEDIATAMENTE para TASK 21.**

---

# BLOCO 3 — COMPONENTES MOBILE / REACT NATIVE (Tasks 21–30)

Cada componente é criado em `packages/ui-native/src/components/`. Todos usam `<View>`, `<Text>`, `<TouchableOpacity>`, `<TextInput>` do React Native. Todos consomem cores via `useTheme().colors`. ZERO CSS — apenas StyleSheet.create ou NativeWind classes. Todos exportados no barrel file.

---

### TASK 21 de 55 — Mobile: Button

**Arquivo:** `packages/ui-native/src/components/button.tsx`

Mesmas 6 variantes e 4 tamanhos do web. Usar `<TouchableOpacity>` com `<Text>` interno. Cores via `useTheme().colors`. Raio via `radius` de `@wbc/shared`. Props idênticas ao web.

**Commit:**
```bash
git add packages/ui-native/src/components/button.tsx
git commit -m "feat(ui-native): add Button component with 6 variants and 4 sizes"
```

**PROSSIGA IMEDIATAMENTE para TASK 22.**

---

### TASK 22 de 55 — Mobile: Input + SearchBar

**Arquivo:** `packages/ui-native/src/components/input.tsx`, `packages/ui-native/src/components/search-bar.tsx`

Input: `<TextInput>` com height 40, radius md. Label com `<Text>` acima. 4 estados visuais. SearchBar: bg secondary, sem borda, height 38, ícone lupa.

**Commit:**
```bash
git add packages/ui-native/src/components/input.tsx packages/ui-native/src/components/search-bar.tsx
git commit -m "feat(ui-native): add Input and SearchBar components"
```

**PROSSIGA IMEDIATAMENTE para TASK 23.**

---

### TASK 23 de 55 — Mobile: Cards (Elevated, Flat, Action)

**Arquivo:** `packages/ui-native/src/components/card.tsx`

3 variantes. ElevatedCard: `<View>` com bg bgPrimary, borderWidth 0.5, borderColor borderSecondary, borderRadius lg. FlatCard: bg bgSecondary, sem borda. ActionCard: elevated + borderLeftWidth 3 + borderLeftColor por prioridade.

**Commit:**
```bash
git add packages/ui-native/src/components/card.tsx
git commit -m "feat(ui-native): add Card components (Elevated, Flat, Action)"
```

**PROSSIGA IMEDIATAMENTE para TASK 24.**

---

### TASK 24 de 55 — Mobile: Badge + Tag + Avatar

**Arquivo:** `packages/ui-native/src/components/badge.tsx`, `packages/ui-native/src/components/avatar.tsx`

Badge: `<View>` com borderRadius sm, padding 2/8. Tag: borderRadius full. Avatar: borderRadius full, 3 tamanhos, cores ABC.

**Commit:**
```bash
git add packages/ui-native/src/components/badge.tsx packages/ui-native/src/components/avatar.tsx
git commit -m "feat(ui-native): add Badge, Tag, and Avatar components"
```

**PROSSIGA IMEDIATAMENTE para TASK 25.**

---

### TASK 25 de 55 — Mobile: SegmentedControl + FilterChips

**Arquivo:** `packages/ui-native/src/components/segmented-control.tsx`, `packages/ui-native/src/components/filter-chips.tsx`

SegmentedControl: `<View>` container com items `<TouchableOpacity>`. FilterChips: `<ScrollView horizontal>` com chips `<TouchableOpacity>`.

**Commit:**
```bash
git add packages/ui-native/src/components/segmented-control.tsx packages/ui-native/src/components/filter-chips.tsx
git commit -m "feat(ui-native): add SegmentedControl and FilterChips components"
```

**PROSSIGA IMEDIATAMENTE para TASK 26.**

---

### TASK 26 de 55 — Mobile: Toggle + ProgressBar

**Arquivo:** `packages/ui-native/src/components/toggle.tsx`, `packages/ui-native/src/components/progress-bar.tsx`

Toggle: `<TouchableOpacity>` com `<Animated.View>` para knob (transição 200ms). ProgressBar: `<View>` track + `<View>` fill com width percentual.

**Commit:**
```bash
git add packages/ui-native/src/components/toggle.tsx packages/ui-native/src/components/progress-bar.tsx
git commit -m "feat(ui-native): add Toggle and ProgressBar components"
```

**PROSSIGA IMEDIATAMENTE para TASK 27.**

---

### TASK 27 de 55 — Mobile: ListItem + Timeline

**Arquivo:** `packages/ui-native/src/components/list-item.tsx`, `packages/ui-native/src/components/timeline.tsx`

ListItem: `<View>` row com avatar + info column + right slot. Separador condicional. Timeline: `<View>` com linha absoluta + dots + conteúdo.

**Commit:**
```bash
git add packages/ui-native/src/components/list-item.tsx packages/ui-native/src/components/timeline.tsx
git commit -m "feat(ui-native): add ListItem and Timeline components"
```

**PROSSIGA IMEDIATAMENTE para TASK 28.**

---

### TASK 28 de 55 — Mobile: EmptyState + Alert + Toast

**Arquivo:** `packages/ui-native/src/components/empty-state.tsx`, `packages/ui-native/src/components/alert.tsx`, `packages/ui-native/src/components/toast.tsx`

Versões React Native dos mesmos componentes web. Toast: `<Animated.View>` com slide de cima + auto-dismiss.

**Commit:**
```bash
git add packages/ui-native/src/components/empty-state.tsx packages/ui-native/src/components/alert.tsx packages/ui-native/src/components/toast.tsx
git commit -m "feat(ui-native): add EmptyState, Alert, and Toast components"
```

**PROSSIGA IMEDIATAMENTE para TASK 29.**

---

### TASK 29 de 55 — Mobile: ActionSheet + StepIndicator

**Arquivo:** `packages/ui-native/src/components/action-sheet.tsx`, `packages/ui-native/src/components/step-indicator.tsx`

ActionSheet: `<Modal>` com `<Animated.View>` slide-up, handle, items. StepIndicator: `<View>` row com dots.

**Commit:**
```bash
git add packages/ui-native/src/components/action-sheet.tsx packages/ui-native/src/components/step-indicator.tsx
git commit -m "feat(ui-native): add ActionSheet and StepIndicator components"
```

**PROSSIGA IMEDIATAMENTE para TASK 30.**

---

### TASK 30 de 55 — Mobile: Barrel file

**Arquivo:** `packages/ui-native/src/index.ts` (atualizar)

Exportar TODOS os componentes + ThemeProvider + useTheme + textStyles.

**Commit:**
```bash
git add packages/ui-native/src/index.ts
git commit -m "feat(ui-native): update barrel file with all 16 components"
```

**PROSSIGA IMEDIATAMENTE para TASK 31.**

---

# BLOCO 4 — NAVEGAÇÃO (Tasks 31–35)

---

### TASK 31 de 55 — Mobile: Bottom Navigation + FAB

**Objetivo:** Implementar bottom nav com 5 tabs e FAB central conforme seção 7.1.

**Arquivo:** `apps/mobile/src/navigation/bottom-tab-bar.tsx` (novo ou substituir)

5 posições: Meu Dia (Clock), Clientes (User), FAB central (Plus, 48×48px circle primary, 24px acima da bar), Vendas (Calendar), Menu (List). Tab ativa: ícone em primary, label em primary. Tab inativa: ícone e label em text-tertiary. Ícones Lucide 18px. FAB abre ActionSheet (task 32).

**Commit:**
```bash
git add apps/mobile/src/navigation/bottom-tab-bar.tsx
git commit -m "feat(mobile): redesign bottom navigation with 5 tabs and central FAB"
```

**PROSSIGA IMEDIATAMENTE para TASK 32.**

---

### TASK 32 de 55 — Mobile: FAB Action Sheet (5 ações)

**Objetivo:** Implementar action sheet que abre ao tocar no FAB conforme seção 7.1.

**Arquivo:** `apps/mobile/src/components/fab-action-sheet.tsx` (novo)

5 ações: Nova venda ($, primary-surface/primary), Nova cliente (+, success-bg/success), Enviar mensagem (M, info-bg/info), Nova campanha (C, warning-bg/warning), Pedir pra IA (A, primary-surface/primary). Cada ação navega para a tela respectiva.

**Commit:**
```bash
git add apps/mobile/src/components/fab-action-sheet.tsx
git commit -m "feat(mobile): add FAB action sheet with 5 quick actions"
```

**PROSSIGA IMEDIATAMENTE para TASK 33.**

---

### TASK 33 de 55 — Mobile: Tela Menu (Hub de Módulos)

**Objetivo:** Implementar tela Menu conforme seção 7.2.

**Arquivo:** `apps/mobile/src/screens/menu-screen.tsx` (novo ou substituir)

Header: avatar + nome + plano + seta pra conta. Banner IA: primary-surface, gerações restantes. 6 grupos grid 3×3: Comunicação (azul), Produtos (âmbar), Planejamento (roxo), Equipe (verde, condicional Leader+), Meu Negócio (rose), Configurações (secondary). Grid items: ícone 36×36px com bg da cor do grupo, radius-lg, bg-secondary, label 10px.

**Commit:**
```bash
git add apps/mobile/src/screens/menu-screen.tsx
git commit -m "feat(mobile): redesign Menu screen as module hub with 6 groups"
```

**PROSSIGA IMEDIATAMENTE para TASK 34.**

---

### TASK 34 de 55 — Web: Sidebar redesenhada

**Objetivo:** Redesenhar sidebar web conforme seção 7.3.

**Arquivo:** `apps/web/src/components/layout/sidebar.tsx` (substituir)

220px expandida, 64px collapsed. 6 grupos com labels overline e dots coloridos: (sem label) primary: Meu Dia + Dashboard. PESSOAS verde: Clientes, Leads, Equipe. NEGÓCIO âmbar: Vendas, Catálogo, Estoque, Financeiro, Entregas. COMUNICAÇÃO azul: Campanhas, Templates, Respostas rápidas, Assistente IA. PLANEJAMENTO roxo: Agenda, Calendário, Metas. MEU PERFIL tertiary: Landing page, Configurações, Indicações. Item ativo: bg primary-surface, text primary, weight 500. Dot 6×6px cor do grupo.

**Commit:**
```bash
git add apps/web/src/components/layout/sidebar.tsx
git commit -m "feat(web): redesign sidebar with 6 groups, colored dots, and collapsible layout"
```

**PROSSIGA IMEDIATAMENTE para TASK 35.**

---

### TASK 35 de 55 — Web: Top Bar redesenhada

**Objetivo:** Redesenhar top bar web conforme seção 9.1.

**Arquivo:** `apps/web/src/components/layout/top-bar.tsx` (substituir)

Height: 56px. Bg: primary. Avatar + nome + badge de plano + sino de notificações + toggle de tema (theme + mode). Texto em branco sobre fundo primary.

**Commit:**
```bash
git add apps/web/src/components/layout/top-bar.tsx
git commit -m "feat(web): redesign top bar with theme toggle and notification badge"
```

**PROSSIGA IMEDIATAMENTE para TASK 36.**

---

# BLOCO 5 — TELAS MOBILE (Tasks 36–46)

Cada tela mobile usa componentes de `@wbc/ui-native`. Dados via tRPC hooks. Todas as labels via i18n. Seguir as specs EXATAS do doc UI/UX seção 8.

---

### TASK 36 de 55 — Mobile: Tela Meu Dia

**Arquivo:** `apps/mobile/src/screens/my-day-screen.tsx` (substituir)
**Ref:** Doc UI/UX §8.1. Greeting contextual + 3 stat flat cards + banner gamificação + quick actions chips + 4 seções com action cards (Urgente vermelho, Lembretes âmbar, Aniversários verde, Agenda azul).

**Commit:**
```bash
git add apps/mobile/src/screens/my-day-screen.tsx
git commit -m "feat(mobile): redesign My Day screen with stats, actions, and priority sections"
```

**PROSSIGA IMEDIATAMENTE para TASK 37.**

---

### TASK 37 de 55 — Mobile: Tela Clientes Lista

**Arquivo:** `apps/mobile/src/screens/clients-list-screen.tsx` (substituir)
**Ref:** Doc UI/UX §8.2. Search bar + segmented control (Todas/Ativas/Leads/Inativas) + filter chips etiquetas + resumo ABC 4 cards + lista com avatar ABC + badges.

**Commit:**
```bash
git add apps/mobile/src/screens/clients-list-screen.tsx
git commit -m "feat(mobile): redesign clients list with segments, filters, and ABC summary"
```

**PROSSIGA IMEDIATAMENTE para TASK 38.**

---

### TASK 38 de 55 — Mobile: Tela Cliente Perfil

**Arquivo:** `apps/mobile/src/screens/client-profile-screen.tsx` (substituir)
**Ref:** Doc UI/UX §8.3. Avatar LG + action strip 4 botões + stats grid 3×2 + card alergia + card cashback + notas + timeline + wishlist + perfil beleza.

**Commit:**
```bash
git add apps/mobile/src/screens/client-profile-screen.tsx
git commit -m "feat(mobile): redesign client profile with full detail sections"
```

**PROSSIGA IMEDIATAMENTE para TASK 39.**

---

### TASK 39 de 55 — Mobile: Tela Nova Venda (4 Steps)

**Arquivo:** `apps/mobile/src/screens/new-sale-screen.tsx` (substituir)
**Ref:** Doc UI/UX §8.4. Step 1: selecionar cliente. Step 2: adicionar produtos com qty control. Step 3: pagamento (PIX/Parcelado/Dinheiro) + cashback + desconto. Step 4: confirmar com toggles WhatsApp e pós-venda. Step indicator no topo. Animação de sucesso pós-confirmação.

**Commit:**
```bash
git add apps/mobile/src/screens/new-sale-screen.tsx
git commit -m "feat(mobile): redesign new sale flow with 4-step wizard"
```

**PROSSIGA IMEDIATAMENTE para TASK 40.**

---

### TASK 40 de 55 — Mobile: Tela Vendas Lista + Financeiro

**Arquivo:** `apps/mobile/src/screens/sales-list-screen.tsx` (substituir), `apps/mobile/src/screens/finance-screen.tsx` (substituir)
**Ref:** Doc UI/UX §8.5 e §8.6. Vendas: stats row + segmented + lista + tabs secundárias. Financeiro: period chips + 4 stat cards + contas a receber + despesas + calculadoras.

**Commit:**
```bash
git add apps/mobile/src/screens/sales-list-screen.tsx apps/mobile/src/screens/finance-screen.tsx
git commit -m "feat(mobile): redesign sales list and finance screens"
```

**PROSSIGA IMEDIATAMENTE para TASK 41.**

---

### TASK 41 de 55 — Mobile: Tela Campanhas (Lista + Nova + Stats)

**Arquivo:** `apps/mobile/src/screens/campaigns-list-screen.tsx`, `apps/mobile/src/screens/new-campaign-screen.tsx`, `apps/mobile/src/screens/campaign-stats-screen.tsx` (substituir)
**Ref:** Doc UI/UX §8.7, §8.8, §8.9. Lista com campaign cards. Nova campanha 3 steps. Stats com funil visual + remarketing CTA + listas negativas.

**Commit:**
```bash
git add apps/mobile/src/screens/campaigns-list-screen.tsx apps/mobile/src/screens/new-campaign-screen.tsx apps/mobile/src/screens/campaign-stats-screen.tsx
git commit -m "feat(mobile): redesign campaigns screens with funnel stats and 3-step creation"
```

**PROSSIGA IMEDIATAMENTE para TASK 42.**

---

### TASK 42 de 55 — Mobile: Tela Catálogo + Estoque

**Arquivo:** `apps/mobile/src/screens/catalog-screen.tsx`, `apps/mobile/src/screens/inventory-screen.tsx` (substituir)
**Ref:** Doc UI/UX §8.10 e §8.11. Catálogo: brand chips + category chips + grid 2 col + toggle view. Estoque: segmented (Todos/Baixo/Zero) + lista badges + ajuste inline + pedidos.

**Commit:**
```bash
git add apps/mobile/src/screens/catalog-screen.tsx apps/mobile/src/screens/inventory-screen.tsx
git commit -m "feat(mobile): redesign catalog and inventory screens"
```

**PROSSIGA IMEDIATAMENTE para TASK 43.**

---

### TASK 43 de 55 — Mobile: Tela Agenda

**Arquivo:** `apps/mobile/src/screens/schedule-screen.tsx` (substituir)
**Ref:** Doc UI/UX §8.12. Toggle view (Dia/Semana/Mês) + calendário mini + timeline eventos + FAB local "Novo agendamento" + criação bottom sheet.

**Commit:**
```bash
git add apps/mobile/src/screens/schedule-screen.tsx
git commit -m "feat(mobile): redesign schedule screen with calendar and timeline"
```

**PROSSIGA IMEDIATAMENTE para TASK 44.**

---

### TASK 44 de 55 — Mobile: Tela Equipe + Landing + Settings

**Arquivo:** `apps/mobile/src/screens/team-screen.tsx`, `apps/mobile/src/screens/landing-editor-screen.tsx`, `apps/mobile/src/screens/settings-theme-screen.tsx` (substituir)
**Ref:** Doc UI/UX §8.13, §8.14, §8.15. Equipe: segmented 3 tabs + ranking com barras. Landing: preview + form + toggle. Settings: 2 temas + toggle dark + select idioma + preview ao vivo.

**Commit:**
```bash
git add apps/mobile/src/screens/team-screen.tsx apps/mobile/src/screens/landing-editor-screen.tsx apps/mobile/src/screens/settings-theme-screen.tsx
git commit -m "feat(mobile): redesign team, landing editor, and theme settings screens"
```

**PROSSIGA IMEDIATAMENTE para TASK 45.**

---

### TASK 45 de 55 — Mobile: Onboarding Wizard (5 Steps)

**Arquivo:** `apps/mobile/src/screens/onboarding-screen.tsx` (novo)
**Ref:** Doc UI/UX §8.16. Step 1: boas-vindas + multi-select marcas. Step 2: foto + perfil + slug. Step 3: importar contatos (3 opções). Step 4: toggles lembretes + pós-venda. Step 5: primeira venda guiada com tooltips + animação celebração. Aparece no primeiro login.

**Commit:**
```bash
git add apps/mobile/src/screens/onboarding-screen.tsx
git commit -m "feat(mobile): add 5-step onboarding wizard with guided first sale"
```

**PROSSIGA IMEDIATAMENTE para TASK 46.**

---

### TASK 46 de 55 — Mobile: Conectar navegação completa

**Objetivo:** Atualizar React Navigation para conectar todas as telas novas com os navigators corretos.

**Arquivo:** `apps/mobile/src/navigation/` (atualizar todos os navigators)

Tab navigator: 4 tabs + menu. Stack navigators por módulo conectando todas as telas. Onboarding como screen inicial condicional (se onboarding não completo).

**Commit:**
```bash
git add apps/mobile/src/navigation/
git commit -m "feat(mobile): connect all redesigned screens to navigation"
```

**PROSSIGA IMEDIATAMENTE para TASK 47.**

---

# BLOCO 6 — TELAS WEB (Tasks 47–52)

Cada tela web usa componentes de `@wbc/ui`. Grid 12 colunas onde aplicável. Padrão: tabela/grid centro + sidebar detalhe direita + filtros topo. Seguir specs EXATAS do doc UI/UX seção 9.

---

### TASK 47 de 55 — Web: Dashboard Home

**Arquivo:** `apps/web/src/app/(dashboard)/page.tsx` (substituir)
**Ref:** Doc UI/UX §9.2. Grid 12 col. Row 1: greeting + "Nova venda". Row 2: 4 stat cards. Row 3: gráfico vendas 30 dias (Recharts LineChart, 8 col) + top 5 produtos (4 col). Row 4: atividades hoje (6 col) + campanhas ativas (6 col). Row 5: clientes atenção (sumindo/cashback/aniversariantes).

**Commit:**
```bash
git add apps/web/src/app/\(dashboard\)/page.tsx
git commit -m "feat(web): redesign dashboard with 12-column grid, charts, and activity feed"
```

**PROSSIGA IMEDIATAMENTE para TASK 48.**

---

### TASK 48 de 55 — Web: Clientes (tabela + sidebar detalhe)

**Arquivo:** `apps/web/src/app/(dashboard)/clients/page.tsx` (substituir)
**Ref:** Doc UI/UX §9.3. Tabela sortável 7 colunas (Cliente, Classificação, Telefone, Marca, Total gasto, Última compra, Status, Ações). Filtros topo + bulk actions. Sidebar detalhe à direita ao clicar.

**Commit:**
```bash
git add apps/web/src/app/\(dashboard\)/clients/page.tsx
git commit -m "feat(web): redesign clients page with sortable table and detail sidebar"
```

**PROSSIGA IMEDIATAMENTE para TASK 49.**

---

### TASK 49 de 55 — Web: Vendas (tabela + modal nova venda)

**Arquivo:** `apps/web/src/app/(dashboard)/sales/page.tsx` (substituir)
**Ref:** Doc UI/UX §9.4. Tabela 8 colunas. Nova venda: modal multi-step (mesmos 4 steps do mobile adaptados pra desktop).

**Commit:**
```bash
git add apps/web/src/app/\(dashboard\)/sales/page.tsx
git commit -m "feat(web): redesign sales page with table and multi-step sale modal"
```

**PROSSIGA IMEDIATAMENTE para TASK 50.**

---

### TASK 50 de 55 — Web: Campanhas + Financeiro

**Arquivo:** `apps/web/src/app/(dashboard)/campaigns/page.tsx`, `apps/web/src/app/(dashboard)/finance/page.tsx` (substituir)
**Ref:** Doc UI/UX §9.5 e §9.6. Campanhas: cards grid ou tabela (toggle) + editor + stats com gráficos. Financeiro: 4 stat cards + bar chart 6 meses (Recharts) + tabelas + calculadoras sidepanel.

**Commit:**
```bash
git add apps/web/src/app/\(dashboard\)/campaigns/page.tsx apps/web/src/app/\(dashboard\)/finance/page.tsx
git commit -m "feat(web): redesign campaigns and finance pages with charts and inline actions"
```

**PROSSIGA IMEDIATAMENTE para TASK 51.**

---

### TASK 51 de 55 — Web: Demais telas (Agenda, Estoque, Equipe, Logística, Landing, Config)

**Arquivo:** Todas as páginas restantes em `apps/web/src/app/(dashboard)/`
**Ref:** Doc UI/UX §9.7. Padrão: tabela/grid centro + sidebar detalhe + filtros topo. Agenda com calendário visual. Equipe condicional por role. Configurações com theme picker.

**Commit:**
```bash
git add apps/web/src/app/\(dashboard\)/
git commit -m "feat(web): redesign all remaining dashboard pages"
```

**PROSSIGA IMEDIATAMENTE para TASK 52.**

---

### TASK 52 de 55 — Web: Layout responsivo + breakpoints

**Objetivo:** Aplicar breakpoints responsivos conforme seção 11 do doc UI/UX em todas as telas web.

**Arquivo:** Todos os layouts e páginas web.

Breakpoints: <640px (mobile layout), 640-768px (grid 2 col), 768-1024px (sidebar collapsed), 1024-1280px (sidebar expandida, max-width 1000px), >1280px (grids 3-4 col, max-width 1200px).

**Commit:**
```bash
git add apps/web/
git commit -m "feat(web): apply responsive breakpoints to all pages"
```

**PROSSIGA IMEDIATAMENTE para TASK 53.**

---

# BLOCO 7 — POLISH (Tasks 53–55)

---

### TASK 53 de 55 — Skeleton screens + loading states

**Objetivo:** Implementar skeleton screens (shimmer) em vez de spinners em toda data async, conforme seção 10.1. Pull-to-refresh no mobile. Infinite scroll com skeleton de 3 itens.

**Arquivos:** Componentes Skeleton em `packages/ui/` e `packages/ui-native/`. Aplicar em todas as telas que carregam dados.

**Commit:**
```bash
git add packages/ui/src/components/skeleton.tsx packages/ui-native/src/components/skeleton.tsx apps/web/ apps/mobile/
git commit -m "feat(ui): add skeleton screens and loading states across all screens"
```

**PROSSIGA IMEDIATAMENTE para TASK 54.**

---

### TASK 54 de 55 — Confirmações destrutivas + Haptic feedback

**Objetivo:** Implementar modal de confirmação destrutiva (seção 10.4) e haptic feedback mobile (seção 10.5).

**Arquivos:** Modal em `packages/ui/` e `packages/ui-native/`. Haptic: usar `expo-haptics` em toggle (light), button (light), ação destrutiva (notification error), pull-to-refresh (medium), FAB (medium).

**Commit:**
```bash
git add packages/ui/src/components/confirm-modal.tsx packages/ui-native/src/components/confirm-modal.tsx apps/mobile/
git commit -m "feat(ui): add destructive confirmation modals and haptic feedback"
```

**PROSSIGA IMEDIATAMENTE para TASK 55.**

---

### TASK 55 de 55 — Acessibilidade WCAG AA

**Objetivo:** Verificar e corrigir acessibilidade conforme seção 12 do doc UI/UX em todos os componentes e telas.

Checklist: contraste 4.5:1 nos 4 temas, touch targets 44×44px mínimo, labels em todos os inputs (nunca placeholder-only), estados visuais não dependem só de cor, `prefers-reduced-motion` respeitado, screen reader labels em botões e ícones, focus ring visível no web.

**Arquivos:** Todos os componentes de `packages/ui/` e `packages/ui-native/` que precisem de ajuste.

**Commit:**
```bash
git add packages/ui/ packages/ui-native/ apps/web/ apps/mobile/
git commit -m "feat(ui): enforce WCAG AA accessibility across all components and screens"
```

---

## FINALIZAÇÃO

Execute EXATAMENTE esta sequência:

1. `git add -A`
2. `git commit -m "feat(ui): complete Phase 9 — UI/UX Design System Redesign"`
3. Atualizar prompts/STATE.json: `current_epic = "F9.E10"`, `current_task = 0`
4. `git add prompts/STATE.json && git commit -m "state: F9 implementation complete — advancing to F9.E10 (checkpoint)"`
5. Executar checkpoint:
   ```bash
   pnpm install
   pnpm type-check
   # Se falhar: corrigir, max 3 tentativas, depois BLOCKED
   git tag v1.3.0-fase-09
   ```
6. Atualizar STATE.json: `phase_summary.phase_9 = { status: "COMPLETED", tag: "v1.3.0-fase-09" }`, `status = "BUILD_COMPLETE"`
7. `git add prompts/STATE.json && git commit -m "state: phase 09 complete — UI/UX Redesign BUILD COMPLETE"`

**PARAR. Reportar: "FASE 9 COMPLETA — UI/UX Design System Redesign — v1.3.0-fase-09"**
