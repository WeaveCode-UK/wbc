// T2.14 — claimPending + markFailed (CHECAGEM.md L614-620)
//
// `claimPending` is the atomic dequeue: a `FOR UPDATE SKIP LOCKED`
// raw-SQL UPDATE that flips PENDING→PROCESSING and RETURNs the rows.
// At unit level we can prove the *contract* (limit forwarded, raw SQL
// used, return shape preserved, empty batch returns []), but we cannot
// prove that two concurrent workers actually pick disjoint rows — that
// requires a real Postgres and is the job of T5 with testcontainers
// (`wbc/CHECAGEM.md` Reliability test plan).
//
// `markFailed` we DO test fully here: the attempts→FAILED transition
// and the exponential-backoff PENDING re-schedule are pure logic on
// top of `prisma.outboxEvent.update`, so a Prisma mock is enough.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const {
  queryRaw,
  findUniqueOutboxEvent,
  updateOutboxEvent,
  updateManyOutboxEvent,
  findManyOutboxEvent,
} = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  findUniqueOutboxEvent: vi.fn(),
  updateOutboxEvent: vi.fn().mockResolvedValue({}),
  updateManyOutboxEvent: vi.fn().mockResolvedValue({ count: 1 }),
  findManyOutboxEvent: vi.fn(),
}));

vi.mock("../../index", () => ({
  prisma: {
    $queryRaw: queryRaw,
    outboxEvent: {
      findUnique: findUniqueOutboxEvent,
      update: updateOutboxEvent,
      updateMany: updateManyOutboxEvent,
      findMany: findManyOutboxEvent,
    },
  },
}));

import { PrismaOutboxRepository } from "../prisma-outbox-repository";

beforeEach(() => {
  queryRaw.mockReset();
  findUniqueOutboxEvent.mockReset();
  updateOutboxEvent.mockClear().mockResolvedValue({});
  updateManyOutboxEvent.mockClear().mockResolvedValue({ count: 1 });
  findManyOutboxEvent.mockReset();
  delete process.env.OUTBOX_CLAIM_STRATEGY;
});

describe("claimPending (FIFO, default)", () => {
  it("returns the rows the raw query produces, verbatim", async () => {
    queryRaw.mockResolvedValue([
      { id: "e1", type: "sale.confirmed", tenantId: "t1", payload: { x: 1 } },
      { id: "e2", type: "sale.confirmed", tenantId: "t2", payload: { x: 2 } },
    ]);
    const repo = new PrismaOutboxRepository();
    const rows = await repo.claimPending(50);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      id: "e1",
      type: "sale.confirmed",
      tenantId: "t1",
      payload: { x: 1 },
    });
  });

  it("forwards the batch size into the SQL via tagged-template values", async () => {
    queryRaw.mockResolvedValue([]);
    const repo = new PrismaOutboxRepository();
    await repo.claimPending(25);

    // The Prisma tagged template hands its values as the second arg.
    // values[0] is `limit` per the SQL template.
    const callValues = queryRaw.mock.calls[0][1];
    expect(callValues).toBe(25);
  });

  it("uses FOR UPDATE SKIP LOCKED to avoid double-claim under concurrency", async () => {
    queryRaw.mockResolvedValue([]);
    const repo = new PrismaOutboxRepository();
    await repo.claimPending(10);

    // The raw SQL is the first argument (a TemplateStringsArray).
    const sqlParts: TemplateStringsArray = queryRaw.mock.calls[0][0];
    const sql = sqlParts.join(" ");
    expect(sql).toMatch(/FOR UPDATE SKIP LOCKED/i);
    expect(sql).toMatch(/SET "status" = 'PROCESSING'/i);
    expect(sql).toMatch(/RETURNING/i);
  });

  it("returns [] when no events are pending", async () => {
    queryRaw.mockResolvedValue([]);
    const repo = new PrismaOutboxRepository();
    const rows = await repo.claimPending(50);
    expect(rows).toEqual([]);
  });

  it("respects nextRetryAt by including it in the WHERE clause", async () => {
    // Backoff invariant: events with nextRetryAt > NOW() must NOT be
    // eligible. We can't run NOW() here, but we can prove the SQL has
    // the predicate so a refactor that drops it gets caught.
    queryRaw.mockResolvedValue([]);
    const repo = new PrismaOutboxRepository();
    await repo.claimPending(10);

    const sql = (queryRaw.mock.calls[0][0] as TemplateStringsArray).join(" ");
    expect(sql).toMatch(/nextRetryAt.*IS NULL.*OR.*nextRetryAt.*<=.*NOW/is);
  });
});

describe("claimPending (round-robin, OUTBOX_CLAIM_STRATEGY=round_robin)", () => {
  it("uses DISTINCT ON to cap a noisy tenant to one event per batch", async () => {
    process.env.OUTBOX_CLAIM_STRATEGY = "round_robin";
    queryRaw.mockResolvedValue([]);
    const repo = new PrismaOutboxRepository();
    await repo.claimPending(50);

    const sql = (queryRaw.mock.calls[0][0] as TemplateStringsArray).join(" ");
    expect(sql).toMatch(/DISTINCT ON.*tenantId/is);
    expect(sql).toMatch(/FOR UPDATE SKIP LOCKED/i);
  });
});

describe("markFailed — retry + DLQ transition", () => {
  // We can't assert exact backoff because of the +/-50% jitter, but we
  // can lock the bracket: status PENDING with nextRetryAt > now.

  it("schedules a retry on the first failure (PENDING + nextRetryAt set)", async () => {
    findUniqueOutboxEvent.mockResolvedValue({ attempts: 0 });
    const repo = new PrismaOutboxRepository();
    const before = Date.now();
    await repo.markFailed("e1");

    const callData = updateOutboxEvent.mock.calls[0][0].data;
    expect(callData.status).toBe("PENDING");
    expect(callData.attempts).toBe(1);
    expect(callData.nextRetryAt.getTime()).toBeGreaterThan(before);
  });

  it("backoff window grows with attempts (jittered, attempt 3 > attempt 1 floor)", async () => {
    // Floor of attempt N = N^2 * 10_000 * 0.5 (jitter -50%).
    // attempt 1 floor = 5_000ms, attempt 3 floor = 45_000ms.
    findUniqueOutboxEvent.mockResolvedValueOnce({ attempts: 0 });
    const repo = new PrismaOutboxRepository();
    const t0 = Date.now();
    await repo.markFailed("e1");
    const firstNextRetry: Date =
      updateOutboxEvent.mock.calls[0][0].data.nextRetryAt;

    findUniqueOutboxEvent.mockResolvedValueOnce({ attempts: 2 });
    const t1 = Date.now();
    await repo.markFailed("e2");
    const thirdNextRetry: Date =
      updateOutboxEvent.mock.calls[1][0].data.nextRetryAt;

    expect(firstNextRetry.getTime() - t0).toBeLessThan(20_000); // attempt 1 ceiling
    expect(thirdNextRetry.getTime() - t1).toBeGreaterThan(20_000); // attempt 3 floor
  });

  it("moves to FAILED on the 5th attempt (MAX_ATTEMPTS = 5)", async () => {
    findUniqueOutboxEvent.mockResolvedValue({ attempts: 4 }); // next will be 5
    const repo = new PrismaOutboxRepository();
    await repo.markFailed("e1");

    expect(updateOutboxEvent).toHaveBeenCalledOnce();
    const data = updateOutboxEvent.mock.calls[0][0].data;
    expect(data.status).toBe("FAILED");
    expect(data.attempts).toBe(5);
    expect(data).not.toHaveProperty("nextRetryAt"); // no reschedule on terminal state
  });

  it("treats a missing event row as attempts=0 (defensive: no NaN)", async () => {
    findUniqueOutboxEvent.mockResolvedValue(null);
    const repo = new PrismaOutboxRepository();
    await repo.markFailed("ghost");

    const data = updateOutboxEvent.mock.calls[0][0].data;
    expect(data.attempts).toBe(1);
    expect(data.status).toBe("PENDING");
  });
});

describe("replayFromDLQ", () => {
  it("returns true when a DLQ row was reset to PENDING", async () => {
    updateManyOutboxEvent.mockResolvedValueOnce({ count: 1 });
    const repo = new PrismaOutboxRepository();
    const replayed = await repo.replayFromDLQ("dlq-1");

    expect(replayed).toBe(true);
    expect(updateManyOutboxEvent).toHaveBeenCalledWith({
      where: { id: "dlq-1", status: "DLQ" },
      data: { status: "PENDING", attempts: 0, nextRetryAt: null },
    });
  });

  it("returns false when the row was not in DLQ (no-op)", async () => {
    updateManyOutboxEvent.mockResolvedValueOnce({ count: 0 });
    const repo = new PrismaOutboxRepository();
    const replayed = await repo.replayFromDLQ("not-dlq");
    expect(replayed).toBe(false);
  });
});

afterEach(() => {
  delete process.env.OUTBOX_CLAIM_STRATEGY;
});
