// ACH-012 apis-integracoes: BullMQ job payload schemas.
//
// Jobs added to `wbc:analytics`, `wbc:campaigns`, and `wbc:messaging`
// used to land in the worker as `any`. A rename in the producer
// quietly drifted from the consumer, jobs started failing in subtle
// ways (missing field → runtime cast → retry → DLQ) with no single
// log that pointed at the contract mismatch.
//
// Same strategy as event-schemas (ACH-011): registry + warn-only
// validation at both producer (via `enqueueJob()`) and consumer
// (via `parseJobData()` inside each processor). Strict rejection is
// deferred until every queue/name pair is seeded.
//
// Queue/name composite key: jobs on the same queue can have different
// shapes per `job.name` (BullMQ semantics). The registry keys on
// `queue::name` to match.

import { z } from "zod";
import { createLogger } from "../logger";

const logger = createLogger("job-schemas");

export const JOB_QUEUES = {
  ANALYTICS: "wbc:analytics",
  CAMPAIGNS: "wbc:campaigns",
  MESSAGING: "wbc:messaging",
  DLQ: "wbc:dlq",
} as const;

export type JobQueue = (typeof JOB_QUEUES)[keyof typeof JOB_QUEUES];

// Seed: the three jobs actually enqueued by routers today. Extra
// producer fields pass through so adding a field to the job payload
// (e.g. a new flag) doesn't immediately warn-spam.

export const RecalculateABCJobSchema = z
  .object({
    tenantId: z.string().uuid(),
  })
  .passthrough();

export const SendCampaignJobSchema = z
  .object({
    tenantId: z.string().uuid(),
    campaignId: z.string().uuid(),
  })
  .passthrough();

export const MessagingJobSchema = z
  .object({
    type: z.enum(["SEND_TEXT", "SEND_AUDIO", "SEND_SCHEDULED"]),
    tenantId: z.string().uuid(),
    clientId: z.string().uuid(),
    message: z.string().optional(),
    audioUrl: z.string().url().optional(),
  })
  .passthrough();

function jobKey(queue: string, name: string): string {
  return `${queue}::${name}`;
}

export const jobSchemaRegistry: Record<string, z.ZodTypeAny> = {
  [jobKey(JOB_QUEUES.ANALYTICS, "recalculate-abc")]: RecalculateABCJobSchema,
  [jobKey(JOB_QUEUES.CAMPAIGNS, "send-campaign")]: SendCampaignJobSchema,
  // messaging jobs carry their variant in `data.type`, not job.name.
  // Register under a catch-all name so any messaging job gets validated.
  [jobKey(JOB_QUEUES.MESSAGING, "*")]: MessagingJobSchema,
};

export interface ValidateJobResult {
  ok: boolean;
  error?: string;
  unregistered?: boolean;
}

function lookupSchema(queue: string, name: string): z.ZodTypeAny | undefined {
  return (
    jobSchemaRegistry[jobKey(queue, name)] ??
    jobSchemaRegistry[jobKey(queue, "*")]
  );
}

export function validateJobData(
  queue: string,
  name: string,
  data: unknown,
): ValidateJobResult {
  const schema = lookupSchema(queue, name);
  if (!schema) {
    return { ok: true, unregistered: true };
  }
  const result = schema.safeParse(data);
  if (result.success) return { ok: true };
  return { ok: false, error: result.error.message };
}

/**
 * Warn-only bridge, matching `logIfInvalidEventPayload`. Callers that
 * want hard rejection can inspect `validateJobData()` directly.
 */
export function logIfInvalidJobData(
  queue: string,
  name: string,
  data: unknown,
): void {
  const result = validateJobData(queue, name, data);
  if (result.unregistered) {
    logger.warn(
      { queue, name },
      "Job has no registered Zod schema (ACH-012 migration pending)",
    );
    return;
  }
  if (!result.ok) {
    logger.warn(
      { queue, name, zodError: result.error },
      "Job data failed registered Zod schema (ACH-012)",
    );
  }
}
