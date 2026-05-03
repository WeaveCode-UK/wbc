// Coverage push — buildDailyRoute. The MVP route grouping heuristic
// (sort by neighbourhood, then street) lives here; we lock its rules:
//   - addresses without a neighbourhood land in the "ZZZ_sem_endereco"
//     group (sorts last so the consultora hits known stops first)
//   - same neighbourhood: sub-sort alphabetically
//   - SHIPPED / SEPARATED rows show up regardless of the date filter
//     (in-flight stops outlive the day they were created)
import { describe, it, expect, vi, beforeEach } from "vitest";

const { findManyDelivery, findManyClient } = vi.hoisted(() => ({
  findManyDelivery: vi.fn(),
  findManyClient: vi.fn(),
}));

vi.mock("@wbc/db", () => ({
  prisma: {
    delivery: { findMany: findManyDelivery },
    client: { findMany: findManyClient },
  },
}));

import { buildDailyRoute } from "../build-daily-route";

beforeEach(() => {
  findManyDelivery.mockReset();
  findManyClient.mockReset();
});

const TODAY = new Date("2026-05-03T10:00:00-03:00");

function delivery(opts: {
  id: string;
  clientId: string;
  address: string | null;
  status?: "CONFIRMED" | "SEPARATED" | "SHIPPED";
  createdAt?: Date;
}) {
  return {
    id: opts.id,
    saleId: `s-${opts.id}`,
    clientId: opts.clientId,
    address: opts.address,
    estimatedDays: 2,
    status: opts.status ?? "CONFIRMED",
    createdAt: opts.createdAt ?? TODAY,
  };
}

describe("buildDailyRoute", () => {
  it("groups addresses by neighbourhood (second-to-last comma chunk)", async () => {
    findManyDelivery.mockResolvedValue([
      delivery({
        id: "d1",
        clientId: "c1",
        address: "Rua A, 100, Vila Mariana, São Paulo",
      }),
      delivery({
        id: "d2",
        clientId: "c2",
        address: "Rua B, 200, Pinheiros, São Paulo",
      }),
      delivery({
        id: "d3",
        clientId: "c3",
        address: "Rua C, 300, Vila Mariana, São Paulo",
      }),
    ]);
    findManyClient.mockResolvedValue([
      { id: "c1", name: "A" },
      { id: "c2", name: "B" },
      { id: "c3", name: "C" },
    ]);

    const stops = await buildDailyRoute("t1", TODAY);
    // Pinheiros sorts before Vila Mariana alphabetically.
    expect(stops.map((s) => s.deliveryId)).toEqual(["d2", "d1", "d3"]);
    expect(stops[0]!.groupKey).toBe("pinheiros");
  });

  it("nulls/blank addresses go to the ZZZ_sem_endereco group at the end", async () => {
    findManyDelivery.mockResolvedValue([
      delivery({ id: "d1", clientId: "c1", address: null }),
      delivery({
        id: "d2",
        clientId: "c2",
        address: "Rua B, 200, Pinheiros, São Paulo",
      }),
    ]);
    findManyClient.mockResolvedValue([
      { id: "c1", name: "A" },
      { id: "c2", name: "B" },
    ]);

    const stops = await buildDailyRoute("t1", TODAY);
    expect(stops.map((s) => s.deliveryId)).toEqual(["d2", "d1"]);
    expect(stops[1]!.groupKey).toBe("ZZZ_sem_endereco");
  });

  it("includes SHIPPED rows even if created before the day window", async () => {
    findManyDelivery.mockResolvedValue([
      delivery({
        id: "d-old",
        clientId: "c1",
        address: "Rua A, 100, Centro, SP",
        status: "SHIPPED",
        createdAt: new Date("2026-04-01"),
      }),
    ]);
    findManyClient.mockResolvedValue([{ id: "c1", name: "A" }]);

    const stops = await buildDailyRoute("t1", TODAY);
    expect(stops).toHaveLength(1);
    expect(stops[0]!.deliveryId).toBe("d-old");
  });

  it("missing client name surfaces as '—' (cross-tenant defence — never shows raw id)", async () => {
    findManyDelivery.mockResolvedValue([
      delivery({
        id: "d1",
        clientId: "c-orphan",
        address: "Rua A, 100, Centro, SP",
      }),
    ]);
    // Client repo returns nothing — could be cross-tenant.
    findManyClient.mockResolvedValue([]);

    const stops = await buildDailyRoute("t1", TODAY);
    expect(stops[0]!.clientName).toBe("—");
  });

  it("scopes the delivery query by sale.tenantId (no cross-tenant leak)", async () => {
    findManyDelivery.mockResolvedValue([]);
    findManyClient.mockResolvedValue([]);
    await buildDailyRoute("tenant-X", TODAY);
    const call = findManyDelivery.mock.calls[0]![0];
    expect(call.where.sale.tenantId).toBe("tenant-X");
  });

  it("orders by createdAt desc and caps at 200 rows", async () => {
    findManyDelivery.mockResolvedValue([]);
    findManyClient.mockResolvedValue([]);
    await buildDailyRoute("t1", TODAY);
    const call = findManyDelivery.mock.calls[0]![0];
    expect(call.orderBy).toEqual({ createdAt: "desc" });
    expect(call.take).toBe(200);
  });
});
