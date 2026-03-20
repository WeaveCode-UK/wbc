import { prisma } from '@wbc/db';

export async function listQuickReplies(tenantId: string) {
  return prisma.quickReply.findMany({ where: { tenantId }, orderBy: { label: 'asc' } });
}

export async function createQuickReply(tenantId: string, label: string, text: string) {
  return prisma.quickReply.create({ data: { tenantId, label, text } });
}

export async function deleteQuickReply(tenantId: string, id: string) {
  await prisma.quickReply.delete({ where: { id } });
}
