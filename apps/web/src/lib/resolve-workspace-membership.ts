import type { PrismaTenantMemberRepository } from "@wbc/business/auth/adapters/prisma-tenant-member.repository";
import type { Role } from "@wbc/business/auth/domain/entities/tenant-member.entity";

/**
 * Discriminated result of resolving a user's workspace membership. The jwt
 * callback used to mutate five token fields inline across 4+ branches —
 * hard to reason about and risky to change. Now it's:
 *
 *   const state = await resolveWorkspaceMembership(accountId, preferredTid, repo);
 *   applyToToken(token, state);
 *
 * See ACH-007 (codigo-manutenibilidade, run 2026-04-18_21-45-58).
 */
export type WorkspaceMembershipState =
  | { kind: "onboarding" }
  | { kind: "selection" }
  | {
      kind: "ready";
      tenantId: string;
      memberId: string;
      role: Role;
      plan: string;
    };

export async function resolveWorkspaceMembership(
  accountId: string,
  preferredTenantId: string | undefined,
  memberRepo: Pick<PrismaTenantMemberRepository, "findActiveByAccountId">,
): Promise<WorkspaceMembershipState> {
  const members = await memberRepo.findActiveByAccountId(accountId);

  if (members.length === 0) {
    return { kind: "onboarding" };
  }

  // User already picked one → try to re-select it.
  if (preferredTenantId) {
    const match = members.find((m) => m.tenantId === preferredTenantId);
    if (match) {
      return {
        kind: "ready",
        tenantId: match.tenantId,
        memberId: match.id,
        role: match.role,
        plan: match.plan,
      };
    }
  }

  if (members.length === 1) {
    const only = members[0]!;
    return {
      kind: "ready",
      tenantId: only.tenantId,
      memberId: only.id,
      role: only.role,
      plan: only.plan,
    };
  }

  // Multiple memberships, no preference yet → user picks.
  return { kind: "selection" };
}
