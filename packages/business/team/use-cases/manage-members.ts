import type { TeamMemberRepository } from '../ports/team-repository';
import type { TeamMemberEntity } from '../domain/entities';
import type { Role } from '@wbc/shared';
import { DuplicateTeamMemberError, TeamMemberNotFoundError } from '../domain/errors';

export interface AddMemberInput {
  tenantId: string;
  teamId: string;
  name: string;
  phone: string;
  email?: string;
  role: Role;
}

export async function addMember(repo: TeamMemberRepository, input: AddMemberInput): Promise<TeamMemberEntity> {
  const existing = await repo.findByPhone(input.tenantId, input.phone);
  if (existing) throw new DuplicateTeamMemberError(input.phone);
  return repo.create({ tenantId: input.tenantId, teamId: input.teamId, name: input.name, phone: input.phone, email: input.email ?? null, role: input.role, isActive: true, joinedAt: new Date() });
}

export async function listMembers(repo: TeamMemberRepository, tenantId: string, teamId: string): Promise<TeamMemberEntity[]> {
  return repo.findByTeamId(tenantId, teamId);
}

export async function updateMember(repo: TeamMemberRepository, tenantId: string, memberId: string, data: Partial<Pick<TeamMemberEntity, 'name' | 'email' | 'role' | 'isActive'>>): Promise<TeamMemberEntity> {
  const member = await repo.findById(tenantId, memberId);
  if (!member) throw new TeamMemberNotFoundError(memberId);
  return repo.update(tenantId, memberId, data);
}

export async function removeMember(repo: TeamMemberRepository, tenantId: string, memberId: string): Promise<void> {
  const member = await repo.findById(tenantId, memberId);
  if (!member) throw new TeamMemberNotFoundError(memberId);
  await repo.delete(tenantId, memberId);
}
