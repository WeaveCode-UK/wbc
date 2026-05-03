// Bloco 4 do plano: feature #29 da spec — "Indicação de presenteadores".
// A cliente indica pessoas que costumam presenteá-la (marido, mãe, filhas).
// O sistema avisa esses contatos antes do aniversário sugerindo presentes.
// Este módulo cobre só o CRUD; o disparo automático fica para outro bloco
// (cron já existe em notify_client_milestones).

export interface GiftSuggestor {
  id: string;
  clientId: string;
  suggestorName: string;
  suggestorPhone: string;
}

export interface GiftSuggestorRepository {
  list(tenantId: string, clientId: string): Promise<GiftSuggestor[]>;
  add(
    tenantId: string,
    clientId: string,
    suggestorName: string,
    suggestorPhone: string,
  ): Promise<GiftSuggestor>;
  remove(tenantId: string, id: string): Promise<void>;
}

export async function listGiftSuggestors(
  tenantId: string,
  clientId: string,
  repo: GiftSuggestorRepository,
): Promise<GiftSuggestor[]> {
  return repo.list(tenantId, clientId);
}

export async function addGiftSuggestor(
  tenantId: string,
  clientId: string,
  suggestorName: string,
  suggestorPhone: string,
  repo: GiftSuggestorRepository,
): Promise<GiftSuggestor> {
  return repo.add(tenantId, clientId, suggestorName, suggestorPhone);
}

export async function removeGiftSuggestor(
  tenantId: string,
  id: string,
  repo: GiftSuggestorRepository,
): Promise<void> {
  await repo.remove(tenantId, id);
}
