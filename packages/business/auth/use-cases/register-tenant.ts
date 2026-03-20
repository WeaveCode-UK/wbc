import type { OtpRepository } from '../ports/otp-repository';
import { PhoneAlreadyRegisteredError } from '../domain/errors';

export interface TenantRepository {
  findByPhone(phone: string): Promise<{ id: string } | null>;
  create(data: {
    name: string;
    phone: string;
    slug: string;
  }): Promise<{
    id: string;
    name: string;
    phone: string;
    slug: string;
    role: string;
    plan: string;
    locale: string;
    timezone: string;
    currency: string;
  }>;
  createSubscription(tenantId: string, plan: string): Promise<void>;
}

export interface RegisterTenantInput {
  name: string;
  phone: string;
}

export async function registerTenant(
  input: RegisterTenantInput,
  tenantRepository: TenantRepository,
  _otpRepository: OtpRepository,
): Promise<{ tenantId: string; slug: string }> {
  const existing = await tenantRepository.findByPhone(input.phone);
  if (existing) {
    throw new PhoneAlreadyRegisteredError();
  }

  // Generate slug from name
  const slug = input.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const tenant = await tenantRepository.create({
    name: input.name,
    phone: input.phone,
    slug,
  });

  // Create default subscription (Essential plan)
  await tenantRepository.createSubscription(tenant.id, 'ESSENTIAL');

  return { tenantId: tenant.id, slug };
}
