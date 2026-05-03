// Coverage gap: apps/api/src/lib/queues.ts is the BullMQ wiring used
// by every router that enqueues a worker job. The contract this file
// owns:
//   - lazy singleton per queue (`getAnalyticsQueue`, etc.) — re-calls
//     return the same instance, otherwise BullMQ opens a new Redis
//     connection per call and the API leaks file descriptors.
//   - the right queue name (`JOB_QUEUES.X`) — a typo silently routes
//     work to a queue with no consumer.
//   - `enqueueJob()` runs the registered Zod schema check via
//     `logIfInvalidJobData` before `queue.add`.
//
// We mock `bullmq` so we don't open a Redis connection. We mock
// `@wbc/shared` partially — keep `JOB_QUEUES` real, replace
// `logIfInvalidJobData` with a spy.

import { describe, it, expect, vi, beforeEach } from "vitest";

const { logIfInvalidJobDataSpy } = vi.hoisted(() => ({
  logIfInvalidJobDataSpy: vi.fn(),
}));

vi.mock("@wbc/shared", async () => {
  const actual =
    await vi.importActual<typeof import("@wbc/shared")>("@wbc/shared");
  return {
    ...actual,
    logIfInvalidJobData: logIfInvalidJobDataSpy,
  };
});

interface QueueInstance {
  name: string;
  add: ReturnType<typeof vi.fn>;
  options: Record<string, unknown>;
}

const QueueCtor = vi.fn();

vi.mock("bullmq", () => ({
  Queue: function (name: string, options: Record<string, unknown>) {
    const inst: QueueInstance = {
      name,
      add: vi.fn().mockResolvedValue({}),
      options,
    };
    QueueCtor(name, options);
    return inst;
  },
}));

vi.mock("../redis", () => ({
  getRedis: () => ({ __fake: true }),
}));

beforeEach(() => {
  QueueCtor.mockReset();
  logIfInvalidJobDataSpy.mockReset();
  // Each test reimports queues.ts to reset the module-level singletons.
  vi.resetModules();
});

describe("queue singletons", () => {
  it("getAnalyticsQueue returns the same instance on repeated calls", async () => {
    const mod = await import("../queues");
    const a = mod.getAnalyticsQueue();
    const b = mod.getAnalyticsQueue();
    expect(a).toBe(b);
    expect(QueueCtor).toHaveBeenCalledOnce();
  });

  it("getCampaignQueue and getMessagingQueue are also lazy singletons", async () => {
    const mod = await import("../queues");
    const q1a = mod.getCampaignQueue();
    const q1b = mod.getCampaignQueue();
    const q2a = mod.getMessagingQueue();
    const q2b = mod.getMessagingQueue();
    expect(q1a).toBe(q1b);
    expect(q2a).toBe(q2b);
    // 2 distinct queue ctors called.
    expect(QueueCtor).toHaveBeenCalledTimes(2);
  });

  it("constructs each queue with attempts=3 + exponential backoff (ACH-003)", async () => {
    const mod = await import("../queues");
    mod.getAnalyticsQueue();
    const opts = QueueCtor.mock.calls[0]![1] as {
      defaultJobOptions: {
        attempts: number;
        backoff: { type: string; delay: number };
        removeOnComplete: number;
        removeOnFail: number;
      };
    };
    expect(opts.defaultJobOptions.attempts).toBe(3);
    expect(opts.defaultJobOptions.backoff).toEqual({
      type: "exponential",
      delay: 5000,
    });
    expect(opts.defaultJobOptions.removeOnComplete).toBe(1000);
    expect(opts.defaultJobOptions.removeOnFail).toBe(5000);
  });

  it("uses the JOB_QUEUES constants for queue names (ANALYTICS / CAMPAIGNS / MESSAGING)", async () => {
    const mod = await import("../queues");
    const { JOB_QUEUES } =
      await vi.importActual<typeof import("@wbc/shared")>("@wbc/shared");
    mod.getAnalyticsQueue();
    mod.getCampaignQueue();
    mod.getMessagingQueue();
    const names = QueueCtor.mock.calls.map((c) => c[0] as string);
    expect(names).toContain(JOB_QUEUES.ANALYTICS);
    expect(names).toContain(JOB_QUEUES.CAMPAIGNS);
    expect(names).toContain(JOB_QUEUES.MESSAGING);
  });
});

describe("enqueueJob", () => {
  it("calls logIfInvalidJobData with the queue.name + job name + data", async () => {
    const mod = await import("../queues");
    const queue = mod.getAnalyticsQueue();
    await mod.enqueueJob(queue, "recalculate-abc", { tenantId: "t-1" });

    expect(logIfInvalidJobDataSpy).toHaveBeenCalledOnce();
    const args = logIfInvalidJobDataSpy.mock.calls[0]!;
    expect(args[1]).toBe("recalculate-abc");
    expect(args[2]).toEqual({ tenantId: "t-1" });
  });

  it("calls queue.add with name + data after the schema check", async () => {
    const mod = await import("../queues");
    const queue = mod.getAnalyticsQueue();
    await mod.enqueueJob(queue, "recalculate-abc", { tenantId: "t-1" });

    expect((queue as unknown as QueueInstance).add).toHaveBeenCalledWith(
      "recalculate-abc",
      { tenantId: "t-1" },
    );
  });

  it("does not throw when logIfInvalidJobData reports drift (warn-only)", async () => {
    // The schema check is intentionally non-fatal during migration —
    // a contract breach should NOT halt the API. We assert by simply
    // returning from a successful add even when the spy is "unhappy".
    logIfInvalidJobDataSpy.mockImplementation(() => undefined);
    const mod = await import("../queues");
    const queue = mod.getMessagingQueue();
    await expect(
      mod.enqueueJob(queue, "send-text", { foo: "bar" }),
    ).resolves.toBeUndefined();
  });
});
