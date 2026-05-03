// Coverage gap: sync-mp-payment is the webhook → local Payment writer.
// Idempotency is the load-bearing property: MP retries deliver the same
// `mercadopagoId` repeatedly, and a re-credit on an already-PAID row is
// the kind of bug that costs money in prod and is invisible in dev (no
// live webhooks). We mock @wbc/db (prisma) at the module boundary and
// the MP fetcher so we can drive every branch synchronously.
//
// What we lock here:
//   - Unknown `mercadopagoId` → matched=false, no DB write, no event
//   - Already PAID locally → no second update, no second event
//   - remote.approved on a PENDING row → UPDATE + PAYMENT_RECEIVED publish
//   - remote.{pending,rejected,cancelled} → no PAID transition; status
//     surfaced verbatim for caller to log

import { describe, it, expect, vi, beforeEach } from "vitest";

const { findFirstPayment, updatePayment, publishMock, getMpPaymentMock } =
  vi.hoisted(() => ({
    findFirstPayment: vi.fn(),
    updatePayment: vi.fn().mockResolvedValue({}),
    publishMock: vi.fn().mockResolvedValue(undefined),
    getMpPaymentMock: vi.fn(),
  }));

vi.mock("@wbc/db", () => ({
  prisma: {
    payment: {
      findFirst: findFirstPayment,
      update: updatePayment,
    },
  },
}));

vi.mock("@wbc/shared", async () => {
  // Keep EVENTS real so the test asserts the actual event name shipping
  // to subscribers — a renamed event is a contract break.
  const actual =
    await vi.importActual<typeof import("@wbc/shared")>("@wbc/shared");
  return {
    ...actual,
    publish: publishMock,
  };
});

vi.mock("../../../finance/adapters/mercadopago-api-client", () => ({
  getMpPayment: getMpPaymentMock,
}));

import { syncMpPayment } from "../sync-mp-payment";
import { EVENTS } from "@wbc/shared";

beforeEach(() => {
  findFirstPayment.mockReset();
  updatePayment.mockClear().mockResolvedValue({});
  publishMock.mockClear().mockResolvedValue(undefined);
  getMpPaymentMock.mockReset();
});

describe("syncMpPayment — match resolution", () => {
  it("returns matched=false when no local Payment exists for the mp id", async () => {
    getMpPaymentMock.mockResolvedValue({
      id: "mp-1",
      status: "approved",
      externalReference: null,
      amount: 100,
    });
    findFirstPayment.mockResolvedValue(null);

    const result = await syncMpPayment({ mercadopagoId: "mp-1" });

    expect(result).toEqual({
      matched: false,
      paymentId: null,
      newStatus: null,
    });
    expect(updatePayment).not.toHaveBeenCalled();
    expect(publishMock).not.toHaveBeenCalled();
  });

  it("queries Payment by mercadopagoId and includes sale tenantId", async () => {
    getMpPaymentMock.mockResolvedValue({
      id: "mp-2",
      status: "pending",
      externalReference: null,
      amount: 50,
    });
    findFirstPayment.mockResolvedValue({
      id: "pay-2",
      status: "PENDING",
      sale: { tenantId: "t-1", id: "sale-2" },
    });

    await syncMpPayment({ mercadopagoId: "mp-2" });

    expect(findFirstPayment).toHaveBeenCalledWith({
      where: { mercadopagoId: "mp-2" },
      include: {
        sale: { select: { tenantId: true, id: true } },
      },
    });
  });
});

describe("syncMpPayment — idempotency", () => {
  it("is a no-op when local Payment is already PAID (MP retried after success)", async () => {
    // The whole point of the use-case: re-running on a PAID row must
    // NOT update again and must NOT re-publish PAYMENT_RECEIVED — that
    // would double-credit cashback / double-fire confirmations.
    getMpPaymentMock.mockResolvedValue({
      id: "mp-3",
      status: "approved",
      externalReference: null,
      amount: 100,
    });
    findFirstPayment.mockResolvedValue({
      id: "pay-3",
      status: "PAID",
      sale: { tenantId: "t-1", id: "sale-3" },
    });

    const result = await syncMpPayment({ mercadopagoId: "mp-3" });

    expect(result).toEqual({
      matched: true,
      paymentId: "pay-3",
      newStatus: "PAID",
    });
    expect(updatePayment).not.toHaveBeenCalled();
    expect(publishMock).not.toHaveBeenCalled();
  });
});

describe("syncMpPayment — approved transition", () => {
  it("flips local PENDING → PAID and publishes PAYMENT_RECEIVED on remote.approved", async () => {
    getMpPaymentMock.mockResolvedValue({
      id: "mp-4",
      status: "approved",
      externalReference: null,
      amount: 199.9,
    });
    findFirstPayment.mockResolvedValue({
      id: "pay-4",
      status: "PENDING",
      sale: { tenantId: "t-1", id: "sale-4" },
    });

    const result = await syncMpPayment({ mercadopagoId: "mp-4" });

    expect(updatePayment).toHaveBeenCalledOnce();
    const updateArg = updatePayment.mock.calls[0]![0] as {
      where: { id: string };
      data: { status: string; paidAt: Date };
    };
    expect(updateArg.where).toEqual({ id: "pay-4" });
    expect(updateArg.data.status).toBe("PAID");
    expect(updateArg.data.paidAt).toBeInstanceOf(Date);

    expect(publishMock).toHaveBeenCalledOnce();
    expect(publishMock).toHaveBeenCalledWith(EVENTS.PAYMENT_RECEIVED, "t-1", {
      paymentId: "pay-4",
      saleId: "sale-4",
      mercadopagoId: "mp-4",
      amount: 199.9,
    });
    expect(result).toEqual({
      matched: true,
      paymentId: "pay-4",
      newStatus: "PAID",
    });
  });
});

describe("syncMpPayment — non-approved remote statuses", () => {
  it.each([
    ["pending"],
    ["in_process"],
    ["rejected"],
    ["cancelled"],
    ["refunded"],
  ])(
    "does NOT touch DB or publish on remote.%s — surfaces status verbatim",
    async (remoteStatus: string) => {
      getMpPaymentMock.mockResolvedValue({
        id: "mp-x",
        status: remoteStatus as
          | "pending"
          | "approved"
          | "rejected"
          | "cancelled"
          | "refunded"
          | "in_process",
        externalReference: null,
        amount: 25,
      });
      findFirstPayment.mockResolvedValue({
        id: "pay-x",
        status: "PENDING",
        sale: { tenantId: "t-1", id: "sale-x" },
      });

      const result = await syncMpPayment({ mercadopagoId: "mp-x" });

      expect(updatePayment).not.toHaveBeenCalled();
      expect(publishMock).not.toHaveBeenCalled();
      expect(result).toEqual({
        matched: true,
        paymentId: "pay-x",
        newStatus: remoteStatus,
      });
    },
  );
});
