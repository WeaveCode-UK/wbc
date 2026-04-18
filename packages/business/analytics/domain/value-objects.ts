// Regras de negócio puras de analytics — extraídas de adapters (ACH-005).
// domain/ é a autoridade sobre classificação ABC, engagement e métricas derivadas.

import {
  MS_PER_DAY,
  ENGAGEMENT_SCORE_MAX,
  ENGAGEMENT_WEIGHT_PER_SALE,
  ENGAGEMENT_RECENCY_THRESHOLD_RECENT,
  ENGAGEMENT_RECENCY_BONUS_RECENT,
  ENGAGEMENT_RECENCY_THRESHOLD_MODERATE,
  ENGAGEMENT_RECENCY_BONUS_MODERATE,
  ABC_PERCENTILE_A,
  ABC_PERCENTILE_B,
} from "./constants";

// Ticket médio: divisão com guarda para zero vendas.
export function computeAvgTicket(
  totalRevenue: number,
  totalSales: number,
): number {
  return totalSales > 0 ? totalRevenue / totalSales : 0;
}

// Dias desde uma data até um instante de referência; negativo significa "nunca ocorreu".
// Convenção: se a data é null/undefined, retorna -1.
export function computeDaysSince(
  date: Date | null | undefined,
  now: Date = new Date(),
): number {
  if (!date) return -1;
  return Math.floor((now.getTime() - date.getTime()) / MS_PER_DAY);
}

// Recency bonus: reconhece clientes recentes; 0 se houve muito tempo desde a última compra.
export function computeRecencyBonus(daysSinceLastPurchase: number): number {
  if (daysSinceLastPurchase < 0) return 0; // nunca comprou
  if (daysSinceLastPurchase < ENGAGEMENT_RECENCY_THRESHOLD_RECENT) {
    return ENGAGEMENT_RECENCY_BONUS_RECENT;
  }
  if (daysSinceLastPurchase < ENGAGEMENT_RECENCY_THRESHOLD_MODERATE) {
    return ENGAGEMENT_RECENCY_BONUS_MODERATE;
  }
  return 0;
}

// Score de engajamento: peso por venda + bônus de recência, limitado ao teto.
export function computeEngagementScore(
  salesCount: number,
  daysSinceLastPurchase: number,
): { score: number; recencyBonus: number } {
  const recencyBonus = computeRecencyBonus(daysSinceLastPurchase);
  const rawScore = salesCount * ENGAGEMENT_WEIGHT_PER_SALE + recencyBonus;
  return {
    score: Math.min(ENGAGEMENT_SCORE_MAX, rawScore),
    recencyBonus,
  };
}

export type ABCClass = "A" | "B" | "C";

export interface ClientSpending {
  id: string;
  totalSpent: number;
}

// Classificação ABC: ordena por totalSpent desc e atribui classe por percentil acumulado.
// Retorna IDs agrupados por classe, na mesma ordem do input (mas reordenado internamente).
export function classifyABC(clients: readonly ClientSpending[]): {
  aIds: string[];
  bIds: string[];
  cIds: string[];
} {
  const sorted = [...clients].sort((a, b) => b.totalSpent - a.totalSpent);
  const total = sorted.length;
  const aIds: string[] = [];
  const bIds: string[] = [];
  const cIds: string[] = [];

  for (let i = 0; i < total; i++) {
    const client = sorted[i];
    if (!client) continue;
    const percentile = (i + 1) / total;
    if (percentile <= ABC_PERCENTILE_A) aIds.push(client.id);
    else if (percentile <= ABC_PERCENTILE_B) bIds.push(client.id);
    else cIds.push(client.id);
  }

  return { aIds, bIds, cIds };
}
