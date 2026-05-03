import { router, protectedProcedure } from "../trpc/trpc";
import { prisma } from "@wbc/db";
import { PrismaStockRepository } from "../../../../packages/business/inventory/adapters/prisma-stock-repository";
import { PrismaBrandOrderRepository } from "../../../../packages/business/inventory/adapters/prisma-brand-order-repository";
import { PrismaSampleRepository } from "../../../../packages/business/inventory/adapters/prisma-sample-repository";
import {
  listStock,
  updateStock,
  adjustStock,
} from "../../../../packages/business/inventory/use-cases/manage-stock";
import {
  listOrders,
  createOrder,
  receiveOrder,
  cancelOrder,
} from "../../../../packages/business/inventory/use-cases/manage-orders";
import {
  listSamples,
  createSample,
  markSampleConverted,
  getSampleROI,
} from "../../../../packages/business/inventory/use-cases/manage-samples";
// ACH-008 apis-integracoes: schemas centralised in @wbc/validators so the
// UI, the API, and any future SDK see the same shape.
import {
  adjustStockSchema,
  cancelOrderSchema,
  createOrderSchema,
  createSampleSchema,
  listOrdersSchema,
  listSamplesSchema,
  listStockSchema,
  markSampleConvertedSchema,
  receiveOrderSchema,
  updateStockSchema,
} from "@wbc/validators";
import { idempotentRoute } from "../trpc/idempotency-middleware";

const stockRepo = new PrismaStockRepository();
const orderRepo = new PrismaBrandOrderRepository();
const sampleRepo = new PrismaSampleRepository();

export const inventoryRouter = router({
  listStock: protectedProcedure
    .input(listStockSchema)
    .query(async ({ ctx, input }) => {
      const stocks = await listStock(
        ctx.tenant.tenantId,
        input.lowOnly,
        stockRepo,
      );
      // Enrich with product names so the UI doesn't render UUIDs.
      // Single round-trip, scoped to the tenant via stock filtering above.
      const productIds = stocks.map((s) => s.productId);
      const products = productIds.length
        ? await prisma.product.findMany({
            where: { tenantId: ctx.tenant.tenantId, id: { in: productIds } },
            select: { id: true, name: true, brand: { select: { name: true } } },
          })
        : [];
      const byId = new Map(products.map((p) => [p.id, p]));
      return stocks.map((s) => {
        const p = byId.get(s.productId);
        return {
          ...s,
          productName: p?.name ?? s.productId,
          brandName: p?.brand?.name ?? null,
        };
      });
    }),

  updateStock: protectedProcedure
    .input(updateStockSchema)
    .mutation(async ({ ctx, input }) => {
      return updateStock(
        ctx.tenant.tenantId,
        input.productId,
        input.quantity,
        stockRepo,
      );
    }),

  adjustStock: protectedProcedure
    .input(adjustStockSchema)
    .mutation(async ({ ctx, input }) => {
      return adjustStock(
        ctx.tenant.tenantId,
        input.productId,
        input.adjustment,
        stockRepo,
      );
    }),

  listOrders: protectedProcedure
    .input(listOrdersSchema)
    .query(async ({ ctx, input }) => {
      const orders = await listOrders(
        ctx.tenant.tenantId,
        input.status,
        orderRepo,
      );
      const brandIds = Array.from(new Set(orders.map((o) => o.brandId)));
      const brands = brandIds.length
        ? await prisma.brand.findMany({
            where: { id: { in: brandIds } },
            select: { id: true, name: true },
          })
        : [];
      const byId = new Map(brands.map((b) => [b.id, b]));
      return orders.map((o) => ({
        ...o,
        brandName: byId.get(o.brandId)?.name ?? o.brandId,
      }));
    }),

  createOrder: protectedProcedure
    .input(createOrderSchema)
    .mutation(async ({ ctx, input }) => {
      // ACH-001 apis-integracoes: wrapper derives a key when the client
      // omits one. See docs/architecture/api-idempotency.md.
      return idempotentRoute(
        "inventory.createOrder",
        ctx.tenant.tenantId,
        input,
        () =>
          createOrder(
            ctx.tenant.tenantId,
            input.brandId,
            input.items,
            input.notes,
            orderRepo,
          ),
      );
    }),

  receiveOrder: protectedProcedure
    .input(receiveOrderSchema)
    .mutation(async ({ ctx, input }) => {
      return idempotentRoute(
        "inventory.receiveOrder",
        ctx.tenant.tenantId,
        input,
        () => receiveOrder(ctx.tenant.tenantId, input.id, orderRepo),
      );
    }),

  cancelOrder: protectedProcedure
    .input(cancelOrderSchema)
    .mutation(async ({ ctx, input }) => {
      return cancelOrder(ctx.tenant.tenantId, input.id, orderRepo);
    }),

  listSamples: protectedProcedure
    .input(listSamplesSchema)
    .query(async ({ ctx, input }) => {
      return listSamples(
        ctx.tenant.tenantId,
        input.page,
        input.limit,
        sampleRepo,
      );
    }),

  createSample: protectedProcedure
    .input(createSampleSchema)
    .mutation(async ({ ctx, input }) => {
      return createSample(
        ctx.tenant.tenantId,
        input.productId,
        input.clientId,
        input.quantity,
        input.cost,
        sampleRepo,
      );
    }),

  markSampleConverted: protectedProcedure
    .input(markSampleConvertedSchema)
    .mutation(async ({ ctx, input }) => {
      return markSampleConverted(ctx.tenant.tenantId, input.id, sampleRepo);
    }),

  getSampleROI: protectedProcedure.query(async ({ ctx }) => {
    return getSampleROI(ctx.tenant.tenantId, sampleRepo);
  }),
});
