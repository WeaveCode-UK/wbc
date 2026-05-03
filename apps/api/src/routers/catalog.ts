import { z } from "zod";
import { prisma } from "@wbc/db";
import { router, protectedProcedure, publicProcedure } from "../trpc/trpc";
import { createDeleteProcedure } from "../trpc/crud-helpers";
import { PrismaProductRepository } from "../../../../packages/business/catalog/adapters/prisma-product-repository";
import { PrismaBrandRepository } from "../../../../packages/business/catalog/adapters/prisma-brand-repository";
import { PrismaShowcaseRepository } from "../../../../packages/business/catalog/adapters/prisma-showcase-repository";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getTopProducts,
} from "../../../../packages/business/catalog/use-cases/manage-products";
import {
  createShowcase,
  deleteShowcase,
} from "../../../../packages/business/catalog/use-cases/manage-showcases";
import { listBrands } from "../../../../packages/business/catalog/use-cases/list-brands";
import { uuidSchema } from "@wbc/validators";

const productRepo = new PrismaProductRepository();
const brandRepo = new PrismaBrandRepository();
const showcaseRepo = new PrismaShowcaseRepository();

export const catalogRouter = router({
  listBrands: protectedProcedure.query(async () => {
    return listBrands(brandRepo);
  }),

  listProducts: protectedProcedure
    .input(
      z.object({
        brandId: z.string().uuid().optional(),
        search: z.string().optional(),
        category: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return listProducts(ctx.tenant.tenantId, input, productRepo);
    }),

  createProduct: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        brandId: z.string().uuid(),
        price: z.number().positive(),
        costPrice: z.number().positive().optional(),
        description: z.string().optional(),
        photoUrl: z.string().optional(),
        category: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return createProduct(
        {
          tenantId: ctx.tenant.tenantId,
          brandId: input.brandId,
          name: input.name,
          price: input.price,
          costPrice: input.costPrice ?? null,
          description: input.description ?? null,
          photoUrl: input.photoUrl ?? null,
          category: input.category ?? null,
          isCustom: false,
          isActive: true,
        },
        productRepo,
      );
    }),

  updateProduct: protectedProcedure
    .input(
      z.object({
        id: uuidSchema,
        name: z.string().optional(),
        price: z.number().positive().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return updateProduct(ctx.tenant.tenantId, id, data, productRepo);
    }),

  deleteProduct: createDeleteProcedure((tenantId, id) =>
    deleteProduct(tenantId, id, productRepo),
  ),

  getTopProducts: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      return getTopProducts(ctx.tenant.tenantId, input.limit, productRepo);
    }),

  listShowcases: protectedProcedure.query(async ({ ctx }) => {
    // F11 follow-up: include product count + client name so the
    // dashboard list can render meaningful rows without N+1 queries.
    const rows = await prisma.showcase.findMany({
      where: { tenantId: ctx.tenant.tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { products: true } },
      },
    });
    const clientIds = rows
      .map((r) => r.clientId)
      .filter((c): c is string => Boolean(c));
    const clients = clientIds.length
      ? await prisma.client.findMany({
          where: { tenantId: ctx.tenant.tenantId, id: { in: clientIds } },
          select: { id: true, name: true },
        })
      : [];
    const nameById = new Map(clients.map((c) => [c.id, c.name]));
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      shareLink: r.shareLink,
      clientId: r.clientId,
      clientName: r.clientId ? (nameById.get(r.clientId) ?? null) : null,
      isActive: r.isActive,
      createdAt: r.createdAt,
      productCount: r._count.products,
    }));
  }),

  // F11 follow-up: full detail for the edit/preview screen — products
  // joined and ordered by sortOrder so the consultora sees the same
  // ordering she chose on creation.
  getShowcaseDetail: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .query(async ({ ctx, input }) => {
      const row = await prisma.showcase.findFirst({
        where: { id: input.id, tenantId: ctx.tenant.tenantId },
        include: {
          products: {
            orderBy: { sortOrder: "asc" },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  photoUrl: true,
                  category: true,
                  brand: { select: { name: true } },
                },
              },
            },
          },
        },
      });
      if (!row) return null;
      return {
        id: row.id,
        name: row.name,
        shareLink: row.shareLink,
        clientId: row.clientId,
        isActive: row.isActive,
        createdAt: row.createdAt,
        products: row.products.map((p) => ({
          id: p.product.id,
          name: p.product.name,
          price: Number(p.product.price),
          photoUrl: p.product.photoUrl,
          category: p.product.category,
          brand: p.product.brand?.name ?? null,
          sortOrder: p.sortOrder,
        })),
      };
    }),

  createShowcase: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        clientId: z.string().uuid().optional(),
        productIds: z.array(z.string().uuid()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return createShowcase(
        ctx.tenant.tenantId,
        input.name,
        input.clientId,
        input.productIds,
        showcaseRepo,
      );
    }),

  // F11 follow-up: showcase update. Replaces the entire product set
  // in a single transaction so there's no half-applied state if a
  // delete-then-insert race lands. Name + isActive are nullable in
  // the patch so the caller can edit metadata without re-sending the
  // full product list.
  updateShowcase: protectedProcedure
    .input(
      z.object({
        id: uuidSchema,
        name: z.string().min(1).optional(),
        isActive: z.boolean().optional(),
        productIds: z.array(z.string().uuid()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.showcase.findFirst({
        where: { id: input.id, tenantId: ctx.tenant.tenantId },
        select: { id: true },
      });
      if (!existing) {
        throw new Error("showcase_not_found");
      }
      await prisma.$transaction(async (tx) => {
        const data: { name?: string; isActive?: boolean } = {};
        if (input.name !== undefined) data.name = input.name;
        if (input.isActive !== undefined) data.isActive = input.isActive;
        if (Object.keys(data).length > 0) {
          await tx.showcase.update({ where: { id: input.id }, data });
        }
        if (input.productIds !== undefined) {
          await tx.showcaseProduct.deleteMany({
            where: { showcaseId: input.id },
          });
          if (input.productIds.length > 0) {
            await tx.showcaseProduct.createMany({
              data: input.productIds.map((productId, index) => ({
                showcaseId: input.id,
                productId,
                sortOrder: index,
              })),
            });
          }
        }
      });
      return { success: true };
    }),

  deleteShowcase: createDeleteProcedure((tenantId, id) =>
    deleteShowcase(tenantId, id, showcaseRepo),
  ),

  // F11 follow-up: rich public view used by /v/[shareLink]. Returns
  // the showcase + product list + minimal tenant branding (name +
  // landing slug for a "open consultora's profile" link). Still a
  // publicProcedure — intentionally no tenantId in the input; the
  // shareLink is the capability.
  getPublicShowcase: publicProcedure
    .input(z.object({ shareLink: z.string().min(1) }))
    .query(async ({ input }) => {
      const row = await prisma.showcase.findUnique({
        where: { shareLink: input.shareLink },
        include: {
          tenant: {
            select: {
              name: true,
              landingPage: { select: { slug: true, isActive: true } },
            },
          },
          products: {
            orderBy: { sortOrder: "asc" },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  photoUrl: true,
                  description: true,
                  brand: { select: { name: true } },
                },
              },
            },
          },
        },
      });
      if (!row || !row.isActive) return null;
      return {
        name: row.name,
        consultora: row.tenant.name,
        landingSlug: row.tenant.landingPage?.isActive
          ? (row.tenant.landingPage.slug ?? null)
          : null,
        products: row.products.map((p) => ({
          id: p.product.id,
          name: p.product.name,
          price: Number(p.product.price),
          photoUrl: p.product.photoUrl,
          description: p.product.description,
          brand: p.product.brand?.name ?? null,
        })),
      };
    }),
});
