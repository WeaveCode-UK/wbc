// Coverage push — workspace resolution. The JWT callback used to fan
// out across 4 branches mutating 5 token fields; this pure function
// replaced that. We cover every branch:
//   - 0 memberships → onboarding
//   - preferredTenantId matches one of N memberships → ready
//   - preferredTenantId does NOT match (e.g. revoked) → fall through
//     to single-or-selection logic
//   - exactly 1 membership → ready
//   - >1 memberships, no preference → selection
import { describe, it, expect, vi } from "vitest";
import {
  resolveWorkspaceMembership,
  type WorkspaceMembershipState,
} from "../resolve-workspace-membership";

interface FakeMember {
  id: string;
  tenantId: string;
  role: "CONSULTANT" | "LEADER" | "DIRECTOR" | "ADMIN";
  plan: string;
}

function repo(members: FakeMember[]) {
  return {
    findActiveByAccountId: vi.fn().mockResolvedValue(members),
  };
}

function asReady(s: WorkspaceMembershipState) {
  if (s.kind !== "ready") throw new Error(`expected ready, got ${s.kind}`);
  return s;
}

describe("resolveWorkspaceMembership", () => {
  it("zero memberships → onboarding state (fresh signup)", async () => {
    const state = await resolveWorkspaceMembership(
      "acc-1",
      undefined,
      repo([]),
    );
    expect(state.kind).toBe("onboarding");
  });

  it("preferred matches → ready with that tenant's role + plan", async () => {
    const members: FakeMember[] = [
      { id: "m1", tenantId: "t-A", role: "CONSULTANT", plan: "ESSENTIAL" },
      { id: "m2", tenantId: "t-B", role: "ADMIN", plan: "PRO" },
    ];
    const state = await resolveWorkspaceMembership(
      "acc-1",
      "t-B",
      repo(members),
    );
    const ready = asReady(state);
    expect(ready.tenantId).toBe("t-B");
    expect(ready.memberId).toBe("m2");
    expect(ready.role).toBe("ADMIN");
    expect(ready.plan).toBe("PRO");
  });

  it("preferred does NOT match (revoked tenant) but exactly 1 other → ready with that one", async () => {
    const members: FakeMember[] = [
      { id: "m1", tenantId: "t-A", role: "ADMIN", plan: "PRO" },
    ];
    const state = await resolveWorkspaceMembership(
      "acc-1",
      "t-DELETED",
      repo(members),
    );
    const ready = asReady(state);
    expect(ready.tenantId).toBe("t-A");
  });

  it("preferred does NOT match and >1 memberships → selection (user picks)", async () => {
    const members: FakeMember[] = [
      { id: "m1", tenantId: "t-A", role: "CONSULTANT", plan: "ESSENTIAL" },
      { id: "m2", tenantId: "t-B", role: "ADMIN", plan: "PRO" },
    ];
    const state = await resolveWorkspaceMembership(
      "acc-1",
      "t-DELETED",
      repo(members),
    );
    expect(state.kind).toBe("selection");
  });

  it("exactly 1 membership and no preference → ready (auto-select)", async () => {
    const members: FakeMember[] = [
      { id: "m1", tenantId: "t-only", role: "CONSULTANT", plan: "ESSENTIAL" },
    ];
    const state = await resolveWorkspaceMembership(
      "acc-1",
      undefined,
      repo(members),
    );
    const ready = asReady(state);
    expect(ready.tenantId).toBe("t-only");
  });

  it("forwards accountId to the repo verbatim", async () => {
    const r = repo([]);
    await resolveWorkspaceMembership("acc-XYZ", undefined, r);
    expect(r.findActiveByAccountId).toHaveBeenCalledWith("acc-XYZ");
  });
});
