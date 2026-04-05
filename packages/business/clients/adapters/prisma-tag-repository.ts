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
    const tags = await prisma.tag.findMany({ where: { tenantId }, orderBy: { name: 'asc' }, take: 500 });
    return tags as Tag[];
  }

  async create(data: { tenantId: string; name: string; color?: string; autoRule?: string }): Promise<Tag> {
    const tag = await prisma.tag.create({ data });
    return tag as Tag;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const existing = await prisma.tag.findFirst({ where: { id, tenantId } });
    if (!existing) throw new Error('Tag not found');
    await prisma.tag.delete({ where: { id } });
  }

  async tagClient(tenantId: string, clientId: string, tagId: string): Promise<ClientTag> {
    const client = await prisma.client.findFirst({ where: { id: clientId, tenantId } });
    if (!client) throw new Error('Client not found');
    const tag = await prisma.tag.findFirst({ where: { id: tagId, tenantId } });
    if (!tag) throw new Error('Tag not found');
    const ct = await prisma.clientTag.create({ data: { clientId, tagId } });
    return ct as ClientTag;
  }

  async untagClient(tenantId: string, clientId: string, tagId: string): Promise<void> {
    const client = await prisma.client.findFirst({ where: { id: clientId, tenantId } });
    if (!client) throw new Error('Client not found');
    await prisma.clientTag.deleteMany({ where: { clientId, tagId } });
  }

  async bulkTag(tenantId: string, clientIds: string[], tagId: string): Promise<number> {
    const tag = await prisma.tag.findFirst({ where: { id: tagId, tenantId } });
    if (!tag) throw new Error('Tag not found');
    const clients = await prisma.client.findMany({ where: { id: { in: clientIds }, tenantId } });
    const validClientIds = clients.map((c) => c.id);
    if (validClientIds.length === 0) return 0;
    const result = await prisma.clientTag.createMany({
      data: validClientIds.map((clientId) => ({ clientId, tagId })),
      skipDuplicates: true,
    });
    return result.count;
  }

  async getClientTags(tenantId: string, clientId: string): Promise<Tag[]> {
    const client = await prisma.client.findFirst({ where: { id: clientId, tenantId } });
    if (!client) throw new Error('Client not found');
    const clientTags = await prisma.clientTag.findMany({
      where: { clientId },
      include: { tag: true },
    });
    return clientTags.map((ct) => ct.tag) as Tag[];
  }
}
