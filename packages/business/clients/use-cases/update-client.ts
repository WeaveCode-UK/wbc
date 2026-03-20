import type { Client } from '../domain/entities';
import type { ClientRepository } from '../ports/client-repository';
import { ClientNotFoundError } from '../domain/errors';

export interface UpdateClientInput {
  tenantId: string;
  id: string;
  data: Partial<Pick<Client, 'name' | 'phone' | 'email' | 'sex' | 'birthday' | 'profession' | 'skinType' | 'hairType' | 'allergies' | 'makeupTones' | 'preferences' | 'notes' | 'isActive'>>;
}

export async function updateClient(
  input: UpdateClientInput,
  clientRepository: ClientRepository,
): Promise<Client> {
  const existing = await clientRepository.findById(input.tenantId, input.id);
  if (!existing) {
    throw new ClientNotFoundError(input.id);
  }
  return clientRepository.update(input.tenantId, input.id, input.data);
}
