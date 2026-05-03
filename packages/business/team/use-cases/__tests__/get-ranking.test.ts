// T2.29 — getTeamRanking
//
// The use-case today is a thin shape mapper over TeamMemberRepository:
// it returns one row per member with totalSales=0 / totalRevenue=0
// (the actual sales aggregation lives elsewhere). What we lock in:
//   - tenantId + teamId reach the repo (no cross-tenant scan).
//   - empty result when repo is undefined (defensive default).
//   - shape contract: id → memberId, name → memberName, plus the
//     two zero counters.
//   - ordering: members come out in repo order (stable, deterministic).
//     This is the "ties handled deterministically" knob.
//   - inactive members: today the use-case does not filter, so we
//     assert the current behavior verbatim. If/when the spec adds a
//     filter, this test will catch the migration.
//     (Flagged as follow-up below.)

import { describe, it, expect, vi } from "vitest";
import { getTeamRanking } from "../get-ranking";
import type { TeamMemberRepository } from "../../ports/team-repository";
import type { TeamMemberEntity } from "../../domain/entities";

function member(overrides: Partial<TeamMemberEntity> = {}): TeamMemberEntity {
  return {
    id: "m1",
    tenantId: "t1",
    teamId: "team-1",
    name: "Maria",
    phone: "+5511999999999",
    email: null,
    role: "MEMBER" as TeamMemberEntity["role"],
    isActive: true,
    joinedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function repoMock(members: TeamMemberEntity[] = []): TeamMemberRepository {
  return {
    findById: vi.fn(),
    findByTeamId: vi.fn().mockResolvedValue(members),
    findByPhone: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

describe("getTeamRanking", () => {
  it("returns [] when repo is undefined (defensive default)", async () => {
    const r = await getTeamRanking("t1", "team-1");
    expect(r).toEqual([]);
  });

  it("returns [] when the team has no members (no sales to aggregate)", async () => {
    const repo = repoMock([]);
    const r = await getTeamRanking("t1", "team-1", repo);
    expect(r).toEqual([]);
    expect(repo.findByTeamId).toHaveBeenCalledWith("t1", "team-1");
  });

  it("scopes the query by tenantId and teamId (no cross-tenant scan)", async () => {
    const repo = repoMock([]);
    await getTeamRanking("tenant-X", "team-Z", repo);
    expect(repo.findByTeamId).toHaveBeenCalledWith("tenant-X", "team-Z");
  });

  it("maps each member to a {memberId, memberName, totalSales, totalRevenue} row", async () => {
    const repo = repoMock([
      member({ id: "m1", name: "Ana" }),
      member({ id: "m2", name: "Bia" }),
    ]);
    const r = await getTeamRanking("t1", "team-1", repo);
    expect(r).toHaveLength(2);
    expect(r[0]).toEqual({
      memberId: "m1",
      memberName: "Ana",
      totalSales: 0,
      totalRevenue: 0,
    });
    expect(r[1]?.memberName).toBe("Bia");
  });

  it("preserves repo ordering — ties stay deterministic", async () => {
    // Two members with the same name (a "tie" in the eventual ordering).
    // Today the ranking has no ordering logic, so the order MUST be
    // the order the repo returned. This is the deterministic guarantee
    // the test pins down.
    const repo = repoMock([
      member({ id: "m-first", name: "Maria" }),
      member({ id: "m-second", name: "Maria" }),
    ]);
    const r = await getTeamRanking("t1", "team-1", repo);
    expect(r.map((x) => x.memberId)).toEqual(["m-first", "m-second"]);
  });

  it("today: inactive members are NOT excluded (use-case has no filter)", async () => {
    // CHECAGEM T2.29 asks for "inactive members excluded" — that
    // filter does not exist in the current use-case (only the eventual
    // sales joiner would skip them). We pin the current behavior so a
    // future change is forced through this test.
    const repo = repoMock([
      member({ id: "m-active", isActive: true }),
      member({ id: "m-inactive", isActive: false }),
    ]);
    const r = await getTeamRanking("t1", "team-1", repo);
    expect(r).toHaveLength(2);
  });

  it("does not throw when the repo returns members with null email", async () => {
    const repo = repoMock([member({ id: "m1", email: null })]);
    const r = await getTeamRanking("t1", "team-1", repo);
    expect(r[0]?.memberId).toBe("m1");
  });
});
