import { Queue, type QueueOptions } from "bullmq";
import { JOB_QUEUES, logIfInvalidJobData } from "@wbc/shared";
import { getRedis } from "./redis";

let analyticsQueue: Queue | null = null;
let campaignQueue: Queue | null = null;
let messagingQueue: Queue | null = null;

function getConnection() {
  return getRedis();
}

// ACH-003 confiabilidade-resiliencia: defaultJobOptions centralizados.
// Antes as queues eram criadas sem limites, deixando Redis crescer até
// estourar maxmemory (256MB em docker-compose.prod.yml). Agora:
// - removeOnComplete 1000: mantém amostra recente para inspeção
// - removeOnFail 5000: preserva janela maior para diagnose
// - attempts 3 + backoff exponencial: retries antes de considerar
//   jobs perdidos (o outbox cuida do replay de eventos definitivos).
function defaultJobOptions(): QueueOptions["defaultJobOptions"] {
  return {
    removeOnComplete: 1000,
    removeOnFail: 5000,
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  };
}

function queueOpts(): QueueOptions {
  return {
    connection: getConnection(),
    defaultJobOptions: defaultJobOptions(),
  };
}

export function getAnalyticsQueue(): Queue {
  if (!analyticsQueue) {
    analyticsQueue = new Queue(JOB_QUEUES.ANALYTICS, queueOpts());
  }
  return analyticsQueue;
}

export function getCampaignQueue(): Queue {
  if (!campaignQueue) {
    campaignQueue = new Queue(JOB_QUEUES.CAMPAIGNS, queueOpts());
  }
  return campaignQueue;
}

export function getMessagingQueue(): Queue {
  if (!messagingQueue) {
    messagingQueue = new Queue(JOB_QUEUES.MESSAGING, queueOpts());
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
