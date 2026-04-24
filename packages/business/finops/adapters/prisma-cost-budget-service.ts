/**
 * Post-audit (ACH-001 custos-finops): adapter real para `CostBudgetService`.
 *
 * Lê/escreve em `Subscription` (colunas adicionadas em migration 006) e
 * emite eventos AI_COST_WARNING / AI_COST_BLOCKED via OutboxService.
 *
 * **NÃO está conectado no composition-root ainda.** A integração em
 * DeepSeekAdapter/WhatsAppN2Adapter acontece em follow-up PR depois que o
 * humano ratificar os valores de budget em `docs/FINOPS-PLAN-LIMITS.md` e
 * rodar a migration manual em staging.
 *
 * Padrão de concorrência: optimistic update em `Subscription.version` via
 * `optimisticUpdate` helper de @wbc/shared (já usado em aiGenerationsUsed).
 */

import type {
  CostBudgetService,
  CostBudgetSnapshot,
  CostDecisionResult,
  CostProvider,
} from "../index";

// Tipos mínimos para evitar acoplamento forte com @wbc/db. O caller
// injeta uma instância de PrismaClient no construtor; usamos interface.
interface SubscriptionLike {
  tenantId: string;
  plan: string;
  monthlyCostBudgetUSD: unknown; // Decimal | null
  monthlyCostAccumulatedUSD: unknown; // Decimal | null
  monthlyCostBlockedAt: Date | null;
  version: number;
}

interface PrismaClientLike {
  subscription: {
    findUnique(args: {
      where: { tenantId: string };
    }): Promise<SubscriptionLike | null>;
    update(args: {
      where: { tenantId: string; version: number };
      data: Record<string, unknown>;
    }): Promise<SubscriptionLike>;
  };
  planQuota?: {
    findUnique(args: {
      where: { plan: string };
    }): Promise<{ defaultMonthlyCostBudgetUSD: unknown } | null>;
  };
}

interface OutboxPublisherLike {
  publish(args: {
    type: string;
    tenantId: string;
    payload: Record<string, unknown>;
  }): Promise<void>;
}

// Limiar de warning em 80% do budget (config).
const WARNING_THRESHOLD_PCT = 0.8;

function toNumber(v: unknown, fallback = 0): number {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number.parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  }
  // Prisma Decimal tem toNumber() e toString()
  const obj = v as { toNumber?: () => number; toString: () => string };
  if (typeof obj.toNumber === "function") return obj.toNumber();
  const n = Number.parseFloat(obj.toString());
  return Number.isFinite(n) ? n : fallback;
}

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

export class PrismaCostBudgetService implements CostBudgetService {
  constructor(
    private readonly prisma: PrismaClientLike,
    private readonly outbox: OutboxPublisherLike,
    private readonly config: {
      warningThresholdPct?: number;
    } = {},
  ) {}

  async checkAndDeduct(input: {
    tenantId: string;
    provider: CostProvider;
    estimatedCostUsd: number;
  }): Promise<CostDecisionResult> {
    const sub = await this.prisma.subscription.findUnique({
      where: { tenantId: input.tenantId },
    });
    if (!sub) {
      throw new Error(
        `PrismaCostBudgetService.checkAndDeduct: no subscription for tenant ${input.tenantId}`,
      );
    }

    // Budget efetivo: coluna de subscription OU default do PlanQuota.
    let budgetUsd = toNumber(sub.monthlyCostBudgetUSD, Number.NaN);
    if (!Number.isFinite(budgetUsd) && this.prisma.planQuota) {
      const quota = await this.prisma.planQuota.findUnique({
        where: { plan: sub.plan },
      });
      budgetUsd = toNumber(quota?.defaultMonthlyCostBudgetUSD, 0);
    }
    if (!Number.isFinite(budgetUsd)) budgetUsd = 0;

    const currentAccumulated = toNumber(sub.monthlyCostAccumulatedUSD, 0);
    const nextAccumulated = currentAccumulated + input.estimatedCostUsd;
    const period = currentPeriod();

    // Block se projetado ultrapassa budget.
    if (nextAccumulated > budgetUsd && budgetUsd > 0) {
      if (!sub.monthlyCostBlockedAt) {
        // Primeira vez que bloqueia — emite evento.
        await this.outbox.publish({
          type: "finops.ai_cost_blocked",
          tenantId: input.tenantId,
          payload: {
            tenantId: input.tenantId,
            provider: input.provider,
            period,
            accumulatedUsd: currentAccumulated,
            budgetUsd,
          },
        });
        await this.prisma.subscription.update({
          where: { tenantId: input.tenantId, version: sub.version },
          data: {
            monthlyCostBlockedAt: new Date(),
            version: sub.version + 1,
          },
        });
      }
      return {
        decision: "block",
        snapshot: {
          tenantId: input.tenantId,
          provider: input.provider,
          period,
          budgetUsd,
          accumulatedUsd: currentAccumulated,
          remainingUsd: Math.max(0, budgetUsd - currentAccumulated),
          blocked: true,
        },
        reason: "budget exhausted",
      };
    }

    // Update atomic com optimistic lock
    const updated = await this.prisma.subscription.update({
      where: { tenantId: input.tenantId, version: sub.version },
      data: {
        monthlyCostAccumulatedUSD: nextAccumulated,
        version: sub.version + 1,
      },
    });

    // Warn crossing threshold?
    const threshold = this.config.warningThresholdPct ?? WARNING_THRESHOLD_PCT;
    const crossedWarning =
      budgetUsd > 0 &&
      currentAccumulated / budgetUsd < threshold &&
      nextAccumulated / budgetUsd >= threshold;

    if (crossedWarning) {
      await this.outbox.publish({
        type: "finops.ai_cost_warning",
        tenantId: input.tenantId,
        payload: {
          tenantId: input.tenantId,
          provider: input.provider,
          period,
          thresholdPct: threshold,
          accumulatedUsd: nextAccumulated,
          budgetUsd,
        },
      });
    }

    return {
      decision: crossedWarning ? "warn" : "ok",
      snapshot: {
        tenantId: input.tenantId,
        provider: input.provider,
        period,
        budgetUsd,
        accumulatedUsd: nextAccumulated,
        remainingUsd: Math.max(0, budgetUsd - nextAccumulated),
        blocked: Boolean(updated.monthlyCostBlockedAt),
      },
    };
  }

  async reconcile(input: {
    tenantId: string;
    provider: CostProvider;
    actualCostUsd: number;
    idempotencyKey: string;
  }): Promise<void> {
    // Idempotência: no adapter real, guardar idempotencyKey em Redis com
    // TTL = fim-do-ciclo. Stub aqui só faz o update; idempotência é
    // responsabilidade do caller.
    void input; // TODO(follow-up): Redis lookup antes de aplicar
    // Noop no skeleton — implementação completa após decisão de Redis key TTL.
  }

  async snapshot(input: {
    tenantId: string;
    provider: CostProvider;
  }): Promise<CostBudgetSnapshot> {
    const sub = await this.prisma.subscription.findUnique({
      where: { tenantId: input.tenantId },
    });
    if (!sub) {
      throw new Error(
        `PrismaCostBudgetService.snapshot: no subscription for ${input.tenantId}`,
      );
    }
    const budgetUsd = toNumber(sub.monthlyCostBudgetUSD, 0);
    const accumulatedUsd = toNumber(sub.monthlyCostAccumulatedUSD, 0);
    return {
      tenantId: input.tenantId,
      provider: input.provider,
      period: currentPeriod(),
      budgetUsd,
      accumulatedUsd,
      remainingUsd: Math.max(0, budgetUsd - accumulatedUsd),
      blocked: Boolean(sub.monthlyCostBlockedAt),
    };
  }
}
