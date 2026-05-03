import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPostSaleFlows } from "../post-sale-flow";
import type { PostSaleFlowRepository } from "../../ports/messaging-repository";

function makeRepoStub(): PostSaleFlowRepository & {
  calls: { method: string; args: unknown[] }[];
} {
  const calls: { method: string; args: unknown[] }[] = [];
  return {
    calls,
    async deletePendingByClient(...args) {
      calls.push({ method: "deletePendingByClient", args });
    },
    async createMany(...args) {
      calls.push({ method: "createMany", args });
    },
    async findPending() {
      return [];
    },
    async markSent() {},
  };
}

describe("createPostSaleFlows — reset on new sale (item 48)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
  });

  it("deletes pending flows for the client before creating new ones", async () => {
    const repo = makeRepoStub();
    await createPostSaleFlows("tenant-1", "sale-1", "client-1", repo);

    const order = repo.calls.map((c) => c.method);
    expect(order).toEqual(["deletePendingByClient", "createMany"]);
    expect(repo.calls[0]?.args[0]).toBe("client-1");
  });

  it("creates exactly the three POST_SALE stages (2d, 2w, 2m)", async () => {
    const repo = makeRepoStub();
    await createPostSaleFlows("tenant-1", "sale-1", "client-1", repo);

    const createCall = repo.calls.find((c) => c.method === "createMany");
    const flows = createCall?.args[0] as Array<{
      stage: string;
      scheduledAt: Date;
    }>;
    expect(flows).toHaveLength(3);
    expect(flows.map((f) => f.stage)).toEqual([
      "TWO_DAYS",
      "TWO_WEEKS",
      "TWO_MONTHS",
    ]);
  });

  it("schedules each stage relative to now", async () => {
    const repo = makeRepoStub();
    await createPostSaleFlows("tenant-1", "sale-1", "client-1", repo);

    const flows = repo.calls.find((c) => c.method === "createMany")
      ?.args[0] as Array<{ scheduledAt: Date }>;
    const offsets = flows.map((f) =>
      Math.round(
        (f.scheduledAt.getTime() - new Date("2026-01-15T12:00:00Z").getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );
    expect(offsets).toEqual([2, 14, 60]);
  });
});
