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
import { bulkUpdateClients } from "@wbc/business/clients/use-cases/bulk-update-clients";
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
import {
  paginationSchema,
  uuidSchema,
  listClientsSchema,
  createClientSchema,
  updateClientSchema,
  createTagSchema,
  tagClientSchema,
  untagClientSchema,
  bulkTagSchema,
} from "@wbc/validators";
import { idempotentRoute } from "../trpc/idempotency-middleware";
import { listOk } from "../trpc/responses";
import { withCacheInvalidation } from "../lib/cache-invalidation";

const clientRepo = new PrismaClientRepository();
const tagRepo = new PrismaTagRepository();

export const clientsRouter = router({
  list: protectedProcedure
    // ACH-004: reuse schema from @wbc/validators instead of re-declaring inline.
    .input(listClientsSchema)
    .query(async ({ ctx, input }) => {
      // ACH-007 apis-integracoes: wrap the use-case's `{ data, total }`
      // in the canonical `{ data, meta: { page, limit, total, hasMore } }`
      // envelope so the SDK/UI can render "N of M" and stop inferring
      // "end of list" from a short page.
      const result = await listClients(
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
      return listOk(result.data, {
        page: input.page,
        limit: input.limit,
        total: result.total,
      });
    }),

  getById: createGetByIdProcedure((tenantId, id) =>
    getClientById(tenantId, id, clientRepo),
  ),

  create: protectedProcedure
    // ACH-004: schema pulled from @wbc/validators.
    .input(createClientSchema)
    .mutation(async ({ ctx, input }) => {
      // ACH-001 apis-integracoes: retry-safe — createClient will otherwise
      // emit a duplicate CLIENT_CREATED event and blow up any downstream
      // consumer that assumes one event per logical creation.
      const { idempotencyKey: _key, ...clientInput } = input;
      void _key;
      // ACH-007 performance-escalabilidade: invalidate clients + dashboard
      // caches after creation. Seed adoption — other mutations migrate
      // alongside their next functional change.
      return withCacheInvalidation("clients", () =>
        idempotentRoute("clients.create", ctx.tenant.tenantId, input, () =>
          createClient(
            { ...clientInput, tenantId: ctx.tenant.tenantId },
            clientRepo,
          ),
        ),
      );
    }),

  update: protectedProcedure
    // ACH-004: schema pulled from @wbc/validators.
    .input(updateClientSchema)
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

  // F11.E07: bulk update for the /clients page bulk-action bar.
  bulkUpdate: protectedProcedure
    .input(
      z.object({
        ids: z.array(uuidSchema).min(1).max(200),
        data: z
          .object({
            name: z.string().min(1).optional(),
            classification: z.enum(["A", "B", "C"]).optional(),
            isActive: z.boolean().optional(),
            isLead: z.boolean().optional(),
          })
          .refine((d) => Object.keys(d).length > 0, {
            message: "At least one field is required",
          }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return bulkUpdateClients(
        { tenantId: ctx.tenant.tenantId, ids: input.ids, data: input.data },
        clientRepo,
      );
    }),

  listTags: protectedProcedure.query(async ({ ctx }) => {
    return listTags(ctx.tenant.tenantId, tagRepo);
  }),

  createTag: protectedProcedure
    .input(createTagSchema)
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
    .input(tagClientSchema)
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
    .input(untagClientSchema)
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
    .input(bulkTagSchema)
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
