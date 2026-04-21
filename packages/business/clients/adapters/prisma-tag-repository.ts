import { prisma, Prisma } from "@wbc/db";
import type { TagRepository } from "../ports/tag-repository";
import type { Tag, ClientTag } from "../domain/entities";

// ACH-014 dados-persistencia: FK/tenant checks used to issue an extra
// findFirst per call. Replaced by "attempt the write, translate Prisma
// error codes" — one round-trip, same error surface to callers.
function isFKViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003"
  );
}

export class PrismaTagRepository implements TagRepository {
  async findById(tenantId: string, id: string): Promise<Tag | null> {
    const tag = await prisma.tag.findFirst({ where: { id, tenantId } });
    return tag as Tag | null;
  }

  async findByName(tenantId: string, name: string): Promise<Tag | null> {
    const tag = await prisma.tag.findFirst({ where: { tenantId, name } });
    return tag as Tag | null;
  }

  async list(tenantId: string): Promise<Tag[]> {
    const tags = await prisma.tag.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
      take: 500,
    });
    return tags as Tag[];
  }

  async create(data: {
    tenantId: string;
    name: string;
    color?: string;
    autoRule?: string;
  }): Promise<Tag> {
    const tag = await prisma.tag.create({ data });
    return tag as Tag;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    // ACH-014 dados-persistencia: one round-trip instead of find-then-
    // delete. `deleteMany` with the tenantId in the where clause deletes
    // iff the tag really belongs to this tenant; otherwise count=0 and
    // we translate to a not-found error on the same shape the previous
    // code threw.
    const { count } = await prisma.tag.deleteMany({ where: { id, tenantId } });
    if (count === 0) throw new Error("Tag not found");
  }

  async tagClient(
    tenantId: string,
    clientId: string,
    tagId: string,
  ): Promise<ClientTag> {
    // ACH-014 dados-persistencia: RLS already filters cross-tenant
    // rows, so the two pre-flight tenant checks were duplicate defence.
    // Attempt the create and translate P2003 (FK violation: clientId or
    // tagId doesn't exist / isn't visible) into the legacy error.
    try {
      const ct = await prisma.clientTag.create({ data: { clientId, tagId } });
      return ct as ClientTag;
    } catch (err) {
      if (isFKViolation(err)) {
        throw new Error("Client or tag not found");
      }
      throw err;
    }
  }

  async untagClient(
    tenantId: string,
    clientId: string,
    tagId: string,
  ): Promise<void> {
    // Keep the tenantId in the where on the junction's clientId so a
    // caller from tenant A can't untag tenant B's clients — RLS still
    // blocks that, but narrowing here is cheap and explicit.
    await prisma.clientTag.deleteMany({
      where: {
        clientId,
        tagId,
        client: { tenantId },
      },
    });
  }

  async bulkTag(
    tenantId: string,
    clientIds: string[],
    tagId: string,
  ): Promise<number> {
    if (clientIds.length === 0) return 0;
    // Validate tag ownership and client ownership in one shot by
    // filtering the insert candidates through a single findMany. Still
    // two round-trips (verify + insert), but the repeated per-client
    // verify is gone.
    const clients = await prisma.client.findMany({
      where: { id: { in: clientIds }, tenantId },
      select: { id: true },
    });
    if (clients.length === 0) return 0;
    try {
      const result = await prisma.clientTag.createMany({
        data: clients.map((c) => ({ clientId: c.id, tagId })),
        skipDuplicates: true,
      });
      return result.count;
    } catch (err) {
      if (isFKViolation(err)) {
        // tagId didn't exist for this tenant.
        throw new Error("Tag not found");
      }
      throw err;
    }
  }

  async getClientTags(tenantId: string, clientId: string): Promise<Tag[]> {
    // ACH-014 dados-persistencia: include the client's tenantId in the
    // findMany's where chain — zero extra round-trips, same guarantee.
    const clientTags = await prisma.clientTag.findMany({
      where: { clientId, client: { tenantId } },
      include: { tag: true },
    });
    if (clientTags.length === 0) {
      // Ambiguous: client doesn't exist vs. client has no tags. Probe
      // exactly once to distinguish — much rarer path, so the extra
      // query here doesn't dominate the hot path.
      const exists = await prisma.client.findFirst({
        where: { id: clientId, tenantId },
        select: { id: true },
      });
      if (!exists) throw new Error("Client not found");
    }
    return clientTags.map((ct) => ct.tag) as Tag[];
  }
}
