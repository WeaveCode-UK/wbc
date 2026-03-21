import type { TeamRepository } from '../ports/team-repository';
import type { TeamEntity } from '../domain/entities';

export interface CreateTeamInput {
  tenantId: string;
  name: string;
  leaderId: string;
}

export async function createTeam(repo: TeamRepository, input: CreateTeamInput): Promise<TeamEntity> {
  const existing = await repo.findByLeaderId(input.tenantId, input.leaderId);
  if (existing) return existing;
  return repo.create(input);
}
