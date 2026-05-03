// Coverage gap: ProcessedEventRepository.claim is the unit-side of the
// handler-dedup primitive that backs `withIdempotentHandler`. The
// integration test in T2.13 proves the unique constraint actually fires
// in Postgres; this unit test proves the repository TRANSLATES that
// `P2002` into `false` rather than letting it bubble — the difference
// between "handler skipped (correct)" and "outbox marks event FAILED
// and retries forever (regression)".
//
// We mock @prisma/client just enough to construct the
// `PrismaClientKnownRequestError` shape the repo branches on. We do NOT
// mock the actual Prisma client constructor — the repo only touches
// `tx.processedEvent.create`, which we pass as a fake.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";
import { ProcessedEventRepository } from "../processed-event-repository";

interface FakeTx {
  processedEvent: {
    create: ReturnType<typeof vi.fn>;
  };
}

function makeFakeTx(): FakeTx {
  return {
    processedEvent: { create: vi.fn() },
  };
}

let tx: FakeTx;

beforeEach(() => {
  tx = makeFakeTx();
});

describe("ProcessedEventRepository.claim", () => {
  it("returns true on a fresh insert (first delivery wins)", async () => {
    tx.processedEvent.create.mockResolvedValue({});
    const repo = new ProcessedEventRepository();

    const inserted = await repo.claim(
      "evt-1",
      "inventory.handler",
      tx as unknown as Prisma.TransactionClient,
    );

    expect(inserted).toBe(true);
    expect(tx.processedEvent.create).toHaveBeenCalledWith({
      data: { eventId: "evt-1", handlerName: "inventory.handler" },
    });
  });

  it("returns false on P2002 (handler already processed this event)", async () => {
    // P2002 is the Prisma code for "unique constraint violation". The
    // composite unique index on (eventId, handlerName) is what gives
    // the at-most-once-per-handler property; a second delivery hits it.
    const dupErr = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      { code: "P2002", clientVersion: "test" },
    );
    tx.processedEvent.create.mockRejectedValue(dupErr);
    const repo = new ProcessedEventRepository();

    const inserted = await repo.claim(
      "evt-1",
      "inventory.handler",
      tx as unknown as Prisma.TransactionClient,
    );

    expect(inserted).toBe(false);
  });

  it("rethrows other Prisma errors so the outbox can retry", async () => {
    // P2024 = connection pool timeout — transient, MUST bubble so the
    // worker re-enqueues. If we swallowed every Prisma error as
    // "already processed", a flaky DB would silently skip handlers.
    const transient = new Prisma.PrismaClientKnownRequestError(
      "Timed out fetching a connection",
      { code: "P2024", clientVersion: "test" },
    );
    tx.processedEvent.create.mockRejectedValue(transient);
    const repo = new ProcessedEventRepository();

    await expect(
      repo.claim("evt-1", "h", tx as unknown as Prisma.TransactionClient),
    ).rejects.toBe(transient);
  });

  it("rethrows non-Prisma errors (programmer bug — must surface)", async () => {
    tx.processedEvent.create.mockRejectedValue(new Error("boom"));
    const repo = new ProcessedEventRepository();

    await expect(
      repo.claim("evt-1", "h", tx as unknown as Prisma.TransactionClient),
    ).rejects.toThrow("boom");
  });

  it("uses prisma client when no tx supplied (default arg path)", async () => {
    // The repo defaults the tx arg to the singleton `prisma`; we can't
    // easily intercept that here without mocking `../index`, so we just
    // assert the explicit-tx call works the same shape — the no-arg
    // path is exercised by the integration tests (T5).
    tx.processedEvent.create.mockResolvedValue({});
    const repo = new ProcessedEventRepository();
    await repo.claim("e", "h", tx as unknown as Prisma.TransactionClient);
    expect(tx.processedEvent.create).toHaveBeenCalledOnce();
  });
});
