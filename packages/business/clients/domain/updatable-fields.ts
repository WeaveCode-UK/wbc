import type { Client } from "./entities";

/**
 * Fields that any caller is allowed to mutate on a Client. Anything else
 * (id, tenantId, createdAt, updatedAt, classification, engagementScore,
 * firstPurchaseAt, deletedAt) is system-managed and must never be set
 * through the generic update path (ACH-008).
 */
export const CLIENT_UPDATABLE_FIELDS = [
  "name",
  "phone",
  "email",
  "notes",
  "isLead",
  "isActive",
  "version",
] as const satisfies ReadonlyArray<keyof Client>;

export type ClientUpdatable = Pick<
  Client,
  (typeof CLIENT_UPDATABLE_FIELDS)[number]
>;

export function pickClientUpdatable(
  input: Partial<Client>,
): Partial<ClientUpdatable> {
  const out: Partial<ClientUpdatable> = {};
  for (const key of CLIENT_UPDATABLE_FIELDS) {
    if (key in input && input[key] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (out as any)[key] = input[key];
    }
  }
  return out;
}
