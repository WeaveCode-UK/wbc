// Coverage push — createDelivery. Thin pass-through to the repo, but
// we lock the defaults (status starts as CONFIRMED, trackingCode null,
// optionals coalesced to null) so a refactor doesn't silently flip
// status defaults and ship deliveries already in SEPARATED state.
import { describe, it, expect, vi } from "vitest";
import { createDelivery } from "../create-delivery";
import type { DeliveryRepository } from "../../ports/delivery-repository";

function repo(): DeliveryRepository {
  return {
    create: vi
      .fn()
      .mockImplementation((data) =>
        Promise.resolve({ id: "d-1", ...data, createdAt: new Date() }),
      ),
    findById: vi.fn(),
    list: vi.fn(),
    findPendingToday: vi.fn(),
    updateStatus: vi.fn(),
  } as unknown as DeliveryRepository;
}

describe("createDelivery", () => {
  it("starts a delivery in CONFIRMED with trackingCode null and optionals coalesced", async () => {
    const r = repo();
    await createDelivery(r, {
      tenantId: "t1",
      saleId: "s1",
      clientId: "c1",
      clientName: "Maria",
      clientPhone: "+5511999999999",
      method: "MOTOBOY",
    });
    expect(r.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "t1",
        saleId: "s1",
        clientId: "c1",
        status: "CONFIRMED",
        trackingCode: null,
        address: null,
        estimatedDate: null,
        notes: null,
      }),
    );
  });

  it("preserves provided optionals (address, estimatedDate, notes)", async () => {
    const r = repo();
    const ts = new Date("2026-05-10");
    await createDelivery(r, {
      tenantId: "t1",
      saleId: "s1",
      clientId: "c1",
      clientName: "Maria",
      clientPhone: "+5511999999999",
      address: "Rua A, 123",
      estimatedDate: ts,
      method: "CORREIOS",
      notes: "frágil",
    });
    expect(r.create).toHaveBeenCalledWith(
      expect.objectContaining({
        address: "Rua A, 123",
        estimatedDate: ts,
        notes: "frágil",
        method: "CORREIOS",
      }),
    );
  });
});
