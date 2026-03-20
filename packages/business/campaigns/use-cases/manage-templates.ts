import { prisma } from '@wbc/db';

export async function listTemplates(tenantId: string, category?: string) {
  const where: Record<string, unknown> = { OR: [{ tenantId }, { isSystem: true }] };
  if (category) where.category = category;
  return prisma.messageTemplate.findMany({ where, orderBy: { name: 'asc' } });
}

export async function createTemplate(tenantId: string, name: string, category: string, text: string) {
  return prisma.messageTemplate.create({
    data: { tenantId, name, category: category as 'CUSTOM', text },
  });
}

export async function updateTemplate(tenantId: string, id: string, text: string) {
  return prisma.messageTemplate.update({ where: { id }, data: { text } });
}

export async function deleteTemplate(tenantId: string, id: string) {
  await prisma.messageTemplate.delete({ where: { id } });
}

// Community feed
export async function listCommunityTemplates(filters: { topic?: string; sort?: string; page: number; limit: number }) {
  const where: Record<string, unknown> = {};
  if (filters.topic) where.topic = filters.topic;
  const orderBy = filters.sort === 'recent' ? { createdAt: 'desc' as const } : { likesCount: 'desc' as const };

  const [data, total] = await Promise.all([
    prisma.communityTemplate.findMany({ where, orderBy, skip: (filters.page - 1) * filters.limit, take: filters.limit }),
    prisma.communityTemplate.count({ where }),
  ]);
  return { data, total };
}

export async function likeCommunityTemplate(id: string) {
  return prisma.communityTemplate.update({ where: { id }, data: { likesCount: { increment: 1 } } });
}

export async function shareToFeed(tenantId: string, text: string, topic?: string) {
  return prisma.communityTemplate.create({ data: { tenantId, text, topic } });
}
