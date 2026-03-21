import type { TeamEntity, TeamMemberEntity, TeamTaskEntity } from '../domain/entities';

export interface TeamRepository {
  findById(tenantId: string, teamId: string): Promise<TeamEntity | null>;
  findByLeaderId(tenantId: string, leaderId: string): Promise<TeamEntity | null>;
  create(data: Omit<TeamEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<TeamEntity>;
  update(tenantId: string, teamId: string, data: Partial<Pick<TeamEntity, 'name'>>): Promise<TeamEntity>;
  delete(tenantId: string, teamId: string): Promise<void>;
}

export interface TeamMemberRepository {
  findById(tenantId: string, memberId: string): Promise<TeamMemberEntity | null>;
  findByTeamId(tenantId: string, teamId: string): Promise<TeamMemberEntity[]>;
  findByPhone(tenantId: string, phone: string): Promise<TeamMemberEntity | null>;
  create(data: Omit<TeamMemberEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<TeamMemberEntity>;
  update(tenantId: string, memberId: string, data: Partial<Pick<TeamMemberEntity, 'name' | 'email' | 'role' | 'isActive'>>): Promise<TeamMemberEntity>;
  delete(tenantId: string, memberId: string): Promise<void>;
}

export interface TeamTaskRepository {
  findById(tenantId: string, taskId: string): Promise<TeamTaskEntity | null>;
  findByTeamId(tenantId: string, teamId: string, filters?: { status?: string; assigneeId?: string }): Promise<TeamTaskEntity[]>;
  create(data: Omit<TeamTaskEntity, 'id' | 'completedAt' | 'createdAt' | 'updatedAt'>): Promise<TeamTaskEntity>;
  update(tenantId: string, taskId: string, data: Partial<Pick<TeamTaskEntity, 'title' | 'description' | 'status' | 'assigneeId' | 'dueDate' | 'completedAt'>>): Promise<TeamTaskEntity>;
  delete(tenantId: string, taskId: string): Promise<void>;
}
