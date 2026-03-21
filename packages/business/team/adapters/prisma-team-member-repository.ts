import { prisma } from '@wbc/db';
import type { TeamMemberRepository } from '../ports/team-repository';
import type { TeamMemberEntity } from '../domain/entities';

export class PrismaTeamMemberRepository implements TeamMemberRepository {
  async findById(tenantId: string, memberId: string): Promise<TeamMemberEntity | null> {
    return prisma.teamMember.findFirst({ where: { id: memberId } }) as Promise<TeamMemberEntity | null>;
  }
  async findByTeamId(tenantId: string, teamId: string): Promise<TeamMemberEntity[]> {
    return prisma.teamMember.findMany({ where: { teamId } }) as Promise<TeamMemberEntity[]>;
  }
  async findByPhone(tenantId: string, phone: string): Promise<TeamMemberEntity | null> {
    return prisma.teamMember.findFirst({ where: { memberId: phone } }) as Promise<TeamMemberEntity | null>;
  }
  async create(data: Omit<TeamMemberEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<TeamMemberEntity> {
    return prisma.teamMember.create({ data: { teamId: data.teamId, memberId: data.phone, role: data.role, status: 'active', joinedAt: data.joinedAt } }) as Promise<TeamMemberEntity>;
  }
  async update(tenantId: string, memberId: string, data: Partial<Pick<TeamMemberEntity, 'name' | 'email' | 'role' | 'isActive'>>): Promise<TeamMemberEntity> {
    return prisma.teamMember.update({ where: { id: memberId }, data: { role: data.role } }) as Promise<TeamMemberEntity>;
  }
  async delete(tenantId: string, memberId: string): Promise<void> {
    await prisma.teamMember.delete({ where: { id: memberId } });
  }
}
