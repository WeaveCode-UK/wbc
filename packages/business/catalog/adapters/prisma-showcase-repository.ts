import { prisma } from '@wbc/db';
import type { ShowcaseRepository } from '../ports/showcase-repository';
import type { Showcase } from '../domain/entities';

export class PrismaShowcaseRepository implements ShowcaseRepository {
  async findById(tenantId: string, id: string): Promise<Showcase | null> {
    const s = await prisma.showcase.findFirst({ where: { id, tenantId } });
    return s as Showcase | null;
  }

  async findByShareLink(shareLink: string): Promise<Showcase | null> {
    const s = await prisma.showcase.findUnique({ where: { shareLink } });
    return s as Showcase | null;
  }

  async list(tenantId: string): Promise<Showcase[]> {
    const showcases = await prisma.showcase.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
    return showcases as Showcase[];
  }

  async create(data: { tenantId: string; name: string; clientId?: string; shareLink: string; productIds: string[] }): Promise<Showcase> {
    const showcase = await prisma.showcase.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        clientId: data.clientId,
        shareLink: data.shareLink,
        products: {
          create: data.productIds.map((productId, index) => ({ productId, sortOrder: index })),
        },
      },
    });
    return showcase as Showcase;
  }

  async update(tenantId: string, id: string, data: Partial<Showcase>): Promise<Showcase> {
    const s = await prisma.showcase.update({ where: { id }, data });
    return s as Showcase;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await prisma.showcase.delete({ where: { id } });
  }
}
