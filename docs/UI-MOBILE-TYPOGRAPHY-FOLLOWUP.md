# Mobile Typography Tokens — Follow-up (ACH-020, run 2026-04-19_08-47-24)

Origem: auditoria **ui-ux-fluxos** achado ACH-020 — "Typography no mobile com
`fontFamily`/tamanhos hardcoded". Classificado como `corrigivel_parcial`
porque a migração de todas as telas mobile extrapola o escopo da correção.

## Estado atual (pós-seed)

- `packages/ui-native/src/theme/typography-styles.ts` já exporta
  `textStyles` com `display-lg`, `heading-1`, `heading-2`, `heading-3`,
  `body`, `body-small`, `caption`, `overline` (paridade com web).
- `apps/mobile/src/screens/new-sale-screen.tsx` migrou o **headerTitle** e
  **headerStep** para `textStyles['heading-2']` / `textStyles.caption`
  como exemplo de uso.

## Pendências para validação humana

### 1. Sweep em new-sale-screen.tsx

Migrar também estes estilos (ainda hardcoded):

- `overlineLabel` → `textStyles.overline`
- `clientName` → `textStyles['heading-3']`
- `clientMeta` → `textStyles.caption`
- `itemName` / `itemPrice` → `textStyles['body-small']`
- `paymentOverline` → `textStyles.overline`
- `paymentTotal` → `textStyles['display-lg']`
- `paymentLineLabel` / `paymentLineValue` → `textStyles.caption`
- `paymentFinalLabel` → `textStyles['heading-3']`
- `paymentFinalValue` → `textStyles['heading-1']`
- `deliveryLabel` → `textStyles['body-small']`
- `toggleTitle` → `textStyles['body-small']` (peso 700)
- `toggleSubtitle` → `textStyles.caption`

### 2. Sweep nas demais telas mobile

- `apps/mobile/src/screens/**/*.tsx` — procurar `fontFamily`, `fontSize`,
  `fontWeight`, `lineHeight` em `StyleSheet.create`; substituir.
- Garantir que NENHUMA tela use `fontFamily: 'Epilogue'|'Sora'|'Manrope'`
  diretamente. Fontes vivem em `fontFamilies`.

### 3. ESLint rule

- Regra que proíbe `fontFamily|fontSize|fontWeight|lineHeight` em StyleSheet
  dentro de `apps/mobile/**`. Exceção: `packages/ui-native/**`.

### 4. Consistência de pesos com web

- Web usa classes como `text-heading-1` via Tailwind plugin. Os valores
  devem bater com `textStyles['heading-1']` (fontSize 24, lineHeight 31.2).
- Se divergirem, atualizar o plugin em `packages/shared/src/theme/`.

## Critério de fechamento

- (1) zero referências a `fontFamily: 'Epilogue'|'Sora'|'Manrope'` em `apps/mobile`
- (2) zero valores numéricos de fontSize > 12 em telas mobile (tudo via tokens)
- (3) ESLint rule ativa em CI
