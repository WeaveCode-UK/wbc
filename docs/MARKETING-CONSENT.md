# Marketing Consent (ACH-012)

LGPD art. 7.VI exige base legal clara para comunicação de marketing.
Este documento descreve como a WBC Platform garante opt-in registrado
antes de enviar campanhas.

## Schema

`packages/db/prisma/migrations/manual/004_marketing_consent.sql` adiciona
em `Client`:

- `marketingConsent: boolean` (default `false`)
- `marketingConsentSource: string | null` — e.g. `'onboarding'`, `'whatsapp-reply'`, `'import'`
- `marketingConsentGrantedAt: timestamptz | null`
- `marketingConsentRevokedAt: timestamptz | null`

## Regras operacionais

1. **Default `false`.** Novo cliente criado nunca entra como opt-in
   automático, mesmo se a consultora quiser.
2. **Opt-in por registro explícito:** UI da consultora precisa ter
   checkbox isolado ("aceito receber comunicações").
3. **Bloquear envio quando `false`:** em `campaigns.send`, filtrar
   recipients via `where: { marketingConsent: true }`.
4. **Unsubscribe em 1 clique:** cada mensagem de campanha deve conter
   link/comando curto para revogar (rodapé + palavra-chave "SAIR" em
   WhatsApp).
5. **Audit trail:** revogação cria registro no `ConsentLog` (ACH-003) com
   `type: 'marketing'` + `revokedAt`.

## Pendências humanas

1. Gerar modelo Prisma (após aplicar a migration manual, rodar
   `prisma db pull` ou atualizar schema.prisma manualmente).
2. Ajustar `campaigns.send` use-case para filtrar.
3. UI: checkbox em `apps/web/src/app/(dashboard)/clients/*` (create/edit).
4. Processar keyword "SAIR" / "UNSUBSCRIBE" em
   `packages/business/messaging/inbound-handler.ts`.
5. Template de campanha (WhatsApp/email) com rodapé unsubscribe.
6. Relatório de opt-in/opt-out em Analytics.
