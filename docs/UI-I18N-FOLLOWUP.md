# UI i18n — Follow-up (ACH-005, run 2026-04-19_08-47-24)

Origem: auditoria **ui-ux-fluxos** achado ACH-005 — "i18n parcial; validações
e mensagens hardcoded em pt". Correção classificada como `corrigivel_parcial`
porque o volume de strings é grande e a varredura em todas as telas precisa
de validação humana.

## Estado atual (pós-correção seed)

- `packages/i18n/src/locales/{pt-BR,en}/errors.json` semeado com
  `validation.*` (required, invalid_email, too_small, too_big, regex_mismatch,
  invalid_phone_br, invalid_cpf, invalid_cnpj, passwords_do_not_match,
  invalid_date, invalid_credentials, unknown).
- `apps/web/src/lib/zod-i18n.ts` expõe `installZodI18n(t)` + `zodI18nErrorMap(t)`
  — error-map oficial do Zod traduzido via next-intl.
- Não há ainda uma chamada global de `installZodI18n` — cada layout cliente
  precisa instalar o error-map com o `t` do namespace `errors`. A wire-up
  por página fica abaixo.

## Pendências para validação humana

### 1. Instalar o error-map em cada root-layout cliente

Nos arquivos abaixo, chamar `installZodI18n(useTranslations('errors'))` no
topo do componente (antes de `useForm(...)`):

- `apps/web/src/app/(auth)/layout.tsx`
- `apps/web/src/app/(dashboard)/layout.tsx`
- `apps/web/src/app/(public)/layout.tsx` (se existir)

### 2. Namespaces incompletos (sweep manual necessário)

Rodar `rg -n '>[A-Za-zÀ-ú ]+<' apps/web/src/app` e mapear strings em JSX que
não estejam atrás de `t()`. Priorizar:

- `apps/web/src/app/(dashboard)/**/page.tsx` — títulos, empty states, CTA secundários.
- `apps/web/src/components/**` — mensagens de placeholder, helpers, tooltips.
- `apps/mobile/src/screens/**` — texto hardcoded (ver ACH-020, typography tokens).

### 3. Regra ESLint (não incluída no seed)

Considerar `eslint-plugin-react/jsx-no-literals` ou regra customizada para
barrar strings inline em JSX fora de `<code>`, `<pre>`, `sr-only` ou
`data-*`. Adicionar em fase de habilitação gradual (per-file disable).

### 4. Cobertura de mensagens de servidor

Mensagens devolvidas pela API (`apps/api/**`) devem mandar códigos
estruturados (`'validation.invalid_phone_br'`) em vez de strings em pt.
Atualizar `@wbc/validators` para usar `code` discriminado.

### 5. Locale-aware formatação (números/datas/moeda)

Verificar que `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
e `Intl.DateTimeFormat('pt-BR')` estão sendo usados em vez de `toLocaleString()`
implícito ou `toFixed(2)`. Alvos prováveis: dashboards de `/finance` e
`/sales`.

## Critério de fechamento

- (1) todos os layouts cliente instalam o error-map
- (2) sweep manual concluído sem strings em JSX fora de `t()`
- (3) regra ESLint ativa em pelo menos um diretório alvo
- (4) `@wbc/validators` usa códigos discriminados
- (5) relatório de cobertura i18n (script simples de regex) sai limpo
