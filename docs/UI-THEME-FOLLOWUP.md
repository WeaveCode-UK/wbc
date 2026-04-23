# Theme Persistence — Follow-up (ACH-019, run 2026-04-19_08-47-24)

Origem: auditoria **ui-ux-fluxos** achado ACH-019 — "Temas default-dark e
rose-dark parcialmente implementados". Classificado como
`corrigivel_parcial` porque a persistência SSR requer mudanças em layouts
que extrapolam o escopo desta correção.

## Estado atual (pós-seed)

- `apps/web/src/providers/theme-provider.tsx` agora persiste tanto em
  `localStorage` quanto em cookie (`wbc-theme`, `wbc-mode`). TTL 1 ano,
  SameSite=Lax.
- Novo helper `parseThemeCookies(cookieHeader)` lê o cookie no servidor.
- `ThemeProvider` aceita `initialTheme` / `initialMode` (defaults para
  'default' / 'light') para permitir hydration consistente.

## Pendências para validação humana

### 1. Wire-up SSR em `app/layout.tsx` root

```tsx
// apps/web/src/app/layout.tsx
import { cookies } from "next/headers";
import { parseThemeCookies } from "@/providers/theme-provider";

export default async function RootLayout({ children }) {
  const cookieHeader = (await cookies()).toString();
  const { theme, mode } = parseThemeCookies(cookieHeader);
  return (
    <html
      lang="pt-BR"
      data-theme={theme ?? "default"}
      data-mode={mode ?? "light"}
    >
      <body>
        <ThemeProvider initialTheme={theme} initialMode={mode}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 2. Unificação com mobile

- `apps/mobile/src/providers/theme-provider.tsx` (se existir) precisa usar
  o mesmo par `theme`/`mode` e persistir em `AsyncStorage`.
- Nome da chave deve ser `wbc-theme` / `wbc-mode` para facilitar depuração
  em logs e testes E2E compartilhados.

### 3. Respeitar `prefers-color-scheme`

- Na primeira visita (sem cookie), honrar `window.matchMedia('(prefers-color-scheme: dark)')`.
- Adicionar listener para atualizações em tempo real quando o OS muda.

### 4. Implementar os 4 temas completos

- Verificar que `packages/shared/src/theme/colors.ts` cobre `rose.light` e
  `rose.dark` com a mesma profundidade do `default.*`.
- O seletor na `(dashboard)/layout.tsx` deve permitir escolher qualquer um
  dos 4 — hoje alterna só `theme` e `mode` em eixos separados, o que dá
  os 4 mas sem um picker único.

### 5. Evitar flash of wrong theme

- Testar em produção se ainda há FOUC (flash of unstyled content). Se
  sim, adicionar script inline no `<head>` que lê o cookie antes do
  bundle React carregar.

## Critério de fechamento

- (1) `app/layout.tsx` lê o cookie e passa para o ThemeProvider
- (2) mobile usa `AsyncStorage` com a mesma estrutura
- (3) `prefers-color-scheme` honrado na primeira visita
- (4) script inline no `<head>` evita FOUC
