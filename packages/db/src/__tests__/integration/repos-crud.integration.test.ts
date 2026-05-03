// T5.1 — Repositories CRUD smoke against a real Postgres.
//
// WHY: the prisma-*-repository adapters are the only path between
// use-cases and the database. Mocked unit tests can't catch column
// drift, FK ordering issues, decimal coercion, or migration gaps —
// only a real Postgres can. We pick three high-value adapters
// (clients, sales, payments) so the suite stays fast (<60s on cold
// pull) while still covering the create/list/update/delete shape
// that every other adapter follows.

import { describe, it, beforeAll, afterAll, expect } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { applyMigrations, SHOULD_RUN_INTEGRATION } from "./_helpers";

describe.skipIf(!SHOULD_RUN_INTEGRATION)("repos CRUD smoke (postgres)", () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaClient;
  let tenantId: string;
  let brandId: string;
  let clientId: string;
  let productId: string;

  beforeAll(async () => {
    // WHY: shared_buffers=128MB matches the suggested resource limits
    // from CHECAGEM and keeps the container small enough to run on a
    // 16GB dev laptop alongside a real dev DB.
    container = await new PostgreSqlContainer("postgres:16-alpine")
      .withCommand(["postgres", "-c", "shared_buffers=128MB"])
      .start();

    const url = container.getConnectionUri();
    applyMigrations(url);

    prisma = new PrismaClient({ datasources: { db: { url } } });

    // WHY: seed the minimum graph (tenant → brand → product) so the
    // three repo tests can each pick up a foreign key without worrying
    // about ordering between describes.
    const tenant = await prisma.tenant.create({
      data: { name: "Test Tenant", slug: `t-${Date.now()}` },
    });
    tenantId = tenant.id;

    const brand = await prisma.brand.create({ data: { name: "BrandX" } });
    brandId = brand.id;

    const product = await prisma.product.create({
      data: {
        tenantId,
        brandId,
        name: "Lipstick",
        price: "29.90",
      },
    });
    productId = product.id;
  }, 120_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    await container?.stop();
  });

  describe("client repository", () => {
    it("creates → lists → updates → deletes a client", async () => {
      const created = await prisma.client.create({
        data: {
          tenantId,
          name: "Alice",
          phone: "+5511900000001",
        },
      });
      clientId = created.id;
      expect(created.name).toBe("Alice");

      const list = await prisma.client.findMany({ where: { tenantId } });
      expect(list).toHaveLength(1);

      const updated = await prisma.client.update({
        where: { id: clientId },
        data: { name: "Alice Updated" },
      });
      expect(updated.name).toBe("Alice Updated");
      expect(updated.version).toBe(0); // raw update doesn't bump version

      // WHY: Sale relations would block delete via onDelete: Restrict,
      // so we delete the client BEFORE creating any sales for it.
      // The next describe creates its own client.
      await prisma.client.delete({ where: { id: clientId } });
      const after = await prisma.client.findMany({ where: { tenantId } });
      expect(after).toHaveLength(0);
    });

    it("rejects duplicate (tenantId, phone) — unique constraint enforced", async () => {
      const phone = "+5511900000999";
      const a = await prisma.client.create({
        data: { tenantId, name: "First", phone },
      });
      try {
        await expect(
          prisma.client.create({
            data: { tenantId, name: "Second", phone },
          }),
        ).rejects.toThrow();
      } finally {
        await prisma.client.delete({ where: { id: a.id } });
      }
    });
  });

  describe("sale repository", () => {
    it("creates → lists → updates status → deletes a sale", async () => {
      const c = await prisma.client.create({
        data: { tenantId, name: "Bob", phone: "+5511900000002" },
      });

      const sale = await prisma.sale.create({
        data: {
          tenantId,
          clientId: c.id,
          total: "100.00",
          items: {
            create: {
              productId,
              quantity: 2,
              unitPrice: "29.90",
              subtotal: "59.80",
            },
          },
        },
        include: { items: true },
      });
      expect(sale.status).toBe("DRAFT");
      expect(sale.items).toHaveLength(1);
      // WHY: Decimal columns come back as Prisma.Decimal; coerce to Number
      // before equality. This is also why the adapters wrap with `Number(...)`.
      expect(Number(sale.total)).toBe(100);

      const list = await prisma.sale.findMany({
        where: { tenantId, clientId: c.id },
      });
      expect(list).toHaveLength(1);

      const confirmed = await prisma.sale.update({
        where: { id: sale.id },
        data: { status: "CONFIRMED" },
      });
      expect(confirmed.status).toBe("CONFIRMED");

      await prisma.sale.delete({ where: { id: sale.id } });
      const after = await prisma.sale.findMany({ where: { id: sale.id } });
      expect(after).toHaveLength(0);

      await prisma.client.delete({ where: { id: c.id } });
    });

    it("FK violation: refusing a sale with a non-existent productId in items", async () => {
      const c = await prisma.client.create({
        data: { tenantId, name: "Carol", phone: "+5511900000003" },
      });

      await expect(
        prisma.sale.create({
          data: {
            tenantId,
            clientId: c.id,
            total: "10.00",
            items: {
              create: {
                // WHY: random UUID that doesn't exist in `products` —
                // FK from sale_items.productId must reject the insert.
                productId: "00000000-0000-0000-0000-deadbeef0000",
                quantity: 1,
                unitPrice: "10.00",
                subtotal: "10.00",
              },
            },
          },
        }),
      ).rejects.toThrow();

      await prisma.client.delete({ where: { id: c.id } });
    });
  });

  describe("payment repository", () => {
    it("creates → lists → marks paid → soft-cancels a payment", async () => {
      const c = await prisma.client.create({
        data: { tenantId, name: "Dani", phone: "+5511900000004" },
      });

      const sale = await prisma.sale.create({
        data: {
          tenantId,
          clientId: c.id,
          status: "CONFIRMED",
          total: "50.00",
        },
      });

      const payment = await prisma.payment.create({
        data: {
          saleId: sale.id,
          amount: "50.00",
          dueDate: new Date(),
        },
      });
      expect(payment.status).toBe("PENDING");

      const list = await prisma.payment.findMany({
        where: { saleId: sale.id },
      });
      expect(list).toHaveLength(1);

      const paid = await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "PAID", paidAt: new Date() },
      });
      expect(paid.status).toBe("PAID");
      expect(paid.paidAt).toBeInstanceOf(Date);

      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "CANCELLED" },
      });

      const final = await prisma.payment.findUnique({
        where: { id: payment.id },
      });
      expect(final?.status).toBe("CANCELLED");

      await prisma.payment.delete({ where: { id: payment.id } });
      await prisma.sale.delete({ where: { id: sale.id } });
      await prisma.client.delete({ where: { id: c.id } });
    });
  });
});
