// Coverage push — delivery status state machine. Mirrors the sale
// lifecycle but for shipping. Locks the FULL transition table so a
// regression that allows DELIVERED → CONFIRMED can't ship.
import { describe, it, expect, vi } from "vitest";
import { updateDeliveryStatus } from "../update-delivery-status";
import {
  DeliveryNotFoundError,
  InvalidStatusTransitionError,
} from "../../domain/errors";
import type {
  DeliveryRepository,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
} from "../../ports/delivery-repository";
import type { DeliveryStatus } from "../../domain/entities";

function repo(currentStatus: DeliveryStatus | null): DeliveryRepository {
  return {
    findById: vi
      .fn()
      .mockResolvedValue(
        currentStatus === null
          ? null
          : { id: "d-1", status: currentStatus, tenantId: "t1" },
      ),
    updateStatus: vi
      .fn()
      .mockImplementation((_t, _id, newStatus, extra) =>
        Promise.resolve({ id: "d-1", status: newStatus, ...extra }),
      ),
    list: vi.fn(),
    findPendingToday: vi.fn(),
    create: vi.fn(),
  } as unknown as DeliveryRepository;
}

describe("updateDeliveryStatus", () => {
  it("throws DeliveryNotFoundError when row is missing (no cross-tenant leak)", async () => {
    const r = repo(null);
    await expect(
      updateDeliveryStatus(r, "t1", "ghost", "SHIPPED"),
    ).rejects.toBeInstanceOf(DeliveryNotFoundError);
    expect(r.updateStatus).not.toHaveBeenCalled();
  });

  it("CONFIRMED → SEPARATED is allowed", async () => {
    const r = repo("CONFIRMED");
    await updateDeliveryStatus(r, "t1", "d-1", "SEPARATED");
    expect(r.updateStatus).toHaveBeenCalledWith(
      "t1",
      "d-1",
      "SEPARATED",
      expect.any(Object),
    );
  });

  it("SHIPPED → DELIVERED stamps deliveredAt automatically", async () => {
    const r = repo("SHIPPED");
    await updateDeliveryStatus(r, "t1", "d-1", "DELIVERED");
    const lastCall = (r.updateStatus as ReturnType<typeof vi.fn>).mock
      .calls[0]!;
    const extra = lastCall[3] as { deliveredAt?: Date };
    expect(extra.deliveredAt).toBeInstanceOf(Date);
  });

  it("propagates trackingCode when provided", async () => {
    const r = repo("SEPARATED");
    await updateDeliveryStatus(r, "t1", "d-1", "SHIPPED", "TRK123");
    const lastCall = (r.updateStatus as ReturnType<typeof vi.fn>).mock
      .calls[0]!;
    const extra = lastCall[3] as { trackingCode?: string };
    expect(extra.trackingCode).toBe("TRK123");
  });

  it("DELIVERED → CONFIRMED rejects with InvalidStatusTransitionError (terminal state)", async () => {
    const r = repo("DELIVERED");
    await expect(
      updateDeliveryStatus(r, "t1", "d-1", "CONFIRMED"),
    ).rejects.toBeInstanceOf(InvalidStatusTransitionError);
  });

  it("CANCELLED → any rejects (terminal)", async () => {
    const r = repo("CANCELLED");
    await expect(
      updateDeliveryStatus(r, "t1", "d-1", "SHIPPED"),
    ).rejects.toBeInstanceOf(InvalidStatusTransitionError);
  });

  it("CONFIRMED → SHIPPED rejects (must go through SEPARATED first)", async () => {
    const r = repo("CONFIRMED");
    await expect(
      updateDeliveryStatus(r, "t1", "d-1", "SHIPPED"),
    ).rejects.toBeInstanceOf(InvalidStatusTransitionError);
  });

  it("any state → CANCELLED is allowed (escape hatch)", async () => {
    for (const from of ["CONFIRMED", "SEPARATED", "SHIPPED"] as const) {
      const r = repo(from);
      await updateDeliveryStatus(r, "t1", "d-1", "CANCELLED");
      expect(r.updateStatus).toHaveBeenCalled();
    }
  });
});
