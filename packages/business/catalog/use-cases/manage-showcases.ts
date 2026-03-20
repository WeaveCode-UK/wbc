import type { Showcase } from '../domain/entities';
import { generateShareLink } from '../domain/entities';
import type { ShowcaseRepository } from '../ports/showcase-repository';
import { ShowcaseNotFoundError } from '../domain/errors';

export async function listShowcases(tenantId: string, showcaseRepo: ShowcaseRepository): Promise<Showcase[]> {
  return showcaseRepo.list(tenantId);
}

export async function createShowcase(tenantId: string, name: string, clientId: string | undefined, productIds: string[], showcaseRepo: ShowcaseRepository): Promise<Showcase> {
  const shareLink = generateShareLink();
  return showcaseRepo.create({ tenantId, name, clientId, shareLink, productIds });
}

export async function deleteShowcase(tenantId: string, id: string, showcaseRepo: ShowcaseRepository): Promise<void> {
  const existing = await showcaseRepo.findById(tenantId, id);
  if (!existing) throw new ShowcaseNotFoundError(id);
  await showcaseRepo.delete(tenantId, id);
}

export async function getPublicShowcase(shareLink: string, showcaseRepo: ShowcaseRepository): Promise<Showcase | null> {
  return showcaseRepo.findByShareLink(shareLink);
}
