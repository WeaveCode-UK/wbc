// T5.7 — BullMQ smoke against a real Redis container.
//
// WHY: the queue config in `apps/api/src/lib/queues.ts` sets
// `attempts: 3 + exponential backoff`. The pieces we need to confirm
// against a real broker:
//   - enqueue + Worker.run completes successfully (happy path);
//   - a thrown processor retries the job up to `attempts` times;
//   - hitting max attempts surfaces a `failed` event (the project's
//     DLQ archiver consumes that signal).
// We don't reuse `getXxxQueue()` from the api package because that
// module pulls in tRPC + Sentry; instead we build a Queue + Worker
// directly with the same defaultJobOptions shape.

import { describe, it, beforeAll, afterAll, expect } from "vitest";
import {
  RedisContainer,
  type StartedRedisContainer,
} from "@testcontainers/redis";
import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";

const SHOULD_RUN_INTEGRATION =
  process.env.CI === "true" ||
  process.env.CI === "1" ||
  process.env.RUN_INTEGRATION === "1";

describe.skipIf(!SHOULD_RUN_INTEGRATION)("bullmq smoke (redis)", () => {
  let container: StartedRedisContainer;
  let connection: IORedis;

  beforeAll(async () => {
    container = await new RedisContainer("redis:7-alpine").start();
    // WHY: BullMQ requires `maxRetriesPerRequest=null` on the IORedis
    // instance — otherwise blocking commands (BRPOPLPUSH, etc.) abort
    // and the worker stalls. This is the exact pattern the api uses.
    connection = new IORedis({
      host: container.getHost(),
      port: container.getPort(),
      maxRetriesPerRequest: null,
    });
    await connection.ping();
  }, 120_000);

  afterAll(async () => {
    connection?.disconnect();
    await container?.stop();
  });

  it("enqueues a job and the worker marks it completed", async () => {
    const queueName = `t5-7-happy-${Date.now()}`;
    const queue = new Queue(queueName, { connection });

    let processed = 0;
    const completed = new Promise<Job>((resolve) => {
      const worker = new Worker(
        queueName,
        async (job) => {
          processed += 1;
          return { echo: job.data };
        },
        { connection },
      );
      worker.once("completed", (job) => {
        resolve(job);
        // WHY: schedule close after the listener returns so we don't
        // race the close against pending events.
        void worker.close();
      });
    });

    await queue.add("ping", { hello: "world" });
    const job = await completed;

    expect(processed).toBe(1);
    expect(job.returnvalue).toEqual({ echo: { hello: "world" } });

    await queue.close();
  });

  it("retries a failing job and marks it failed after maxAttempts", async () => {
    const queueName = `t5-7-retry-${Date.now()}`;
    const queue = new Queue(queueName, { connection });
    const TOTAL_ATTEMPTS = 2;

    let attempts = 0;
    // WHY: BullMQ fires `failed` on every attempt, not just the final
    // one — accumulate every emission and resolve once we've observed
    // `attemptsMade === TOTAL_ATTEMPTS`. That's the moment the job is
    // declared dead and the retry budget is exhausted.
    let worker: Worker;
    const exhausted = new Promise<{
      failedReason: string;
      attemptsMade: number;
    }>((resolve) => {
      worker = new Worker<unknown, unknown>(
        queueName,
        async () => {
          attempts += 1;
          throw new Error("intentional");
        },
        { connection },
      );
      worker.on("failed", (job) => {
        if (!job) return;
        if (job.attemptsMade >= TOTAL_ATTEMPTS) {
          resolve({
            failedReason: job.failedReason ?? "",
            attemptsMade: job.attemptsMade,
          });
        }
      });
    });

    await queue.add(
      "always-fail",
      { hello: "world" },
      // WHY: shrink the retry budget so the test finishes in <5s. The
      // important assertion is "max attempts hit + failed surfaces" —
      // the exact count is configurable.
      { attempts: TOTAL_ATTEMPTS, backoff: { type: "fixed", delay: 50 } },
    );

    const result = await exhausted;
    expect(result.attemptsMade).toBe(TOTAL_ATTEMPTS);
    expect(result.failedReason).toContain("intentional");
    expect(attempts).toBe(TOTAL_ATTEMPTS);

    await worker!.close();
    await queue.close();
  });
});
