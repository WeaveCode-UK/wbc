import { prisma } from '@wbc/db';
import type { TemplateRepository } from '../ports/template-repository';

export class PrismaTemplateRepository implements TemplateRepository {
  async list(tenantId: string, category?: string) {
    const where: Record<string, unknown> = { OR: [{ tenantId }, { isSystem: true }] };
    if (category) where.category = category;
    return prisma.messageTemplate.findMany({ where, orderBy: { name: 'asc' } });
  }

  async create(tenantId: string, name: string, category: string, text: string) {
    return prisma.messageTemplate.create({
      data: { tenantId, name, category: category as 'CUSTOM', text },
    });
  }

  async update(tenantId: string, id: string, text: string) {
    return prisma.messageTemplate.update({ where: { id }, data: { text } });
  }

  async delete(tenantId: string, id: string) {
    await prisma.messageTemplate.delete({ where: { id } });
  }

  async listCommunity(filters: { topic?: string; sort?: string; page: number; limit: number }) {
    const where: Record<string, unknown> = {};
    if (filters.topic) where.topic = filters.topic;
    const orderBy = filters.sort === 'recent' ? { createdAt: 'desc' as const } : { likesCount: 'desc' as const };
    const [data, total] = await Promise.all([
      prisma.communityTemplate.findMany({ where, orderBy, skip: (filters.page - 1) * filters.limit, take: filters.limit }),
      prisma.communityTemplate.count({ where }),
    ]);
    return { data, total };
  }

  async likeCommunity(id: string) {
    return prisma.communityTemplate.update({ where: { id }, data: { likesCount: { increment: 1 } } });
  }

  async shareToFeed(tenantId: string, text: string, topic?: string) {
    return prisma.communityTemplate.create({ data: { tenantId, text, topic } });
  }
}
