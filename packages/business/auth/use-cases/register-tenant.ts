// Auth 2.0: This use-case is DEPRECATED. Will be replaced by complete-onboarding in F10.E03.
// Temporarily stubbed to maintain compilation after Tenant schema refactor.

export interface TenantRepository {
  findBySlug(slug: string): Promise<{ id: string } | null>;
  create(data: {
    name: string;
    slug: string;
  }): Promise<{
    id: string;
    name: string;
    slug: string;
    locale: string;
    timezone: string;
    currency: string;
  }>;
  createSubscription(tenantId: string, plan: string): Promise<void>;
}

export interface RegisterTenantInput {
  name: string;
}

export async function registerTenant(
  input: RegisterTenantInput,
  tenantRepository: TenantRepository,
): Promise<{ tenantId: string; slug: string }> {
  // Generate slug from name
  const slug = input.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const existing = await tenantRepository.findBySlug(slug);
  if (existing) {
    throw new Error('Slug already in use');
  }

  const tenant = await tenantRepository.create({
    name: input.name,
    slug,
  });

  await tenantRepository.createSubscription(tenant.id, 'ESSENTIAL');

  return { tenantId: tenant.id, slug };
}
