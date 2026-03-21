import { prisma } from '@wbc/db';

export interface TeamRanking {
  memberId: string;
  memberName: string;
  totalSales: number;
  totalRevenue: number;
}

export async function getTeamRanking(tenantId: string, teamId: string): Promise<TeamRanking[]> {
  const members = await prisma.teamMember.findMany({ where: { teamId } });
  return members.map((m) => ({ memberId: m.id, memberName: m.memberId, totalSales: 0, totalRevenue: 0 }));
}
