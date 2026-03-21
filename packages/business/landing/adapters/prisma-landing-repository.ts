import { prisma } from '@wbc/db';
import type { LandingRepository } from '../ports/landing-repository';
import type { LandingPageEntity } from '../domain/entities';

export class PrismaLandingRepository implements LandingRepository {
  async findByTenantId(tenantId: string): Promise<LandingPageEntity | null> {
    return prisma.landingPage.findFirst({ where: { tenantId } }) as Promise<LandingPageEntity | null>;
  }
  async findBySlug(slug: string): Promise<LandingPageEntity | null> {
    return prisma.landingPage.findFirst({ where: { slug, isActive: true } }) as Promise<LandingPageEntity | null>;
  }
  async upsert(tenantId: string, data: Omit<LandingPageEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<LandingPageEntity> {
    return prisma.landingPage.upsert({
      where: { tenantId },
      create: { tenantId, slug: data.slug, bio: data.bio, philosophy: data.philosophy, photoUrl: data.photoUrl, whatsappLink: data.whatsappPhone, isActive: data.isActive },
      update: { slug: data.slug, bio: data.bio, philosophy: data.philosophy, photoUrl: data.photoUrl, whatsappLink: data.whatsappPhone, isActive: data.isActive },
    }) as Promise<LandingPageEntity>;
  }
  async toggleActive(tenantId: string, isActive: boolean): Promise<LandingPageEntity> {
    return prisma.landingPage.update({ where: { tenantId }, data: { isActive } }) as Promise<LandingPageEntity>;
  }
}
