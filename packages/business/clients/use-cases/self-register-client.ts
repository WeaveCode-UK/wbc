import type { Client } from "../domain/entities";
import type { ClientRepository } from "../ports/client-repository";
import { formatPhoneE164, validatePhone } from "../domain/value-objects";
import { DuplicatePhoneError, InvalidClientDataError } from "../domain/errors";

// F11.E07 part C: public self-registration. The consultora shares a QR
// pointing at /cadastro/<tenantSlug>; the client fills name + phone and
// the row is created with source=AUTOCADASTRO. No auth on the caller —
// trust boundary is the slug being unguessable enough plus the tenant
// being responsible for QR distribution.

export interface SelfRegisterClientInput {
  tenantId: string;
  name: string;
  phone: string;
  email?: string | null;
}

export interface TenantSlugResolver {
  findBySlug(slug: string): Promise<{ id: string } | null>;
}

export async function selfRegisterClient(
  input: SelfRegisterClientInput,
  clientRepository: ClientRepository,
): Promise<Client> {
  if (!input.name || input.name.trim().length === 0) {
    throw new InvalidClientDataError("Invalid name");
  }
  if (!validatePhone(input.phone)) {
    throw new InvalidClientDataError("Invalid phone number");
  }

  const phone = formatPhoneE164(input.phone);
  const existing = await clientRepository.findByPhone(input.tenantId, phone);
  if (existing) {
    throw new DuplicatePhoneError(phone);
  }

  return clientRepository.create({
    tenantId: input.tenantId,
    name: input.name.trim(),
    phone,
    email: input.email ?? null,
    sex: null,
    birthday: null,
    profession: null,
    skinType: null,
    hairType: null,
    allergies: null,
    makeupTones: null,
    preferences: null,
    notes: null,
    source: "AUTOCADASTRO",
    isLead: true,
    isActive: true,
    version: 0,
  });
}
