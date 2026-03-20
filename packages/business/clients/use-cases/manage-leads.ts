import type { Client } from '../domain/entities';
import type { ClientRepository } from '../ports/client-repository';
import { ClientNotFoundError } from '../domain/errors';

export async function listLeads(
  tenantId: string,
  page: number,
  limit: number,
  clientRepository: ClientRepository,
): Promise<{ data: Client[]; total: number }> {
  return clientRepository.listLeads(tenantId, page, limit);
}

export async function convertToClient(
  tenantId: string,
  clientId: string,
  clientRepository: ClientRepository,
): Promise<Client> {
  const client = await clientRepository.findById(tenantId, clientId);
  if (!client) throw new ClientNotFoundError(clientId);
  return clientRepository.convertToClient(tenantId, clientId);
}
