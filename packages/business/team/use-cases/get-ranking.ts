import type { TeamMemberRepository } from '../ports/team-repository';

export interface TeamRanking {
  memberId: string;
  memberName: string;
  totalSales: number;
  totalRevenue: number;
}

export async function getTeamRanking(tenantId: string, teamId: string, memberRepo?: TeamMemberRepository): Promise<TeamRanking[]> {
  if (!memberRepo) return [];
  const members = await memberRepo.findByTeamId(tenantId, teamId);
  return members.map((m) => ({ memberId: m.id, memberName: m.name, totalSales: 0, totalRevenue: 0 }));
}
