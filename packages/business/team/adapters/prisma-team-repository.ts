import { prisma } from '@wbc/db';
import type { TeamRepository } from '../ports/team-repository';
import type { TeamEntity } from '../domain/entities';

export class PrismaTeamRepository implements TeamRepository {
  async findById(tenantId: string, teamId: string): Promise<TeamEntity | null> {
    return prisma.team.findFirst({ where: { id: teamId, tenantId } }) as Promise<TeamEntity | null>;
  }
  async findByLeaderId(tenantId: string, leaderId: string): Promise<TeamEntity | null> {
    return prisma.team.findFirst({ where: { tenantId } }) as Promise<TeamEntity | null>;
  }
  async create(data: Omit<TeamEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<TeamEntity> {
    return prisma.team.create({ data: { tenantId: data.tenantId, name: data.name } }) as Promise<TeamEntity>;
  }
  async update(tenantId: string, teamId: string, data: Partial<Pick<TeamEntity, 'name'>>): Promise<TeamEntity> {
    return prisma.team.update({ where: { id: teamId }, data }) as Promise<TeamEntity>;
  }
  async delete(tenantId: string, teamId: string): Promise<void> {
    await prisma.team.delete({ where: { id: teamId } });
  }
}
