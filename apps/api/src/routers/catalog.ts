import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc/trpc';
import { PrismaProductRepository } from '../../../../packages/business/catalog/adapters/prisma-product-repository';
import { PrismaBrandRepository } from '../../../../packages/business/catalog/adapters/prisma-brand-repository';
import { PrismaShowcaseRepository } from '../../../../packages/business/catalog/adapters/prisma-showcase-repository';
import { listProducts, createProduct, updateProduct, deleteProduct, getTopProducts } from '../../../../packages/business/catalog/use-cases/manage-products';
import { listShowcases, createShowcase, deleteShowcase, getPublicShowcase } from '../../../../packages/business/catalog/use-cases/manage-showcases';
import { listBrands } from '../../../../packages/business/catalog/use-cases/list-brands';
import { uuidSchema } from '@wbc/validators';

const productRepo = new PrismaProductRepository();
const brandRepo = new PrismaBrandRepository();
const showcaseRepo = new PrismaShowcaseRepository();

export const catalogRouter = router({
  listBrands: protectedProcedure.query(async () => {
    return listBrands(brandRepo);
  }),

  listProducts: protectedProcedure
    .input(z.object({ brandId: z.string().uuid().optional(), search: z.string().optional(), category: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return listProducts(ctx.tenant.tenantId, input, productRepo);
    }),

  createProduct: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      brandId: z.string().uuid(),
      price: z.number().positive(),
      costPrice: z.number().positive().optional(),
      description: z.string().optional(),
      photoUrl: z.string().optional(),
      category: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return createProduct({
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
      }, productRepo);
    }),

  updateProduct: protectedProcedure
    .input(z.object({ id: uuidSchema, name: z.string().optional(), price: z.number().positive().optional(), isActive: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return updateProduct(ctx.tenant.tenantId, id, data, productRepo);
    }),

  deleteProduct: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      await deleteProduct(ctx.tenant.tenantId, input.id, productRepo);
      return { success: true };
    }),

  getTopProducts: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      return getTopProducts(ctx.tenant.tenantId, input.limit, productRepo);
    }),

  listShowcases: protectedProcedure.query(async ({ ctx }) => {
    return listShowcases(ctx.tenant.tenantId, showcaseRepo);
  }),

  createShowcase: protectedProcedure
    .input(z.object({ name: z.string().min(1), clientId: z.string().uuid().optional(), productIds: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      return createShowcase(ctx.tenant.tenantId, input.name, input.clientId, input.productIds, showcaseRepo);
    }),

  deleteShowcase: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      await deleteShowcase(ctx.tenant.tenantId, input.id, showcaseRepo);
      return { success: true };
    }),

  getPublicShowcase: publicProcedure
    .input(z.object({ shareLink: z.string() }))
    .query(async ({ input }) => {
      return getPublicShowcase(input.shareLink, showcaseRepo);
    }),
});
