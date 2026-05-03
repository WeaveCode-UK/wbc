// Coverage gap: cron-processor schedules + dispatches the 8 daily jobs
// that keep the platform's hygiene running (inactive flagging, cashback
// expiry, restock reminders, demo reset, etc.). The dispatch table is
// where regressions hurt: a single missing case in `runForTenant`
// silently stops a whole hygiene job from running, and we'd only
// notice in the metric that the job's last-run timestamp is stale.
//
// We mock every business use-case + bullmq + prisma so we can run the
// processor function in isolation and verify:
//   - fanout enqueues one tenant-job per active tenant (or per demo
//     tenant for `reset_demo_tenants`)
//   - tenant-job dispatch routes each CronType to the right use-case
//   - registerCronSchedules adds 8 repeatable jobs with the right
//     pattern
//
// The test reaches into the Worker constructor like the dlq test —
// captures the processor fn so we can drive it.

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Job } from "bullmq";

const useCases = vi.hoisted(() => ({
  flagInactiveClients: vi.fn().mockResolvedValue(undefined),
  flagExpiringCashbacks: vi.fn().mockResolvedValue(undefined),
  buildRestockReminders: vi.fn().mockResolvedValue(undefined),
  buildRestockRemindersPerProduct: vi.fn().mockResolvedValue(undefined),
  buildDateReminders: vi.fn().mockResolvedValue(undefined),
  notifyClientMilestones: vi.fn().mockResolvedValue(undefined),
  notifyUrgentCareerGoals: vi.fn().mockResolvedValue(undefined),
  recomputeUnlockedFeatures: vi.fn().mockResolvedValue(undefined),
  resetDemoTenant: vi.fn().mockResolvedValue(undefined),
  listDemoTenants: vi.fn(),
}));

vi.mock("@wbc/business/clients/use-cases/flag-inactive-clients", () => ({
  flagInactiveClients: useCases.flagInactiveClients,
}));
vi.mock("@wbc/business/sales/use-cases/flag-expiring-cashback", () => ({
  flagExpiringCashbacks: useCases.flagExpiringCashbacks,
}));
vi.mock("@wbc/business/schedule/use-cases/build-restock-reminders", () => ({
  buildRestockReminders: useCases.buildRestockReminders,
}));
vi.mock(
  "@wbc/business/schedule/use-cases/build-restock-reminders-per-product",
  () => ({
    buildRestockRemindersPerProduct: useCases.buildRestockRemindersPerProduct,
  }),
);
vi.mock("@wbc/business/schedule/use-cases/build-date-reminders", () => ({
  buildDateReminders: useCases.buildDateReminders,
}));
vi.mock("@wbc/business/schedule/use-cases/notify-client-milestones", () => ({
  notifyClientMilestones: useCases.notifyClientMilestones,
}));
vi.mock("@wbc/business/team/use-cases/manage-career-goals", () => ({
  notifyUrgentCareerGoals: useCases.notifyUrgentCareerGoals,
}));
vi.mock("@wbc/business/platform/use-cases/progressive-onboarding", () => ({
  recomputeUnlockedFeatures: useCases.recomputeUnlockedFeatures,
}));
vi.mock("@wbc/business/platform/use-cases/demo-mode", () => ({
  resetDemoTenant: useCases.resetDemoTenant,
  listDemoTenants: useCases.listDemoTenants,
}));

const { findManyTenant } = vi.hoisted(() => ({
  findManyTenant: vi.fn(),
}));

vi.mock("@wbc/db", () => ({
  prisma: {
    tenant: { findMany: findManyTenant },
  },
}));

vi.mock("../../lib/redis", () => ({ connection: { __fake: true } }));

interface CronJobData {
  kind: "fanout" | "tenant";
  type: string;
  tenantId?: string;
}

const captured: { fn?: (job: Job<CronJobData>) => Promise<void> } = {};
const queueAdd = vi.fn().mockResolvedValue(undefined);

vi.mock("bullmq", () => ({
  Queue: class {
    name: string;
    add = queueAdd;
    constructor(name: string) {
      this.name = name;
    }
  },
  Worker: class {
    name: string;
    on = vi.fn();
    constructor(
      name: string,
      processor: (job: Job<CronJobData>) => Promise<void>,
    ) {
      this.name = name;
      captured.fn = processor;
    }
  },
}));

beforeEach(async () => {
  for (const fn of Object.values(useCases)) fn.mockReset();
  // Default: each use-case resolves OK
  useCases.flagInactiveClients.mockResolvedValue(undefined);
  useCases.flagExpiringCashbacks.mockResolvedValue(undefined);
  useCases.buildRestockReminders.mockResolvedValue(undefined);
  useCases.buildRestockRemindersPerProduct.mockResolvedValue(undefined);
  useCases.buildDateReminders.mockResolvedValue(undefined);
  useCases.notifyClientMilestones.mockResolvedValue(undefined);
  useCases.notifyUrgentCareerGoals.mockResolvedValue(undefined);
  useCases.recomputeUnlockedFeatures.mockResolvedValue(undefined);
  useCases.resetDemoTenant.mockResolvedValue(undefined);
  useCases.listDemoTenants.mockResolvedValue([]);
  findManyTenant.mockReset().mockResolvedValue([]);
  queueAdd.mockReset().mockResolvedValue(undefined);
  captured.fn = undefined;
  vi.resetModules();
  const fresh = await import("../cron-processor");
  fresh.startCronWorker();
});

function fanoutJob(type: string): Job<CronJobData> {
  return {
    id: `fanout:${type}`,
    name: `cron:${type}`,
    data: { kind: "fanout", type },
  } as unknown as Job<CronJobData>;
}

function tenantJob(type: string, tenantId: string): Job<CronJobData> {
  return {
    id: `${type}:${tenantId}`,
    name: `${type}:${tenantId}`,
    data: { kind: "tenant", type, tenantId },
  } as unknown as Job<CronJobData>;
}

describe("cron-processor — fanout", () => {
  it("lists active tenants and enqueues one tenant-job per row", async () => {
    findManyTenant.mockResolvedValue([{ id: "t-1" }, { id: "t-2" }]);
    await captured.fn!(fanoutJob("flag_inactive_clients"));

    expect(findManyTenant).toHaveBeenCalledWith({
      where: { isActive: true },
      select: { id: true },
    });
    expect(queueAdd).toHaveBeenCalledTimes(2);
    const names = queueAdd.mock.calls.map((c) => c[0] as string);
    expect(names).toEqual([
      "flag_inactive_clients:t-1",
      "flag_inactive_clients:t-2",
    ]);
  });

  it("uses listDemoTenants for reset_demo_tenants instead of all tenants", async () => {
    useCases.listDemoTenants.mockResolvedValue(["demo-1"]);
    findManyTenant.mockResolvedValue([{ id: "real-1" }, { id: "real-2" }]);

    await captured.fn!(fanoutJob("reset_demo_tenants"));

    expect(findManyTenant).not.toHaveBeenCalled();
    expect(queueAdd).toHaveBeenCalledTimes(1);
    expect(queueAdd.mock.calls[0]![0]).toBe("reset_demo_tenants:demo-1");
  });

  it("noop fanout when there are no tenants", async () => {
    findManyTenant.mockResolvedValue([]);
    await captured.fn!(fanoutJob("flag_expiring_cashbacks"));
    expect(queueAdd).not.toHaveBeenCalled();
  });
});

describe("cron-processor — tenant dispatch", () => {
  it.each([
    ["flag_inactive_clients", "flagInactiveClients"],
    ["flag_expiring_cashbacks", "flagExpiringCashbacks"],
    ["build_date_reminders", "buildDateReminders"],
    ["refresh_unlocked_features", "recomputeUnlockedFeatures"],
    ["reset_demo_tenants", "resetDemoTenant"],
    ["notify_client_milestones", "notifyClientMilestones"],
    ["notify_career_goals", "notifyUrgentCareerGoals"],
  ])("%s → calls %s(tenantId)", async (type, useCase) => {
    await captured.fn!(tenantJob(type, "t-9"));
    expect(useCases[useCase as keyof typeof useCases]).toHaveBeenCalledWith(
      "t-9",
    );
  });

  it("build_restock_reminders runs BOTH the per-client and per-product jobs", async () => {
    // Documented in the source: catch-all + precise variant. Asserting
    // both fire prevents a future "simplification" from silently
    // dropping the per-product reminders (handoff item 13).
    await captured.fn!(tenantJob("build_restock_reminders", "t-1"));
    expect(useCases.buildRestockReminders).toHaveBeenCalledWith("t-1");
    expect(useCases.buildRestockRemindersPerProduct).toHaveBeenCalledWith(
      "t-1",
    );
  });
});

describe("cron-processor — schedule registration", () => {
  it("registerCronSchedules enqueues 8 repeatable fanout jobs", async () => {
    const fresh = await import("../cron-processor");
    queueAdd.mockClear();
    await fresh.registerCronSchedules();

    // 8 cron types: 4 daily-morning, 1 6h, 1 03:00 demo, 2 milestones/career.
    expect(queueAdd).toHaveBeenCalledTimes(8);
    for (const call of queueAdd.mock.calls) {
      const [name, data, opts] = call as [
        string,
        CronJobData,
        { repeat: { pattern: string }; jobId: string },
      ];
      expect(name).toMatch(/^cron:/);
      expect(data.kind).toBe("fanout");
      expect(typeof opts.repeat.pattern).toBe("string");
      expect(opts.jobId).toBe(name);
    }
  });

  it("uses cron(0 5 * * *) for flag_inactive_clients (daily 05:00 UTC)", async () => {
    const fresh = await import("../cron-processor");
    queueAdd.mockClear();
    await fresh.registerCronSchedules();
    const inactiveCall = queueAdd.mock.calls.find(
      (c) => (c[0] as string) === "cron:flag_inactive_clients",
    );
    expect(inactiveCall).toBeDefined();
    expect(
      (inactiveCall![2] as { repeat: { pattern: string } }).repeat.pattern,
    ).toBe("0 5 * * *");
  });
});
