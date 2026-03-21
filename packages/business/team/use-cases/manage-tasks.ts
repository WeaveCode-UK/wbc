import type { TeamTaskRepository } from '../ports/team-repository';
import type { TeamTaskEntity } from '../domain/entities';
import { TeamTaskNotFoundError } from '../domain/errors';

export interface CreateTaskInput {
  tenantId: string;
  teamId: string;
  assigneeId?: string;
  title: string;
  description?: string;
  dueDate?: Date;
}

export async function createTask(repo: TeamTaskRepository, input: CreateTaskInput): Promise<TeamTaskEntity> {
  return repo.create({ tenantId: input.tenantId, teamId: input.teamId, assigneeId: input.assigneeId ?? null, title: input.title, description: input.description ?? null, status: 'PENDING', dueDate: input.dueDate ?? null });
}

export async function listTasks(repo: TeamTaskRepository, tenantId: string, teamId: string, filters?: { status?: string; assigneeId?: string }): Promise<TeamTaskEntity[]> {
  return repo.findByTeamId(tenantId, teamId, filters);
}

export async function completeTask(repo: TeamTaskRepository, tenantId: string, taskId: string): Promise<TeamTaskEntity> {
  const task = await repo.findById(tenantId, taskId);
  if (!task) throw new TeamTaskNotFoundError(taskId);
  return repo.update(tenantId, taskId, { status: 'COMPLETED', completedAt: new Date() });
}

export async function updateTask(repo: TeamTaskRepository, tenantId: string, taskId: string, data: Partial<Pick<TeamTaskEntity, 'title' | 'description' | 'status' | 'assigneeId' | 'dueDate'>>): Promise<TeamTaskEntity> {
  const task = await repo.findById(tenantId, taskId);
  if (!task) throw new TeamTaskNotFoundError(taskId);
  return repo.update(tenantId, taskId, data);
}

export async function deleteTask(repo: TeamTaskRepository, tenantId: string, taskId: string): Promise<void> {
  const task = await repo.findById(tenantId, taskId);
  if (!task) throw new TeamTaskNotFoundError(taskId);
  await repo.delete(tenantId, taskId);
}
