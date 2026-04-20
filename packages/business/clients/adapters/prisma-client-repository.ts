import { prisma } from "@wbc/db";
import { buildTenantWhere, paginatedQuery } from "@wbc/shared";
import type {
  ClientRepository,
  ClientFilters,
} from "../ports/client-repository";
import type { Client } from "../domain/entities";
import { pickClientUpdatable } from "../domain/updatable-fields";

/**
 * ACH-006 codigo-manutenibilidade (follow-up):
 * Today this adapter reads the shared `prisma` singleton from `@wbc/db`,
 * which makes it impossible to unit-test without spinning up a real
 * database or monkey-patching the module. The target shape is
 *   `constructor(private readonly db: PrismaClient) {}`
 * with the singleton injected by `apps/api/src/composition-root.ts`
 * (introduced by ACH-003). Migration is deferred because it requires
 * updating every `new PrismaClientRepository()` call-site in parallel;
 * the composition root's TODO near the `prisma` import tracks the work.
 */
export class PrismaClientRepository implements ClientRepository {
  async findById(tenantId: string, id: string): Promise<Client | null> {
    const client = await prisma.client.findFirst({ where: { id, tenantId } });
    return client as Client | null;
  }

  async findByPhone(tenantId: string, phone: string): Promise<Client | null> {
    const client = await prisma.client.findFirst({
      where: { tenantId, phone },
    });
    return client as Client | null;
  }

  async list(
    tenantId: string,
    filters: ClientFilters,
    page: number,
    limit: number,
  ) {
    const where = buildTenantWhere(tenantId, {
      classification: filters.classification,
      isLead: filters.isLead,
      isActive: filters.isActive,
    });
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return paginatedQuery<Client>(prisma.client as never, where, {
      page,
      limit,
    });
  }

  async create(
    data: Omit<
      Client,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "engagementScore"
      | "classification"
      | "firstPurchaseAt"
    >,
  ): Promise<Client> {
    const client = await prisma.client.create({ data });
    return client as Client;
  }

  async update(
    tenantId: string,
    id: string,
    data: Partial<Client>,
  ): Promise<Client> {
    const existing = await prisma.client.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error("Client not found");
    // ACH-008: whitelist mutable fields so untrusted input can never set
    // system-managed attributes (tenantId, classification, engagementScore,
    // firstPurchaseAt, createdAt, deletedAt) even if a router-level Zod
    // schema drifts.
    const whitelisted = pickClientUpdatable(data);
    const { version: expectedVersion, ...updateData } = whitelisted;
    const client = await prisma.client.update({
      where: {
        id,
        ...(expectedVersion !== undefined ? { version: expectedVersion } : {}),
      },
      data: { ...updateData, version: { increment: 1 } },
    });
    return client as Client;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const existing = await prisma.client.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error("Client not found");
    await prisma.client.delete({ where: { id } });
  }

  async count(tenantId: string): Promise<number> {
    return prisma.client.count({ where: { tenantId } });
  }

  async listLeads(tenantId: string, page: number, limit: number) {
    return paginatedQuery<Client>(
      prisma.client as never,
      { tenantId, isLead: true },
      { page, limit },
    );
  }

  async convertToClient(tenantId: string, id: string): Promise<Client> {
    const existing = await prisma.client.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error("Client not found");
    const client = await prisma.client.update({
      where: { id },
      data: { isLead: false },
    });
    return client as Client;
  }

  async bulkEditNames(
    tenantId: string,
    edits: Array<{ id: string; name: string }>,
  ): Promise<number> {
    await prisma.$transaction(
      edits.map((edit) =>
        prisma.client.update({
          where: { id: edit.id },
          data: { name: edit.name },
        }),
      ),
    );
    return edits.length;
  }
}
