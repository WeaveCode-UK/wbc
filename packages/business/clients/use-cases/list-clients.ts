import type { Client } from '../domain/entities';
import type { ClientRepository, ClientFilters } from '../ports/client-repository';

export interface ListClientsInput {
  tenantId: string;
  filters: ClientFilters;
  page: number;
  limit: number;
}

export async function listClients(
  input: ListClientsInput,
  clientRepository: ClientRepository,
): Promise<{ data: Client[]; total: number }> {
  return clientRepository.list(input.tenantId, input.filters, input.page, input.limit);
}
