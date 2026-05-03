// T5.3 — confirmSale transactional rollback against a real Postgres.
//
// WHY: `PrismaSaleRepository.confirmAtomic` runs sale-status, stock,
// cashback and outbox writes inside a single Serializable transaction.
// The contract is "all or nothing" — any failure mid-flight must roll
// back the lot. Mocked-tx unit tests cannot prove this; only
// observing real PG state after a thrown error can. We reproduce the
// adapter's transactional shape inline (Serializable, same operations
// in the same order) and inject a failure during the cashback step.
// Then we assert: sale stays DRAFT, stock unchanged, no outbox row.

import { describe, it, beforeAll, afterAll, expect } from "vitest";
import { PrismaClient, Prisma } from "@prisma/client";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { applyMigrations, SHOULD_RUN_INTEGRATION } from "./_helpers";

describe.skipIf(!SHOULD_RUN_INTEGRATION)("confirmAtomic rollback", () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaClient;
  let tenantId: string;
  let clientId: string;
  let productId: string;
  const INITIAL_STOCK = 50;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:16-alpine")
      .withCommand(["postgres", "-c", "shared_buffers=128MB"])
      .start();
    const url = container.getConnectionUri();
    applyMigrations(url);
    prisma = new PrismaClient({ datasources: { db: { url } } });

    const tenant = await prisma.tenant.create({
      data: { name: "T", slug: `t-${Date.now()}` },
    });
    tenantId = tenant.id;

    const brand = await prisma.brand.create({ data: { name: "B" } });
    const product = await prisma.product.create({
      data: { tenantId, brandId: brand.id, name: "P", price: "10.00" },
    });
    productId = product.id;

    const client = await prisma.client.create({
      data: { tenantId, name: "C", phone: "+5511000099000" },
    });
    clientId = client.id;

    await prisma.stock.create({
      data: { tenantId, productId, quantity: INITIAL_STOCK },
    });
  }, 120_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    await container?.stop();
  });

  it("rolls back sale status, stock decrement, and outbox event when cashback step throws", async () => {
    const sale = await prisma.sale.create({
      data: {
        tenantId,
        clientId,
        status: "DRAFT",
        total: "20.00",
        items: {
          create: {
            productId,
            quantity: 2,
            unitPrice: "10.00",
            subtotal: "20.00",
          },
        },
      },
    });

    const outboxBefore = await prisma.outboxEvent.count({
      where: { tenantId },
    });

    // WHY: mirror the real `confirmAtomic` Serializable transaction so
    // the test exercises the same `tx.update` → `tx.stock.updateMany`
    // → (cashback) → `tx.outboxEvent.create` ordering. We swap the
    // cashback step for a hard throw to prove that everything before it
    // unwinds when the tx aborts.
    const sentinel = new Error("INJECTED_FAILURE_DURING_CASHBACK");
    await expect(
      prisma.$transaction(
        async (tx) => {
          await tx.sale.update({
            where: { id: sale.id },
            data: { status: "CONFIRMED" },
          });

          const updated = await tx.stock.updateMany({
            where: { tenantId, productId, quantity: { gte: 2 } },
            data: { quantity: { decrement: 2 } },
          });
          if (updated.count !== 1) {
            throw new Error("unexpected stock state in test setup");
          }

          // WHY: failure injected here — same point in the flow where
          // cashback creation lives in the real adapter. The throw
          // must abort the whole transaction (Serializable rolls back
          // the prior UPDATEs as well).
          throw sentinel;
        },
        { isolationLevel: "Serializable" },
      ),
    ).rejects.toBe(sentinel);

    const reread = await prisma.sale.findUniqueOrThrow({
      where: { id: sale.id },
    });
    expect(reread.status).toBe("DRAFT");

    const stock = await prisma.stock.findUniqueOrThrow({
      where: { productId },
    });
    expect(stock.quantity).toBe(INITIAL_STOCK);

    const outboxAfter = await prisma.outboxEvent.count({ where: { tenantId } });
    expect(outboxAfter).toBe(outboxBefore);
  });

  it("commits sale + stock + outbox atomically on the happy path", async () => {
    // WHY: control test — confirms the same shape *does* persist when
    // the transaction completes. Without this we wouldn't know whether
    // the rollback assertion above is meaningful or whether the writes
    // were never landing in the first place.
    const sale = await prisma.sale.create({
      data: {
        tenantId,
        clientId,
        status: "DRAFT",
        total: "10.00",
        items: {
          create: {
            productId,
            quantity: 1,
            unitPrice: "10.00",
            subtotal: "10.00",
          },
        },
      },
    });

    const stockBefore = (
      await prisma.stock.findUniqueOrThrow({ where: { productId } })
    ).quantity;

    await prisma.$transaction(
      async (tx) => {
        await tx.sale.update({
          where: { id: sale.id },
          data: { status: "CONFIRMED" },
        });
        await tx.stock.updateMany({
          where: { tenantId, productId, quantity: { gte: 1 } },
          data: { quantity: { decrement: 1 } },
        });
        await tx.outboxEvent.create({
          data: {
            type: "sale.confirmed",
            tenantId,
            payload: { saleId: sale.id } as Prisma.JsonObject,
          },
        });
      },
      { isolationLevel: "Serializable" },
    );

    const reread = await prisma.sale.findUniqueOrThrow({
      where: { id: sale.id },
    });
    expect(reread.status).toBe("CONFIRMED");

    const stock = await prisma.stock.findUniqueOrThrow({
      where: { productId },
    });
    expect(stock.quantity).toBe(stockBefore - 1);

    const outbox = await prisma.outboxEvent.findFirst({
      where: { type: "sale.confirmed", tenantId },
    });
    expect(outbox).not.toBeNull();
  });
});
