import { prisma } from '@wbc/db';
import type { TeamRepository } from '../ports/team-repository';
import type { TeamEntity } from '../domain/entities';

export class PrismaTeamRepository implements TeamRepository {
  async findById(tenantId: string, teamId: string): Promise<TeamEntity | null> {
    const r = await prisma.team.findFirst({ where: { id: teamId, tenantId } });
    return r as unknown as TeamEntity | null;
  }
  async findByLeaderId(tenantId: string, leaderId: string): Promise<TeamEntity | null> {
    const r = await prisma.team.findFirst({ where: { tenantId } });
    return r as unknown as TeamEntity | null;
  }
  async create(data: Omit<TeamEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<TeamEntity> {
    const r = await prisma.team.create({ data: { tenantId: data.tenantId, name: data.name } });
    return r as unknown as TeamEntity;
  }
  async update(tenantId: string, teamId: string, data: Partial<Pick<TeamEntity, 'name'>>): Promise<TeamEntity> {
    const r = await prisma.team.update({ where: { id: teamId }, data });
    return r as unknown as TeamEntity;
  }
  async delete(tenantId: string, teamId: string): Promise<void> {
    await prisma.team.delete({ where: { id: teamId } });
  }
}
