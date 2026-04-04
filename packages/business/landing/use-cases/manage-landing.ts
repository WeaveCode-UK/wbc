import type { LandingRepository } from '../ports/landing-repository';

export async function getLandingPage(tenantId: string, repo: LandingRepository) {
  return repo.findByTenantId(tenantId);
}

export async function updateLandingPage(tenantId: string, data: { bio?: string; philosophy?: string; photoUrl?: string; whatsappLink?: string }, repo: LandingRepository) {
  return repo.upsert(tenantId, {
    tenantId,
    slug: `landing-${tenantId.substring(0, 8)}`,
    name: '',
    bio: data.bio ?? null,
    philosophy: data.philosophy ?? null,
    photoUrl: data.photoUrl ?? null,
    whatsappPhone: data.whatsappLink ?? '',
    isActive: true,
    brands: [],
  });
}

export async function toggleLandingActive(tenantId: string, isActive: boolean, repo: LandingRepository) {
  return repo.toggleActive(tenantId, isActive);
}

export async function getPublicLandingPage(slug: string, repo: LandingRepository) {
  return repo.findBySlug(slug);
}
