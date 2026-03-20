import type { Client } from '../domain/entities';
import type { ClientRepository } from '../ports/client-repository';
import { ClientNotFoundError } from '../domain/errors';

export async function getClientById(
  tenantId: string,
  id: string,
  clientRepository: ClientRepository,
): Promise<Client> {
  const client = await clientRepository.findById(tenantId, id);
  if (!client) {
    throw new ClientNotFoundError(id);
  }
  return client;
}
