// Coverage gap: analytics-processor is the consumer for the
// `wbc:analytics` queue. It's a thin dispatcher right now (one job
// name: `recalculate-abc`) but the contract is load-bearing:
//   - the job must run inside withTenant() so any prisma access is
//     filtered through the tenant-injection middleware
//   - the job-name dispatch is a switch, NOT a function-name lookup —
//     unknown names must NOT call the repo (silent no-op is the right
//     behaviour during a deploy where the API knows about a new job
//     the worker hasn't shipped yet)
//   - logIfInvalidJobData is called for drift visibility
//
// We capture the processor by mocking bullmq's Worker. The repo and
// shared.withTenant get real-ish stubs.

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Job } from "bullmq";

const { calculateABCMock, withTenantMock, logSpy } = vi.hoisted(() => ({
  calculateABCMock: vi.fn(),
  withTenantMock: vi.fn(),
  logSpy: vi.fn(),
}));

vi.mock(
  "../../../../../packages/business/analytics/adapters/prisma-analytics-repository",
  () => ({
    PrismaAnalyticsRepository: class {
      calculateABCClassification = calculateABCMock;
    },
  }),
);

vi.mock("@wbc/shared", async () => {
  const actual =
    await vi.importActual<typeof import("@wbc/shared")>("@wbc/shared");
  return {
    ...actual,
    withTenant: withTenantMock,
    logIfInvalidJobData: logSpy,
  };
});

vi.mock("../../lib/redis", () => ({ connection: { __fake: true } }));

interface AnalyticsJobData {
  tenantId: string;
}

const captured: { fn?: (job: Job<AnalyticsJobData>) => Promise<void> } = {};

vi.mock("bullmq", () => ({
  Worker: class {
    name: string;
    on = vi.fn();
    constructor(
      name: string,
      processor: (job: Job<AnalyticsJobData>) => Promise<void>,
    ) {
      this.name = name;
      captured.fn = processor;
    }
  },
}));

beforeEach(async () => {
  calculateABCMock.mockReset().mockResolvedValue({ updated: 42 });
  // Reset call history each test; re-install the implementation that
  // forwards to the inner fn so the analytics processor's withTenant
  // body actually runs.
  withTenantMock.mockReset();
  withTenantMock.mockImplementation(
    async (_tenantId: string, fn: () => Promise<unknown>) => fn(),
  );
  logSpy.mockReset();
  captured.fn = undefined;
  vi.resetModules();
  const fresh = await import("../analytics-processor");
  fresh.startAnalyticsWorker();
});

function makeJob(name: string, data: AnalyticsJobData): Job<AnalyticsJobData> {
  return { id: "j1", name, data } as unknown as Job<AnalyticsJobData>;
}

describe("analytics-processor — dispatch", () => {
  it("calls calculateABCClassification when job.name=recalculate-abc", async () => {
    await captured.fn!(makeJob("recalculate-abc", { tenantId: "t-1" }));
    expect(calculateABCMock).toHaveBeenCalledWith("t-1");
  });

  it("wraps the work in withTenant(tenantId) — tenant context is set", async () => {
    await captured.fn!(makeJob("recalculate-abc", { tenantId: "t-7" }));
    expect(withTenantMock).toHaveBeenCalledOnce();
    expect(withTenantMock.mock.calls[0]![0]).toBe("t-7");
  });

  it("does NOT call the repo for an unknown job name (silent no-op)", async () => {
    await captured.fn!(makeJob("unknown-job", { tenantId: "t-1" }));
    expect(calculateABCMock).not.toHaveBeenCalled();
    // withTenant is still entered — the tenant context is established
    // before the switch, that's fine; the assert above is the one we
    // care about.
  });

  it("calls logIfInvalidJobData for schema drift visibility (warn-only)", async () => {
    await captured.fn!(makeJob("recalculate-abc", { tenantId: "t-1" }));
    expect(logSpy).toHaveBeenCalledOnce();
  });
});

describe("analytics-processor — Worker startup", () => {
  it("startAnalyticsWorker returns a Worker instance", async () => {
    vi.resetModules();
    const fresh = await import("../analytics-processor");
    expect(fresh.startAnalyticsWorker()).toBeDefined();
  });
});
