# FinOps — Rateio de custo WhatsApp por tenant

> Contexto: `Auditoria/custos-finops/runs/2026-04-19_21-19-13/achados.md#ACH-003`. A Meta Cloud API cobra por conversação iniciada, não por mensagem; o preço varia por categoria e país. Hoje o `whatsapp-n2-adapter.ts` envia mensagens mas não registra o custo por tenant, tornando **impossível** saber quanto cada consultora está custando em WhatsApp — seja para unit economics, seja para cost kill-switch (ACH-001), seja para rateio justo da fatura mensal da Meta.

## Entregáveis desta correção (seed, parcial)

- `packages/business/messaging/ports/message-billing.ts`:
  - Tipo `WhatsAppConversationCategory`.
  - Interface `MessageBillingEvent`.
  - Interface `MessageBillingPort`.
  - `NoopMessageBillingPort` para dev/testes.

## O que falta (humano)

### 1. Evento outbox `MessageBilled`

Schema em `packages/shared/src/events/schemas/messaging.ts`:

```ts
export const MessageBilledSchema = z.object({
  tenantId: z.string().uuid(),
  messageId: z.string(),
  toPhoneRedacted: z.string(),
  category: z.enum(["utility", "marketing", "service", "authentication"]),
  costUsd: z.number().nonnegative(),
  sentAt: z.string().datetime(),
  conversationAlreadyOpen: z.boolean(),
});
```

### 2. Adapter real

`packages/business/messaging/adapters/outbox-message-billing-port.ts`:

- Implementa `MessageBillingPort` via `OutboxService`.
- Idempotência via `UNIQUE (messageId)` na tabela `MessageCost` agregada.
- Fires-and-forgets — erro não deve bloquear o envio (já rolou).

### 3. Integração no `WhatsAppN2Adapter`

```ts
// pseudo — pendente
class WhatsAppN2Adapter {
  constructor(
    private readonly billing: MessageBillingPort,
    // ... demais deps
  ) {}

  async send(tenantId: string, msg: OutboundMessage) {
    const result = await this.callMetaCloudAPI(msg);

    // Dispara fire-and-forget; se falhar, log + retry via outbox.
    void this.billing.record({
      tenantId,
      messageId: result.messageId,
      toPhoneRedacted: redactPhone(msg.to),
      category: this.categorizeConversation(msg, result),
      costUsd: this.priceTable.get(category, country),
      sentAt: new Date().toISOString(),
      conversationAlreadyOpen: result.inExistingConversation,
    });

    return result;
  }
}
```

### 4. Tabela de preços

`packages/business/messaging/domain/whatsapp-pricing.ts` com preços Meta por categoria × país:

```ts
export const WHATSAPP_PRICING_BR: Record<WhatsAppConversationCategory, number> =
  {
    utility: 0.008,
    marketing: 0.04,
    service: 0.0, // janela 24h grátis
    authentication: 0.018,
  };
```

Preços mudam periodicamente — consultar documento oficial Meta trimestralmente e atualizar.

### 5. Agregação

Worker diário (`apps/worker/src/processors/whatsapp-cost-aggregation.ts`):

- Consome `MessageBilled` events.
- Agrega em tabela `TenantMonthlyWhatsAppCost { tenantId, period, utilityUsd, marketingUsd, authUsd, totalUsd }`.
- Permite query "quanto gastamos no Meta por tenant este mês".

### 6. Reconciliação com fatura Meta

Ver `docs/FINOPS-COST-RECONCILIATION.md` (ACH-010).

## Schema proposto (migration — humano)

```prisma
model MessageCost {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId       String   @db.Uuid
  messageId      String   @unique  // idempotência
  category       String   // utility/marketing/service/authentication
  costUsd        Decimal  @db.Decimal(10, 6)
  sentAt         DateTime
  createdAt      DateTime @default(now())

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId, sentAt])
  @@map("message_costs")
}

model TenantMonthlyWhatsAppCost {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId       String   @db.Uuid
  period         String   // "2026-04"
  utilityUsd     Decimal  @db.Decimal(10, 4)
  marketingUsd   Decimal  @db.Decimal(10, 4)
  authUsd        Decimal  @db.Decimal(10, 4)
  totalUsd       Decimal  @db.Decimal(10, 4)
  updatedAt      DateTime @updatedAt

  @@unique([tenantId, period])
  @@map("tenant_monthly_whatsapp_costs")
}
```

## Privacidade

- `toPhoneRedacted` deve ser hash HMAC (não reversível) ou máscara (`+5511***-1234`).
- Nunca armazenar o número completo em `MessageCost` — cross-ref `seguranca/ACH-008 compliance-privacidade`.

## Cross-reference

- Achado origem: `Auditoria/custos-finops/runs/2026-04-19_21-19-13/achados.md#ACH-003`
- Kill-switch: `docs/FINOPS-KILL-SWITCH.md` (ACH-001) — consome os dados agregados.
- Plan limits: `docs/FINOPS-PLAN-LIMITS.md` (ACH-002) — define os limites.
- Reconciliação: `docs/FINOPS-COST-RECONCILIATION.md` (ACH-010).
- Preços: `docs/PRICING.md` seção 3.1.
