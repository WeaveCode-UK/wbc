import { Queue } from "bullmq";
import { JOB_QUEUES, logIfInvalidJobData } from "@wbc/shared";
import { getRedis } from "./redis";

let analyticsQueue: Queue | null = null;
let campaignQueue: Queue | null = null;
let messagingQueue: Queue | null = null;

function getConnection() {
  return getRedis();
}

export function getAnalyticsQueue(): Queue {
  if (!analyticsQueue) {
    analyticsQueue = new Queue(JOB_QUEUES.ANALYTICS, {
      connection: getConnection(),
    });
  }
  return analyticsQueue;
}

export function getCampaignQueue(): Queue {
  if (!campaignQueue) {
    campaignQueue = new Queue(JOB_QUEUES.CAMPAIGNS, {
      connection: getConnection(),
    });
  }
  return campaignQueue;
}

export function getMessagingQueue(): Queue {
  if (!messagingQueue) {
    messagingQueue = new Queue(JOB_QUEUES.MESSAGING, {
      connection: getConnection(),
    });
  }
  return messagingQueue;
}

/**
 * ACH-012 apis-integracoes: typed enqueue wrapper. Callers used to call
 * `getXxxQueue().add(name, data)` directly, which meant `data` was
 * `unknown` and silently accepted drift from the consumer's expected
 * shape. This helper runs the registered Zod schema before the add and
 * warns on mismatch (warn-only during migration; see jobs/schemas.ts).
 *
 * Keeps the return type as `Promise<void>` rather than BullMQ's `Job`
 * because callers already treat fire-and-forget as the norm.
 */
export async function enqueueJob(
  queue: Queue,
  name: string,
  data: unknown,
): Promise<void> {
  logIfInvalidJobData(queue.name, name, data);
  await queue.add(name, data);
}
