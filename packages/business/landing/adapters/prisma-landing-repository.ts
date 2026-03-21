import { prisma } from '@wbc/db';
import type { LandingRepository } from '../ports/landing-repository';
import type { LandingPageEntity } from '../domain/entities';

export class PrismaLandingRepository implements LandingRepository {
  async findByTenantId(tenantId: string): Promise<LandingPageEntity | null> {
    const result = await prisma.landingPage.findFirst({ where: { tenantId } });
    return result as unknown as LandingPageEntity | null;
  }
  async findBySlug(slug: string): Promise<LandingPageEntity | null> {
    const result = await prisma.landingPage.findFirst({ where: { slug, isActive: true } });
    return result as unknown as LandingPageEntity | null;
  }
  async upsert(tenantId: string, data: Omit<LandingPageEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<LandingPageEntity> {
    const result = await prisma.landingPage.upsert({
      where: { tenantId },
      create: { tenantId, slug: data.slug, bio: data.bio, philosophy: data.philosophy, photoUrl: data.photoUrl, whatsappLink: data.whatsappPhone, isActive: data.isActive },
      update: { slug: data.slug, bio: data.bio, philosophy: data.philosophy, photoUrl: data.photoUrl, whatsappLink: data.whatsappPhone, isActive: data.isActive },
    });
    return result as unknown as LandingPageEntity;
  }
  async toggleActive(tenantId: string, isActive: boolean): Promise<LandingPageEntity> {
    const result = await prisma.landingPage.update({ where: { tenantId }, data: { isActive } });
    return result as unknown as LandingPageEntity;
  }
}
