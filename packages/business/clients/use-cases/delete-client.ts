import type { ClientRepository } from '../ports/client-repository';
import { ClientNotFoundError } from '../domain/errors';

export async function deleteClient(
  tenantId: string,
  id: string,
  clientRepository: ClientRepository,
): Promise<void> {
  const existing = await clientRepository.findById(tenantId, id);
  if (!existing) {
    throw new ClientNotFoundError(id);
  }
  await clientRepository.delete(tenantId, id);
}
