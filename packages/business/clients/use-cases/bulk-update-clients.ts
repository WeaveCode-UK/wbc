import type { Client } from "../domain/entities";
import type { ClientRepository } from "../ports/client-repository";

// F11.E07: edit a list of clients at once. The repo enforces tenant scope
// in its WHERE; this layer caps batch size so the UI cannot accidentally
// send a 50k-row update that locks the table.
const MAX_BATCH = 200;

export interface BulkUpdateClientsInput {
  tenantId: string;
  ids: string[];
  data: Partial<
    Pick<Client, "name" | "classification" | "isActive" | "isLead">
  >;
}

export async function bulkUpdateClients(
  input: BulkUpdateClientsInput,
  clientRepository: ClientRepository,
): Promise<{ count: number }> {
  const ids = input.ids.slice(0, MAX_BATCH);
  if (ids.length === 0 || Object.keys(input.data).length === 0) {
    return { count: 0 };
  }
  return clientRepository.bulkUpdate(input.tenantId, ids, input.data);
}
