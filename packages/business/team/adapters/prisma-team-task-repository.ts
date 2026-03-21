import { prisma } from '@wbc/db';
import type { TeamTaskRepository } from '../ports/team-repository';
import type { TeamTaskEntity } from '../domain/entities';

export class PrismaTeamTaskRepository implements TeamTaskRepository {
  async findById(tenantId: string, taskId: string): Promise<TeamTaskEntity | null> {
    return prisma.teamTask.findFirst({ where: { id: taskId } }) as Promise<TeamTaskEntity | null>;
  }
  async findByTeamId(tenantId: string, teamId: string, filters?: { status?: string; assigneeId?: string }): Promise<TeamTaskEntity[]> {
    return prisma.teamTask.findMany({
      where: { teamId, ...(filters?.status ? { status: filters.status } : {}) },
      orderBy: { createdAt: 'desc' },
    }) as Promise<TeamTaskEntity[]>;
  }
  async create(data: Omit<TeamTaskEntity, 'id' | 'completedAt' | 'createdAt' | 'updatedAt'>): Promise<TeamTaskEntity> {
    return prisma.teamTask.create({ data: { teamId: data.teamId, memberId: data.assigneeId ?? '', description: data.title, status: 'pending' } }) as Promise<TeamTaskEntity>;
  }
  async update(tenantId: string, taskId: string, data: Partial<Pick<TeamTaskEntity, 'title' | 'description' | 'status' | 'assigneeId' | 'dueDate' | 'completedAt'>>): Promise<TeamTaskEntity> {
    return prisma.teamTask.update({ where: { id: taskId }, data: { status: data.status ?? undefined, description: data.title ?? undefined } }) as Promise<TeamTaskEntity>;
  }
  async delete(tenantId: string, taskId: string): Promise<void> {
    await prisma.teamTask.delete({ where: { id: taskId } });
  }
}
