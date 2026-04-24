// ACH-011 apis-integracoes: event payload schemas.
//
// Events leaving the outbox travel with `type: string` and `payload: unknown`.
// Consumers cast the payload from memory of the producer's TypeScript types,
// which is fragile across deploys and silent when a field is renamed.
//
// This registry is the runtime contract: for every seeded event `publish()`
// validates `payload` with Zod before persisting it, and consumers re-validate
// when they pull it out of the outbox. An unseeded event still publishes
// (registry miss → log warn, persist as-is) so the migration can happen
// module-by-module without a big-bang change.
//
// Seeding policy: when you add or touch a `publish<T>(EVENTS.X, ...)` call,
// seed the matching schema here. See `docs/architecture/event-schemas.md`
// for the naming convention (`module.action` today; `module.action.vN`
// once a payload shape needs a breaking change).

import { z } from "zod";
import { EVENTS, type EventType } from "./domain-event";
import { createLogger } from "../logger";

const logger = createLogger("event-schemas");

// Seed: three high-traffic events picked for coverage across modules.
// Intentional narrow shape — schemas document the *contract*, not every
// field the producer happens to carry. Extra fields pass through via
// `.passthrough()` so a new optional field in the producer doesn't break
// consumers that haven't redeployed yet.

export const SaleConfirmedPayloadSchema = z
  .object({
    saleId: z.string().uuid(),
    totalCents: z.number().int().min(0),
    clientId: z.string().uuid().nullable(),
  })
  .passthrough();

export const CampaignDispatchedPayloadSchema = z
  .object({
    campaignId: z.string().uuid(),
    recipientCount: z.number().int().min(0),
  })
  .passthrough();

export const StockDepletedPayloadSchema = z
  .object({
    productId: z.string().uuid(),
    tenantId: z.string().uuid(),
  })
  .passthrough();

// Post-audit (ACH-001/003/012 custos-finops): finops event schemas.
// Consumidos pelo worker para agregar TenantCostSnapshot + Prometheus metrics.

const CostProviderSchema = z.enum(["deepseek", "whatsapp", "sentry"]);
const PeriodSchema = z.string().regex(/^\d{4}-\d{2}$/);

export const AiCostWarningPayloadSchema = z
  .object({
    tenantId: z.string().uuid(),
    provider: CostProviderSchema,
    period: PeriodSchema,
    thresholdPct: z.number().min(0).max(1), // 0.8 = 80%
    accumulatedUsd: z.number().nonnegative(),
    budgetUsd: z.number().nonnegative(),
  })
  .passthrough();

export const AiCostBlockedPayloadSchema = z
  .object({
    tenantId: z.string().uuid(),
    provider: CostProviderSchema,
    period: PeriodSchema,
    accumulatedUsd: z.number().nonnegative(),
    budgetUsd: z.number().nonnegative(),
  })
  .passthrough();

export const MessageBilledPayloadSchema = z
  .object({
    tenantId: z.string().uuid(),
    messageId: z.string(),
    toPhoneRedacted: z.string(),
    category: z.enum(["utility", "marketing", "service", "authentication"]),
    costUsd: z.number().nonnegative(),
    sentAt: z.string().datetime(),
    conversationAlreadyOpen: z.boolean(),
  })
  .passthrough();

export const eventSchemaRegistry: Partial<Record<EventType, z.ZodTypeAny>> = {
  [EVENTS.SALE_CONFIRMED]: SaleConfirmedPayloadSchema,
  [EVENTS.CAMPAIGN_DISPATCHED]: CampaignDispatchedPayloadSchema,
  [EVENTS.STOCK_DEPLETED]: StockDepletedPayloadSchema,
  [EVENTS.AI_COST_WARNING]: AiCostWarningPayloadSchema,
  [EVENTS.AI_COST_BLOCKED]: AiCostBlockedPayloadSchema,
  [EVENTS.MESSAGE_BILLED]: MessageBilledPayloadSchema,
};

export interface ValidateEventPayloadResult {
  ok: boolean;
  /** Zod error message — present when `ok` is false and a schema existed. */
  error?: string;
  /** `true` when no schema is registered for this event type. */
  unregistered?: boolean;
}

/**
 * Validate a payload against the registry. Non-throwing by design so the
 * caller (publisher or consumer) decides whether to reject, warn, or accept.
 *
 * During rollout the publisher logs warn on validation failures but still
 * persists the event — the intent is to surface the drift without breaking
 * in-flight mutations. Flip to hard-reject once every event is seeded.
 */
export function validateEventPayload(
  type: EventType,
  payload: unknown,
): ValidateEventPayloadResult {
  const schema = eventSchemaRegistry[type];
  if (!schema) {
    return { ok: true, unregistered: true };
  }
  const result = schema.safeParse(payload);
  if (result.success) return { ok: true };
  return { ok: false, error: result.error.message };
}

/**
 * Warn-only helper invoked by `publish()` — keeps the publisher
 * non-breaking during the migration, surfaces drift via structured logs,
 * and advertises both branches (seeded-fail and not-yet-seeded) so ops
 * can prioritise schema authoring.
 */
export function logIfInvalidEventPayload(
  type: EventType,
  payload: unknown,
): void {
  const result = validateEventPayload(type, payload);
  if (result.unregistered) {
    logger.warn(
      { eventType: type },
      "Event type has no registered Zod schema (ACH-011 migration pending)",
    );
    return;
  }
  if (!result.ok) {
    logger.warn(
      { eventType: type, zodError: result.error },
      "Event payload failed registered Zod schema (ACH-011)",
    );
  }
}
