import { z } from "zod";
import { router, protectedProcedure } from "../trpc/trpc";
import {
  createGetByIdProcedure,
  createDeleteProcedure,
} from "../trpc/crud-helpers";
// ACH-021: use the @wbc/business alias instead of `../../../../packages/...`
// so file moves inside the workspace don't cascade into every router.
import { PrismaClientRepository } from "@wbc/business/clients/adapters/prisma-client-repository";
import { PrismaTagRepository } from "@wbc/business/clients/adapters/prisma-tag-repository";
import { createClient } from "@wbc/business/clients/use-cases/create-client";
import { updateClient } from "@wbc/business/clients/use-cases/update-client";
import { deleteClient } from "@wbc/business/clients/use-cases/delete-client";
import { listClients } from "@wbc/business/clients/use-cases/list-clients";
import { getClientById } from "@wbc/business/clients/use-cases/get-client-by-id";
import {
  createTag,
  deleteTag,
  listTags,
  tagClient,
  untagClient,
  bulkTag,
} from "@wbc/business/clients/use-cases/manage-tags";
import {
  listLeads,
  convertToClient,
} from "@wbc/business/clients/use-cases/manage-leads";
import { paginationSchema, uuidSchema } from "@wbc/validators";

const clientRepo = new PrismaClientRepository();
const tagRepo = new PrismaTagRepository();

export const clientsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        ...paginationSchema.shape,
        search: z.string().optional(),
        classification: z.enum(["A", "B", "C"]).optional(),
        tagIds: z.array(z.string().uuid()).optional(),
        isLead: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return listClients(
        {
          tenantId: ctx.tenant.tenantId,
          filters: {
            search: input.search,
            classification: input.classification,
            tagIds: input.tagIds,
            isLead: input.isLead,
          },
          page: input.page,
          limit: input.limit,
        },
        clientRepo,
      );
    }),

  getById: createGetByIdProcedure((tenantId, id) =>
    getClientById(tenantId, id, clientRepo),
  ),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        phone: z.string().min(8).max(20),
        email: z.string().email().optional(),
        sex: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
        birthday: z.date().optional(),
        profession: z.string().optional(),
        skinType: z
          .enum(["OILY", "DRY", "COMBINATION", "NORMAL", "SENSITIVE"])
          .optional(),
        hairType: z.enum(["STRAIGHT", "WAVY", "CURLY", "COILY"]).optional(),
        allergies: z.string().optional(),
        makeupTones: z.string().optional(),
        preferences: z.string().optional(),
        notes: z.string().optional(),
        source: z
          .enum([
            "MANUAL",
            "QRCODE",
            "IMPORT",
            "AUTOCADASTRO",
            "WHATSAPP",
            "SPREADSHEET",
            "REFERRAL",
          ])
          .optional(),
        isLead: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return createClient(
        { ...input, tenantId: ctx.tenant.tenantId },
        clientRepo,
      );
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: uuidSchema,
        name: z.string().min(1).max(200).optional(),
        phone: z.string().min(8).max(20).optional(),
        email: z.string().email().nullable().optional(),
        notes: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return updateClient(
        { tenantId: ctx.tenant.tenantId, id, data },
        clientRepo,
      );
    }),

  delete: createDeleteProcedure((tenantId, id) =>
    deleteClient(tenantId, id, clientRepo),
  ),

  listTags: protectedProcedure.query(async ({ ctx }) => {
    return listTags(ctx.tenant.tenantId, tagRepo);
  }),

  createTag: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        color: z.string().optional(),
        autoRule: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return createTag(
        ctx.tenant.tenantId,
        input.name,
        input.color,
        input.autoRule,
        tagRepo,
      );
    }),

  deleteTag: createDeleteProcedure((tenantId, id) =>
    deleteTag(tenantId, id, tagRepo),
  ),

  tagClient: protectedProcedure
    .input(z.object({ clientId: uuidSchema, tagId: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      await tagClient(
        ctx.tenant.tenantId,
        input.clientId,
        input.tagId,
        tagRepo,
      );
      return { success: true };
    }),

  untagClient: protectedProcedure
    .input(z.object({ clientId: uuidSchema, tagId: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      await untagClient(
        ctx.tenant.tenantId,
        input.clientId,
        input.tagId,
        tagRepo,
      );
      return { success: true };
    }),

  bulkTag: protectedProcedure
    .input(
      z.object({ clientIds: z.array(uuidSchema).max(1000), tagId: uuidSchema }),
    )
    .mutation(async ({ ctx, input }) => {
      const count = await bulkTag(
        ctx.tenant.tenantId,
        input.clientIds,
        input.tagId,
        tagRepo,
      );
      return { success: true, count };
    }),

  listLeads: protectedProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input }) => {
      return listLeads(
        ctx.tenant.tenantId,
        input.page,
        input.limit,
        clientRepo,
      );
    }),

  convertToClient: protectedProcedure
    .input(z.object({ clientId: uuidSchema }))
    .mutation(async ({ ctx, input }) => {
      return convertToClient(ctx.tenant.tenantId, input.clientId, clientRepo);
    }),
});
