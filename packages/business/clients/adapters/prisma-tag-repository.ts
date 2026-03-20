import { prisma } from '@wbc/db';
import type { TagRepository } from '../ports/tag-repository';
import type { Tag, ClientTag } from '../domain/entities';

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
    const tags = await prisma.tag.findMany({ where: { tenantId }, orderBy: { name: 'asc' } });
    return tags as Tag[];
  }

  async create(data: { tenantId: string; name: string; color?: string; autoRule?: string }): Promise<Tag> {
    const tag = await prisma.tag.create({ data });
    return tag as Tag;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await prisma.tag.delete({ where: { id } });
  }

  async tagClient(clientId: string, tagId: string): Promise<ClientTag> {
    const ct = await prisma.clientTag.create({ data: { clientId, tagId } });
    return ct as ClientTag;
  }

  async untagClient(clientId: string, tagId: string): Promise<void> {
    await prisma.clientTag.deleteMany({ where: { clientId, tagId } });
  }

  async bulkTag(clientIds: string[], tagId: string): Promise<number> {
    const result = await prisma.clientTag.createMany({
      data: clientIds.map((clientId) => ({ clientId, tagId })),
      skipDuplicates: true,
    });
    return result.count;
  }

  async getClientTags(clientId: string): Promise<Tag[]> {
    const clientTags = await prisma.clientTag.findMany({
      where: { clientId },
      include: { tag: true },
    });
    return clientTags.map((ct) => ct.tag) as Tag[];
  }
}
