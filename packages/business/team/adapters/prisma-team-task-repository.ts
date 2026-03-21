import { prisma } from '@wbc/db';
import type { TeamTaskRepository } from '../ports/team-repository';
import type { TeamTaskEntity } from '../domain/entities';

export class PrismaTeamTaskRepository implements TeamTaskRepository {
  async findById(tenantId: string, taskId: string): Promise<TeamTaskEntity | null> {
    const r = await prisma.teamTask.findFirst({ where: { id: taskId } });
    return r as unknown as TeamTaskEntity | null;
  }
  async findByTeamId(tenantId: string, teamId: string, filters?: { status?: string; assigneeId?: string }): Promise<TeamTaskEntity[]> {
    const r = await prisma.teamTask.findMany({
      where: { teamId, ...(filters?.status ? { status: filters.status } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    return r as unknown as TeamTaskEntity[];
  }
  async create(data: Omit<TeamTaskEntity, 'id' | 'completedAt' | 'createdAt' | 'updatedAt'>): Promise<TeamTaskEntity> {
    const r = await prisma.teamTask.create({ data: { teamId: data.teamId, memberId: data.assigneeId ?? '', description: data.title, status: 'pending' } });
    return r as unknown as TeamTaskEntity;
  }
  async update(tenantId: string, taskId: string, data: Partial<Pick<TeamTaskEntity, 'title' | 'description' | 'status' | 'assigneeId' | 'dueDate' | 'completedAt'>>): Promise<TeamTaskEntity> {
    const r = await prisma.teamTask.update({ where: { id: taskId }, data: { status: data.status ?? undefined, description: data.title ?? undefined } });
    return r as unknown as TeamTaskEntity;
  }
  async delete(tenantId: string, taskId: string): Promise<void> {
    await prisma.teamTask.delete({ where: { id: taskId } });
  }
}
