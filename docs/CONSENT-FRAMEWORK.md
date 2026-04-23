# Consent Framework (ACH-003)

LGPD art. 7.I define consentimento como uma das bases legais. Consentimento
precisa ser **livre, informado, inequívoco e específico**. Este documento
define o framework técnico para captar, armazenar, revogar e auditar
consentimentos.

## Schema

Tabela `ConsentLog` criada por
`packages/db/prisma/migrations/manual/003_consent_log.sql` com RLS.

Colunas principais:

- `type` — `'privacy_policy_v1'`, `'marketing'`, `'international_transfer'`,
  `'sensitive_data_allergies'`, etc.
- `version` — versão do texto de consentimento no momento do aceite.
- `granted_at` / `revoked_at` — datas (timestamps UTC).
- `source` — `'onboarding'`, `'settings'`, `'api'`, etc.
- `ip_address` + `user_agent` — evidência do ato.

## Tipos iniciais

| Tipo                       | Onde é coletado            | Versão inicial |
| -------------------------- | -------------------------- | -------------- |
| `privacy_policy_v1`        | Onboarding (obrigatório)   | 0.1.0-draft    |
| `international_transfer`   | Onboarding (obrigatório)   | 0.1.0-draft    |
| `marketing`                | Client (ACH-012, opcional) | 1.0.0          |
| `sensitive_data_allergies` | Client — criação/edição    | 1.0.0          |

## Uso

### Registrar consentimento

```ts
await prisma.consentLog.create({
  data: {
    id: uuidv4(),
    tenantId,
    accountId,
    type: "privacy_policy_v1",
    version: "0.1.0-draft",
    grantedAt: new Date(),
    source: "onboarding",
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
  },
});
```

### Revogar consentimento

Criar novo registro com `revokedAt` setado (não atualizar o registro
anterior — o log é append-only para auditoria).

### Consultar consentimento ativo

Ver índice `consent_log_active_idx`:

```ts
const active = await prisma.consentLog.findFirst({
  where: {
    tenantId,
    accountId,
    type: "marketing",
    revokedAt: null,
    grantedAt: { not: null },
  },
  orderBy: { grantedAt: "desc" },
});
```

## Pendências humanas

1. Gerar modelo Prisma correspondente (tabela criada via SQL manual —
   adicionar em `schema.prisma` também).
2. Implementar use-case `grantConsent` / `revokeConsent` em
   `packages/business/privacy/`.
3. Wire-up em apps/web onboarding (checkbox `privacy_policy_v1`).
4. Wire-up em Settings → Privacidade para revogar.
5. Endpoint `privacy.consentHistory` (novo — extensão ACH-001).
6. Exportar consentimentos no export de dados (ACH-001).
