// Coverage push — listDeliveries + getTodayRoute. Pass-throughs.
import { describe, it, expect, vi } from "vitest";
import { listDeliveries, getTodayRoute } from "../list-deliveries";
import type { DeliveryRepository } from "../../ports/delivery-repository";

function repo(): DeliveryRepository {
  return {
    list: vi.fn().mockResolvedValue([]),
    findPendingToday: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    findById: vi.fn(),
    updateStatus: vi.fn(),
  } as unknown as DeliveryRepository;
}

describe("listDeliveries", () => {
  it("forwards tenantId + filters verbatim", async () => {
    const r = repo();
    await listDeliveries(r, "t1", { status: "CONFIRMED", clientId: "c1" });
    expect(r.list).toHaveBeenCalledWith("t1", {
      status: "CONFIRMED",
      clientId: "c1",
    });
  });

  it("works without filters", async () => {
    const r = repo();
    await listDeliveries(r, "t1");
    expect(r.list).toHaveBeenCalledWith("t1", undefined);
  });
});

describe("getTodayRoute", () => {
  it("calls findPendingToday with the tenantId only", async () => {
    const r = repo();
    await getTodayRoute(r, "t1");
    expect(r.findPendingToday).toHaveBeenCalledWith("t1");
  });
});
