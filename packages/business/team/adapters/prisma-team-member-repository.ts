import { prisma } from '@wbc/db';
import type { TeamMemberRepository } from '../ports/team-repository';
import type { TeamMemberEntity } from '../domain/entities';

export class PrismaTeamMemberRepository implements TeamMemberRepository {
  async findById(tenantId: string, memberId: string): Promise<TeamMemberEntity | null> {
    const r = await prisma.teamMember.findFirst({ where: { id: memberId } });
    return r as unknown as TeamMemberEntity | null;
  }
  async findByTeamId(tenantId: string, teamId: string): Promise<TeamMemberEntity[]> {
    const r = await prisma.teamMember.findMany({ where: { teamId } });
    return r as unknown as TeamMemberEntity[];
  }
  async findByPhone(tenantId: string, phone: string): Promise<TeamMemberEntity | null> {
    const r = await prisma.teamMember.findFirst({ where: { memberId: phone } });
    return r as unknown as TeamMemberEntity | null;
  }
  async create(data: Omit<TeamMemberEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<TeamMemberEntity> {
    const r = await prisma.teamMember.create({ data: { teamId: data.teamId, memberId: data.phone, role: data.role, status: 'active', joinedAt: data.joinedAt } });
    return r as unknown as TeamMemberEntity;
  }
  async update(tenantId: string, memberId: string, data: Partial<Pick<TeamMemberEntity, 'name' | 'email' | 'role' | 'isActive'>>): Promise<TeamMemberEntity> {
    const r = await prisma.teamMember.update({ where: { id: memberId }, data: { role: data.role } });
    return r as unknown as TeamMemberEntity;
  }
  async delete(tenantId: string, memberId: string): Promise<void> {
    await prisma.teamMember.delete({ where: { id: memberId } });
  }
}
