import type { LandingRepository } from '../ports/landing-repository';

export async function getLandingPage(tenantId: string, repo: LandingRepository) {
  return repo.findByTenantId(tenantId);
}

export async function updateLandingPage(tenantId: string, data: { bio?: string; philosophy?: string; photoUrl?: string; whatsappLink?: string }, repo: LandingRepository) {
  return repo.upsert(tenantId, {
    tenantId,
    slug: `landing-${tenantId.substring(0, 8)}`,
    bio: data.bio,
    philosophy: data.philosophy,
    photoUrl: data.photoUrl,
    whatsappPhone: data.whatsappLink,
    isActive: true,
    brands: undefined,
    qrCodeUrl: undefined,
  });
}

export async function toggleLandingActive(tenantId: string, isActive: boolean, repo: LandingRepository) {
  return repo.toggleActive(tenantId, isActive);
}

export async function getPublicLandingPage(slug: string, repo: LandingRepository) {
  return repo.findBySlug(slug);
}
