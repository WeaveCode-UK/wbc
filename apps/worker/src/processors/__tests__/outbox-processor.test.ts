// T2.13 — outbox subscriber / dispatch (CHECAGEM.md L614-620)
//
// `processOutbox` is the read side of the transactional outbox: it
// claims a batch of PENDING events, dispatches each to its registered
// handlers, and either marks PROCESSED or — on any handler failure —
// hands the event back to `markFailed` for backoff/DLQ. Two regressions
// would be silent in production:
//
//   1. dispatch swallows handler errors and we mark PROCESSED anyway
//      (the ACH-001 fix history). A sale would confirm with no stock
//      decrement, and the bug only surfaces in the inventory month-end
//      reconciliation.
//   2. We never iterate the batch (early return on first failure).
//      Then a single bad event blocks every newer event behind it.
//
// The retry/DLQ count threshold itself is enforced inside
// `markFailed` — `outbox-processor.test` only proves the processor
// CALLS `markFailed` on error and `markProcessed` on success. The
// attempts→FAILED transition is covered by T2.14's sibling.
//
// We mock both the outbox repo (via @wbc/db, a workspace alias resolved
// in vitest.config.ts) and the event-subscriber `dispatch` from
// @wbc/shared. `withTenant` is the real impl — it's a pure helper.

import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  claimPending,
  markProcessed,
  markFailed,
  dispatchMock,
  logIfInvalidEventPayloadMock,
} = vi.hoisted(() => ({
  claimPending: vi.fn(),
  markProcessed: vi.fn().mockResolvedValue(undefined),
  markFailed: vi.fn().mockResolvedValue(undefined),
  dispatchMock: vi.fn(),
  logIfInvalidEventPayloadMock: vi.fn(),
}));

vi.mock("@wbc/db", () => ({
  PrismaOutboxRepository: class {
    claimPending = claimPending;
    markProcessed = markProcessed;
    markFailed = markFailed;
  },
}));

vi.mock("@wbc/shared", async () => {
  const actual =
    await vi.importActual<typeof import("@wbc/shared")>("@wbc/shared");
  return {
    ...actual,
    dispatch: dispatchMock,
    logIfInvalidEventPayload: logIfInvalidEventPayloadMock,
  };
});

import { processOutbox } from "../outbox-processor";

beforeEach(() => {
  claimPending.mockReset();
  markProcessed.mockClear();
  markFailed.mockClear();
  dispatchMock.mockReset();
  logIfInvalidEventPayloadMock.mockClear();
});

describe("processOutbox", () => {
  it("does nothing when the claim returns an empty batch", async () => {
    claimPending.mockResolvedValue([]);
    await processOutbox();

    expect(dispatchMock).not.toHaveBeenCalled();
    expect(markProcessed).not.toHaveBeenCalled();
    expect(markFailed).not.toHaveBeenCalled();
  });

  it("marks an event PROCESSED after a successful dispatch", async () => {
    claimPending.mockResolvedValue([
      {
        id: "evt-1",
        type: "sale.confirmed",
        tenantId: "t-1",
        payload: { saleId: "s1" },
      },
    ]);
    dispatchMock.mockResolvedValue(undefined);

    await processOutbox();

    expect(dispatchMock).toHaveBeenCalledOnce();
    expect(dispatchMock).toHaveBeenCalledWith({
      id: "evt-1",
      type: "sale.confirmed",
      tenantId: "t-1",
      payload: { saleId: "s1" },
    });
    expect(markProcessed).toHaveBeenCalledWith("evt-1");
    expect(markFailed).not.toHaveBeenCalled();
  });

  it("marks the event FAILED when dispatch rejects (handler error)", async () => {
    claimPending.mockResolvedValue([
      {
        id: "evt-1",
        type: "sale.confirmed",
        tenantId: "t-1",
        payload: {},
      },
    ]);
    dispatchMock.mockRejectedValue(new Error("inventory handler exploded"));

    await processOutbox();

    expect(markFailed).toHaveBeenCalledWith("evt-1");
    expect(markProcessed).not.toHaveBeenCalled();
  });

  it("does not stop the batch on a single failure — every event is attempted", async () => {
    // Regression guard: a bad event in the middle of the batch must not
    // starve the events behind it.
    claimPending.mockResolvedValue([
      { id: "ok-1", type: "sale.confirmed", tenantId: "t1", payload: {} },
      { id: "bad", type: "sale.confirmed", tenantId: "t1", payload: {} },
      { id: "ok-2", type: "sale.confirmed", tenantId: "t1", payload: {} },
    ]);
    dispatchMock
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(undefined);

    await processOutbox();

    expect(dispatchMock).toHaveBeenCalledTimes(3);
    expect(markProcessed).toHaveBeenCalledWith("ok-1");
    expect(markProcessed).toHaveBeenCalledWith("ok-2");
    expect(markFailed).toHaveBeenCalledWith("bad");
  });

  it("revalidates the payload schema on the consumer side", async () => {
    // ACH-011 apis-integracoes: drift detection at the worker boundary.
    claimPending.mockResolvedValue([
      {
        id: "evt-1",
        type: "sale.confirmed",
        tenantId: "t-1",
        payload: { saleId: "s1" },
      },
    ]);
    dispatchMock.mockResolvedValue(undefined);

    await processOutbox();

    expect(logIfInvalidEventPayloadMock).toHaveBeenCalledWith(
      "sale.confirmed",
      { saleId: "s1" },
    );
  });
});

// ---------------------------------------------------------------
// withIdempotentHandler — companion test (CHECAGEM line in T2.13)
// ---------------------------------------------------------------
//
// The wrapper turns a handler into "exactly-once-per-handler". On a
// duplicate delivery it skips the side-effect by checking the
// ProcessedEvent claim. We test it here because the outbox-processor
// is the natural caller.

import { withIdempotentHandler } from "@wbc/shared/events/with-idempotent-handler";

describe("withIdempotentHandler", () => {
  it("invokes the effect on the first claim", async () => {
    const claimer = { claim: vi.fn().mockResolvedValue(true) };
    const effect = vi.fn().mockResolvedValue(undefined);

    const result = await withIdempotentHandler(
      { eventId: "e1", handlerName: "h1" },
      claimer,
      effect,
    );

    expect(result).toBe("executed");
    expect(effect).toHaveBeenCalledOnce();
    expect(claimer.claim).toHaveBeenCalledWith("e1", "h1");
  });

  it("skips the effect when the claim says already processed", async () => {
    const claimer = { claim: vi.fn().mockResolvedValue(false) };
    const effect = vi.fn();

    const result = await withIdempotentHandler(
      { eventId: "e1", handlerName: "h1" },
      claimer,
      effect,
    );

    expect(result).toBe("already_processed");
    expect(effect).not.toHaveBeenCalled();
  });

  it("propagates effect failures so the outbox retries (no swallow)", async () => {
    const claimer = { claim: vi.fn().mockResolvedValue(true) };
    const effect = vi.fn().mockRejectedValue(new Error("downstream failed"));

    await expect(
      withIdempotentHandler(
        { eventId: "e1", handlerName: "h1" },
        claimer,
        effect,
      ),
    ).rejects.toThrow("downstream failed");
  });
});
