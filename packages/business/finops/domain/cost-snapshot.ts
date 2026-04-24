/**
 * ACH-010 custos-finops: snapshot mensal de custo por tenant × provider.
 *
 * Modelo puro. O adapter (pendente) persistirá isso no schema
 * `TenantCostSnapshot` após a migration definida em
 * `docs/FINOPS-COST-RECONCILIATION.md`.
 *
 * O snapshot é a fonte-de-verdade interna. A reconciliação compara
 * o snapshot agregado com a fatura real do provider (via webhook ou
 * import CSV) para detectar divergências.
 */

import type { CostProvider } from "./cost-budget";

export interface TenantCostSnapshot {
  tenantId: string;
  provider: CostProvider;
  /** Formato `YYYY-MM`. */
  period: string;
  /** Total debitado no período (US$). */
  totalUsd: number;
  /** Breakdown opcional por sub-categoria (ex.: whatsapp utility vs marketing). */
  breakdown?: Record<string, number>;
  /** Número de chamadas/mensagens contabilizadas. */
  eventCount: number;
  /** Timestamp do fechamento do snapshot (ISO-8601). */
  closedAt: string;
}

export interface ProviderInvoice {
  provider: CostProvider;
  period: string;
  /** Total conforme fatura do provider (fonte externa). */
  totalUsd: number;
  /** Breakdown do provider, se disponível na fatura/webhook. */
  breakdown?: Record<string, number>;
  /** Data de recebimento/processamento da fatura. */
  receivedAt: string;
}

export type ReconciliationStatus =
  | "matched"
  | "divergent_within_tolerance"
  | "divergent_above_tolerance";

export interface ReconciliationResult {
  provider: CostProvider;
  period: string;
  snapshotTotalUsd: number;
  invoiceTotalUsd: number;
  diffUsd: number;
  diffPct: number;
  tolerancePct: number;
  status: ReconciliationStatus;
}
