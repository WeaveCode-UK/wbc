import type { ClientRepository } from "../ports/client-repository";
import { ClientNotFoundError } from "../domain/errors";

/**
 * ACH-011 compliance-privacidade: anonymize a Client while preserving
 * referential integrity (Sales, Campaigns still need the row to exist
 * for auditing/fiscal reasons — LGPD art. 16 allows retention for
 * statistical/fiscal purposes).
 *
 * Strategy:
 * - Replace identifying fields (name, email, phone) with opaque
 *   placeholders derived from the original ID so they stay unique.
 * - Clear free-text fields (notes, preferences) which may carry
 *   sensitive data.
 * - Clear `allergies` — health data must go.
 * - Set `anonymizedAt` so later queries / reports can exclude the row.
 *
 * Kept as a **stub**: the repository interface doesn't yet expose an
 * `anonymize` method. Implementation requires:
 *   1. `ClientRepository.anonymize(tenantId, id, data)` with a narrow
 *      update set.
 *   2. Prisma migration adding `anonymizedAt: DateTime?` to Client.
 *   3. Event `client.anonymized` published via outbox — downstream
 *      consumers (CampaignRecipient, Sale) should stop touching the row.
 *   4. Audit entry (ACH-020).
 *   5. Worker that propagates anonymization to backups older than the
 *      retention window (ver docs/ANONYMIZATION-POLICY.md).
 */
export async function anonymizeClient(
  tenantId: string,
  id: string,
  clientRepository: ClientRepository,
): Promise<void> {
  const existing = await clientRepository.findById(tenantId, id);
  if (!existing) {
    throw new ClientNotFoundError(id);
  }

  // NOTE: implementation deferred — see docstring.
  // The current delete path is the only available action until the
  // repository exposes anonymize(). Callers should import this function
  // so the intent is explicit when the full path lands.
  throw new Error(
    "anonymizeClient: not implemented — see docs/ANONYMIZATION-POLICY.md (ACH-011)",
  );
}

/**
 * Deterministic anonymized placeholder — keeps row uniqueness without
 * needing a UUID lookup. Callers should use this when populating the
 * eventual `anonymize()` repository method.
 */
export function buildAnonymizedPlaceholder(id: string): {
  name: string;
  email: string;
  phone: string;
  notes: null;
  preferences: null;
  allergies: null;
} {
  const short = id.slice(0, 8);
  return {
    name: `anon-${short}`,
    email: `anon-${short}@anonymized.invalid`,
    phone: "",
    notes: null,
    preferences: null,
    allergies: null,
  };
}
