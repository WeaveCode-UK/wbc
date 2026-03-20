import { prisma } from '@wbc/db';

export async function getTeam(tenantId: string) {
  return prisma.team.findUnique({ where: { tenantId }, include: { members: true } });
}

export async function addMember(tenantId: string, phone: string) {
  const team = await prisma.team.findUnique({ where: { tenantId } });
  if (!team) {
    const newTeam = await prisma.team.create({ data: { tenantId, name: 'Minha Equipe' } });
    const member = await prisma.teamMember.create({ data: { teamId: newTeam.id, memberId: phone } });
    return member;
  }
  return prisma.teamMember.create({ data: { teamId: team.id, memberId: phone } });
}

export async function removeMember(tenantId: string, memberId: string) {
  const team = await prisma.team.findUnique({ where: { tenantId } });
  if (!team) return;
  await prisma.teamMember.deleteMany({ where: { teamId: team.id, memberId } });
}

export async function listTasks(tenantId: string, status?: string) {
  const team = await prisma.team.findUnique({ where: { tenantId } });
  if (!team) return [];
  const where: Record<string, unknown> = { teamId: team.id };
  if (status) where.status = status;
  return prisma.teamTask.findMany({ where, orderBy: { createdAt: 'desc' } });
}

export async function createTask(tenantId: string, memberId: string, description: string, message?: string, scheduledAt?: Date) {
  const team = await prisma.team.findUnique({ where: { tenantId } });
  if (!team) throw new Error('Team not found');
  return prisma.teamTask.create({ data: { teamId: team.id, memberId, description, message, scheduledAt } });
}

export async function approveTask(tenantId: string, taskId: string) {
  return prisma.teamTask.update({ where: { id: taskId }, data: { status: 'approved' } });
}

export async function getTeamRanking(tenantId: string) {
  const team = await prisma.team.findUnique({ where: { tenantId }, include: { members: true } });
  if (!team) return [];
  return team.members.map((m) => ({ memberId: m.memberId, role: m.role, sales: 0, revenue: 0 }));
}
