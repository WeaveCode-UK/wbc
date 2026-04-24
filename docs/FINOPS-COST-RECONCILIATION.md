# FinOps — Reconciliação de custos com providers

> Contexto: `Auditoria/custos-finops/runs/2026-04-19_21-19-13/achados.md#ACH-010`. Sem `TenantCostSnapshot` e sem processo de reconciliação, não temos como validar que o que o WBC contabilizou internamente bate com a fatura do provider (WhatsApp Meta, DeepSeek, Sentry, Resend). Uma cobrança indevida do provider passaria despercebida; inversamente, bugs no nosso instrumentation levariam a unit economics enganoso.

## Entregáveis desta correção (seed, parcial)

- `packages/business/finops/domain/cost-snapshot.ts`:
  - `TenantCostSnapshot` — o snapshot interno.
  - `ProviderInvoice` — dado externo.
  - `ReconciliationResult` + `ReconciliationStatus`.

## Arquitetura alvo

```
┌──────────────────────────────┐       ┌──────────────────────────────┐
│  eventos outbox (MessageBilled│       │ provider webhook / import    │
│  AI_COST_USED, etc.)         │       │ (Meta WA, DeepSeek, Sentry)  │
└──────────────┬───────────────┘       └──────────────┬───────────────┘
               │                                      │
               ▼                                      ▼
    ┌──────────────────────┐             ┌──────────────────────┐
    │ Worker agregador      │             │ Webhook handler       │
    │ (apps/worker/...)     │             │ (apps/api/...)        │
    └──────────┬───────────┘             └──────────┬───────────┘
               │ upsert                              │ upsert
               ▼                                      ▼
    ┌──────────────────────┐             ┌──────────────────────┐
    │ TenantCostSnapshot    │             │ ProviderInvoice       │
    │ (fonte interna)       │             │ (fonte externa)       │
    └──────────┬───────────┘             └──────────┬───────────┘
               │                                      │
               └──────────────┬───────────────────────┘
                              ▼
                  ┌──────────────────────┐
                  │ ReconciliationJob     │
                  │ (mensal, dia 5)       │
                  └──────────────────────┘
                              │
                              ▼
           emite alert se diff > tolerance (default 5%)
```

## Schema proposto (migration — humano)

```prisma
model TenantCostSnapshot {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId        String   @db.Uuid
  provider        String   // deepseek/whatsapp/sentry
  period          String   // "2026-04"
  totalUsd        Decimal  @db.Decimal(10, 4)
  breakdown       Json?    // { utility: 0.8, marketing: 2.4 }
  eventCount      Int
  closedAt        DateTime
  createdAt       DateTime @default(now())

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, provider, period])
  @@index([period])
  @@map("tenant_cost_snapshots")
}

model ProviderInvoice {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  provider        String   // deepseek/whatsapp/sentry
  period          String   // "2026-04"
  totalUsd        Decimal  @db.Decimal(10, 4)
  breakdown       Json?
  receivedAt      DateTime
  sourceUri       String?  // link ou identificador da fatura externa

  @@unique([provider, period])
  @@map("provider_invoices")
}

model Reconciliation {
  id                 String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  provider           String
  period             String
  snapshotTotalUsd   Decimal  @db.Decimal(10, 4)
  invoiceTotalUsd    Decimal  @db.Decimal(10, 4)
  diffUsd            Decimal  @db.Decimal(10, 4)
  diffPct            Decimal  @db.Decimal(6, 4)  // 0.05 = 5%
  tolerancePct       Decimal  @db.Decimal(6, 4)  // default 0.05
  status             String   // matched/divergent_within_tolerance/divergent_above_tolerance
  resolvedAt         DateTime?
  resolution         String?  // nota da pessoa que fechou
  createdAt          DateTime @default(now())

  @@unique([provider, period])
  @@map("reconciliations")
}
```

## Worker `cost-snapshot-closer`

- Cron mensal (primeiro dia do mês, 03:00 UTC).
- Para cada tenant × provider × período anterior: agrega `MessageCost` + `AiCostEvent` e upserta `TenantCostSnapshot`.
- Idempotente — pode rodar múltiplas vezes no mesmo período.

## Worker `reconciliation-runner`

- Cron mensal (dia 5, 06:00 UTC).
- Para cada provider: soma `TenantCostSnapshot.totalUsd` do período e compara com `ProviderInvoice.totalUsd`.
- Escreve `Reconciliation` com diff e status.
- Se `divergent_above_tolerance`: emite alerta Prometheus + incident.

## Fontes de `ProviderInvoice`

| Provider            | Método                                    | Pendente                                                     |
| ------------------- | ----------------------------------------- | ------------------------------------------------------------ |
| Meta WhatsApp Cloud | Webhook de billing (meta_billing.updated) | Handler em `apps/api/src/webhooks/meta-billing.ts`           |
| DeepSeek            | API de usage (GET /usage?period=...)      | Job `apps/worker/src/processors/deepseek-invoice-fetcher.ts` |
| Sentry              | API de stats                              | Job similar                                                  |
| Resend              | API de usage                              | Job similar                                                  |

## Tolerância default

- **5%** — absorve arredondamento de preço + taxa de câmbio.
- Divergências > 5%: abrir incidente sev-3, investigação.
- Divergências > 20%: sev-2, possível bug no instrumentation ou no provider.

## UI (fase 2)

- `/admin/finops/reconciliation` — lista de reconciliações + filtros por provider/período.
- Botão "Marcar como resolvido" com campo de nota.
- Dashboard Grafana com série histórica de diffs.

## Cross-reference

- Achado origem: `Auditoria/custos-finops/runs/2026-04-19_21-19-13/achados.md#ACH-010`
- Snapshot source: `docs/FINOPS-WHATSAPP-BILLING.md` (ACH-003) + use-cases de AI.
- Observabilidade: `docs/FINOPS-OBSERVABILITY.md` (ACH-004) — dashboards + alertas.
- Retenção das tabelas: `docs/DATA_RETENTION_POLICY.md` — snapshots ficam 3 anos, invoices 5 anos (fiscal).
