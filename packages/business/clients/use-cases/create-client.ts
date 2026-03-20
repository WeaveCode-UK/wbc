import type { Client } from '../domain/entities';
import type { ClientRepository } from '../ports/client-repository';
import { DuplicatePhoneError, InvalidClientDataError } from '../domain/errors';
import { validatePhone, formatPhoneE164 } from '../domain/value-objects';
import type { ClientSource, Sex, SkinType, HairType } from '../domain/value-objects';

export interface CreateClientInput {
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  sex?: Sex;
  birthday?: Date;
  profession?: string;
  skinType?: SkinType;
  hairType?: HairType;
  allergies?: string;
  makeupTones?: string;
  preferences?: string;
  notes?: string;
  source?: ClientSource;
  isLead?: boolean;
}

export async function createClient(
  input: CreateClientInput,
  clientRepository: ClientRepository,
): Promise<Client> {
  if (!validatePhone(input.phone)) {
    throw new InvalidClientDataError('Invalid phone number');
  }

  const phone = formatPhoneE164(input.phone);

  const existing = await clientRepository.findByPhone(input.tenantId, phone);
  if (existing) {
    throw new DuplicatePhoneError(phone);
  }

  return clientRepository.create({
    tenantId: input.tenantId,
    name: input.name,
    phone,
    email: input.email ?? null,
    sex: input.sex ?? null,
    birthday: input.birthday ?? null,
    profession: input.profession ?? null,
    skinType: input.skinType ?? null,
    hairType: input.hairType ?? null,
    allergies: input.allergies ?? null,
    makeupTones: input.makeupTones ?? null,
    preferences: input.preferences ?? null,
    notes: input.notes ?? null,
    source: input.source ?? 'MANUAL',
    isLead: input.isLead ?? false,
    isActive: true,
  });
}
