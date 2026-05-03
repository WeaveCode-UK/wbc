// T2.12 — outbox publisher (CHECAGEM.md L614-620)
//
// `PrismaOutboxRepository.save` is the write side of the transactional
// outbox: every domain event must land in `OutboxEvent` with the same
// shape the worker expects (type / tenantId / payload). If we ever
// silently drop a field — or worse, mis-route the event to a different
// table — every downstream invariant guarded by event handlers
// (inventory, finance, notifications) starts breaking in production
// without an obvious cause.
//
// We mock the Prisma client at the module boundary using `vi.hoisted`
// so the fakes exist before the repository imports `prisma` from
// `../index`. The repo lives in @wbc/db; the alias in vitest.config.ts
// resolves both `@wbc/db` and the relative `../index` to the same
// module, so a single mock covers both call paths.
//
// The metadata/traceparent assertion lives in event-publisher.test (the
// publisher attaches metadata via `getActiveTraceContext()`); the repo
// itself is intentionally agnostic to metadata — its job is to persist
// whatever shape the publisher hands down. The current schema only
// stores `type/tenantId/payload`, so we lock that surface here and
// leave the metadata propagation to a follow-up if the schema gains a
// `metadata` column (see docs/RELIABILITY-FOLLOWUP.md).

import { describe, it, expect, vi, beforeEach } from "vitest";

const { createOutboxEvent, createManyOutboxEvent } = vi.hoisted(() => ({
  createOutboxEvent: vi.fn().mockResolvedValue({ id: "row-1" }),
  createManyOutboxEvent: vi.fn().mockResolvedValue({ count: 0 }),
}));

vi.mock("../../index", () => ({
  prisma: {
    outboxEvent: {
      create: createOutboxEvent,
      createMany: createManyOutboxEvent,
    },
  },
}));

import { PrismaOutboxRepository } from "../prisma-outbox-repository";
import type { DomainEvent } from "@wbc/shared";

beforeEach(() => {
  createOutboxEvent.mockClear();
  createManyOutboxEvent.mockClear();
});

const baseEvent: DomainEvent<{ saleId: string }> = {
  id: "evt-1",
  type: "sale.confirmed",
  tenantId: "t-1",
  payload: { saleId: "sale-9" },
  timestamp: new Date("2026-01-01T00:00:00Z"),
  version: 1,
};

describe("PrismaOutboxRepository.save", () => {
  it("persists the event row with type/tenantId/payload", async () => {
    const repo = new PrismaOutboxRepository();
    await repo.save(baseEvent);

    expect(createOutboxEvent).toHaveBeenCalledOnce();
    expect(createOutboxEvent).toHaveBeenCalledWith({
      data: {
        type: "sale.confirmed",
        tenantId: "t-1",
        payload: { saleId: "sale-9" },
      },
    });
  });

  it("does not synthesize an id — the DB owns it (uuid default)", async () => {
    const repo = new PrismaOutboxRepository();
    await repo.save(baseEvent);

    const data = createOutboxEvent.mock.calls[0][0].data;
    expect(data).not.toHaveProperty("id");
    expect(data).not.toHaveProperty("status"); // schema default = PENDING
  });

  it("forwards the payload object as-is (no JSON.stringify)", async () => {
    const repo = new PrismaOutboxRepository();
    const complex = {
      saleId: "s1",
      items: [{ productId: "p1", qty: 2 }],
      cashbackUsed: 10.5,
    };
    await repo.save({ ...baseEvent, payload: complex });

    const data = createOutboxEvent.mock.calls[0][0].data;
    expect(data.payload).toBe(complex); // identity — no copy/serialise
  });
});

describe("PrismaOutboxRepository.saveBatch", () => {
  it("issues a single createMany with every row mapped", async () => {
    const repo = new PrismaOutboxRepository();
    await repo.saveBatch([
      { ...baseEvent, id: "e1", payload: { saleId: "s1" } },
      { ...baseEvent, id: "e2", payload: { saleId: "s2" } },
    ]);

    expect(createManyOutboxEvent).toHaveBeenCalledOnce();
    expect(createManyOutboxEvent).toHaveBeenCalledWith({
      data: [
        { type: "sale.confirmed", tenantId: "t-1", payload: { saleId: "s1" } },
        { type: "sale.confirmed", tenantId: "t-1", payload: { saleId: "s2" } },
      ],
    });
  });

  it("is a no-op-shaped call when the batch is empty (predictable contract)", async () => {
    const repo = new PrismaOutboxRepository();
    await repo.saveBatch([]);

    expect(createManyOutboxEvent).toHaveBeenCalledWith({ data: [] });
  });
});
