---
last_reviewed: 2026-04-23
next_review_due: 2027-04-23
reviewers: [dpo, legal]
version: 0.1.0-draft
---

# Cookies Policy (ACH-016)

## Cookies em uso

| Nome                      | Tipo          | Finalidade                  | Retenção | Essencial? |
| ------------------------- | ------------- | --------------------------- | -------- | ---------- |
| `next-auth.session-token` | Autenticação  | Sessão NextAuth             | 14 dias  | Sim        |
| `next-auth.csrf-token`    | Segurança     | CSRF                        | sessão   | Sim        |
| `wbc-theme`               | Preferência   | Tema visual (ACH-019 ui-ux) | 1 ano    | Sim        |
| `wbc-mode`                | Preferência   | Light/Dark                  | 1 ano    | Sim        |
| `wbc-cookie-consent`      | Consentimento | Preferências deste banner   | 1 ano    | Sim        |

Não temos analytics de 3ª parte hoje. Quando forem introduzidos
(Google Analytics, Mixpanel, etc.), precisam cumprir:

1. Só disparar se `preferences.analytics === true`.
2. Aparecer nesta tabela.
3. Declarar sub-processador em `docs/SUB_PROCESSORS.md`.

## Banner

`apps/web/src/components/cookie-consent-banner.tsx` exibe aviso com
ação "Só essenciais" / "Aceitar todos". Preferência persiste em
`localStorage` chave `wbc-cookie-consent`.

## Integração com app

```tsx
// app/layout.tsx (root)
import { CookieConsentBanner } from "@/components/cookie-consent-banner";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
```

⚠️ Pendente wire-up no root layout — quando fizer, lembrar de ler a
preferência antes de carregar qualquer SDK de analytics.

## GDPR vs LGPD

- **GDPR:** consentimento **explícito** para não-essenciais antes de
  disparar o cookie. Banner deve aparecer **antes** de setar qualquer
  cookie opcional.
- **LGPD:** base legal pode ser legítimo interesse para essenciais;
  consentimento para analytics/marketing.

## Pendências humanas

1. Wire-up do banner no root layout.
2. Implementar helper `useAnalyticsConsent()` que lê a preferência.
3. Preferences center em Settings → Privacidade (revisar/revogar).
4. Se introduzir analytics, atualizar tabela + `SUB_PROCESSORS.md`.
5. Considerar `vanilla-cookieconsent` (biblioteca open-source) para UX
   mais rica se necessário.
