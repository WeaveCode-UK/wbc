import { prisma } from '@wbc/db';

export async function getLandingPage(tenantId: string) {
  return prisma.landingPage.findUnique({ where: { tenantId } });
}

export async function updateLandingPage(tenantId: string, data: { bio?: string; philosophy?: string; photoUrl?: string; whatsappLink?: string }) {
  return prisma.landingPage.upsert({
    where: { tenantId },
    update: { bio: data.bio, philosophy: data.philosophy, photoUrl: data.photoUrl, whatsappLink: data.whatsappLink },
    create: { tenantId, slug: `landing-${tenantId.substring(0, 8)}`, bio: data.bio, philosophy: data.philosophy, photoUrl: data.photoUrl, whatsappLink: data.whatsappLink },
  });
}

export async function toggleLandingActive(tenantId: string, isActive: boolean) {
  return prisma.landingPage.update({ where: { tenantId }, data: { isActive } });
}

export async function getPublicLandingPage(slug: string) {
  return prisma.landingPage.findUnique({ where: { slug }, select: { photoUrl: true, bio: true, philosophy: true, brands: true, whatsappLink: true, qrCodeUrl: true, isActive: true } });
}
