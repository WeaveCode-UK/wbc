import { Queue, type QueueOptions } from "bullmq";
import { connection } from "../lib/redis";

// ACH-003 confiabilidade-resiliencia: defaultJobOptions aplicado a todas
// as queues do worker. Ver apps/api/src/lib/queues.ts para a mesma
// política no lado produtor.
const defaultOpts: QueueOptions = {
  connection,
  defaultJobOptions: {
    removeOnComplete: 1000,
    removeOnFail: 5000,
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  },
};

export const messagingQueue = new Queue("wbc:messaging", defaultOpts);
export const campaignQueue = new Queue("wbc:campaigns", defaultOpts);
export const scheduleQueue = new Queue("wbc:schedule", defaultOpts);
export const analyticsQueue = new Queue("wbc:analytics", defaultOpts);
export const outboxQueue = new Queue("wbc:outbox", defaultOpts);
export const dlqQueue = new Queue("wbc:dlq", defaultOpts);
