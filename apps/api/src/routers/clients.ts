import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/trpc';
import { PrismaClientRepository } from '../../../../packages/business/clients/adapters/prisma-client-repository';
import { PrismaTagRepository } from '../../../../packages/business/clients/adapters/prisma-tag-repository';
import { createClient } from '../../../../packages/business/clients/use-cases/create-client';
import { updateClient } from '../../../../packages/business/clients/use-cases/update-client';
import { deleteClient } from '../../../../packages/business/clients/use-cases/delete-client';
import { listClients } from '../../../../packages/business/clients/use-cases/list-clients';
import { getClientById } from '../../../../packages/business/clients/use-cases/get-client-by-id';
import { createTag, deleteTag, listTags, tagClient, untagClient, bulkTag } from '../../../../packages/business/clients/use-cases/manage-tags';
import { listLeads, convertToClient } from '../../../../packages/business/clients/use-cases/manage-leads';
import { paginationSchema, uuidSchema } from '@wbc/validators';

const clientRepo = new PrismaClientRepository();
const tagRepo = new PrismaTagRepository();

export const clientsRouter = router({
  list: protectedProcedure
    .input(z.object({
      ...paginationSchema.shape,
      search: z.string().optional(),
      classification: z.enum(['A', 'B', 'C']).optional(),
      tagIds: z.array(z.string().uuid()).optional(),
      isLead: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return listClients({
        tenantId: ctx.tenant.tenantId,
        filters: { search: input.search, classification: input.classification, tagIds: input.tagIds, isLead: input.isLead },
        page: input.page,
        limit: input.limit,
      }, clientRepo);
    }),

  getById: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .query(async ({ ctx, input }) => {
      return getClientById(ctx.tenant.tenantId, input.id, clientRepo);
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(200),
      phone: z.string().min(8).max(20),
      email: z.string().email().optional(),
      sex: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
      birthday: z.date().optional(),
      profession: z.string().optional(),
      skinType: z.enum(['OILY', 'DRY', 'COMBINATION', 'NORMAL', 'SENSITIVE']).optional(),
      hairType: z.enum(['STRAIGHT', 'WAVY', 'CURLY', 'COILY']).optional(),
      allergies: z.string().optional(),
      makeupTones: z.string().optional(),
      preferences: z.string().optional(),
      notes: z.string().optional(),
      source: z.enum(['MANUAL', 'QRCODE', 'IMPORT', 'AUTOCADASTRO', 'WHATSAPP', 'SPREADSHEET', 'REFERRAL']).optional(),
      isLead: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return createClient({ ...input, tenantId: ctx.tenant.tenantId }, clientRepo);
    }),

  update: protectedProcedure
    .input(z.object({
      id: uuidSchema,
      name: z.string().min(1).max(200).optional(),
      phone: z.string().min(8).max(20).optional(),
      email: z.string().email().nullable().optional(),
      notes: z.string().nullable().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return updateClient({ tenantId: ctx.tenant.tenantId, id, data }, clientRepo);
    }),

  delete: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      await deleteClient(ctx.tenant.tenantId, input.id, clientRepo);
      return { success: true };
    }),

  listTags: protectedProcedure.query(async ({ ctx }) => {
    return listTags(ctx.tenant.tenantId, tagRepo);
  }),

  createTag: protectedProcedure
    .input(z.object({ name: z.string().min(1), color: z.string().optional(), autoRule: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return createTag(ctx.tenant.tenantId, input.name, input.color, input.autoRule, tagRepo);
    }),

  deleteTag: protectedProcedure
    .input(z.object({ id: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      await deleteTag(ctx.tenant.tenantId, input.id, tagRepo);
      return { success: true };
    }),

  tagClient: protectedProcedure
    .input(z.object({ clientId: uuidSchema, tagId: uuidSchema }))
    .mutation(async ({ input }) => {
      await tagClient(input.clientId, input.tagId, tagRepo);
      return { success: true };
    }),

  untagClient: protectedProcedure
    .input(z.object({ clientId: uuidSchema, tagId: uuidSchema }))
    .mutation(async ({ input }) => {
      await untagClient(input.clientId, input.tagId, tagRepo);
      return { success: true };
    }),

  bulkTag: protectedProcedure
    .input(z.object({ clientIds: z.array(uuidSchema), tagId: uuidSchema }))
    .mutation(async ({ input }) => {
      const count = await bulkTag(input.clientIds, input.tagId, tagRepo);
      return { success: true, count };
    }),

  listLeads: protectedProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input }) => {
      return listLeads(ctx.tenant.tenantId, input.page, input.limit, clientRepo);
    }),

  convertToClient: protectedProcedure
    .input(z.object({ clientId: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      return convertToClient(ctx.tenant.tenantId, input.clientId, clientRepo);
    }),
});
