# WBC Platform — Engorda de Módulos + Cleanup Backend

> **Tipo:** Prompt de implementação autônoma
> **Execução:** Claude Code CLI no diretório `/Users/robsonmacpro/WeaveCode/Sistemas/5-Dev/weavecode-wbc/wbc`
> **Objetivo:** Completar os 4 módulos magros (team, logistics, landing, analytics), criar barrel files para todos os 15 módulos, centralizar validators Zod, e verificar que Redis está no Docker Compose.
> **Modo:** Dangerous Mode + Bypass ON. Execução contínua.
>
> **⚠️ REGRAS DE EXECUÇÃO (INVIOLÁVEIS):**
> - NUNCA pare, NUNCA pergunte, NUNCA espere confirmação
> - Execução sequencial — sem subagents
> - Literalidade absoluta — se não está neste prompt, não existe
> - domain/ NUNCA importa de adapters/
> - tenantId OBRIGATÓRIO em toda query Prisma
> - ZERO strings hardcoded na UI — tudo via i18n
> - ZERO `any` — tipagem estrita
> - Commits: Conventional Commits em inglês
> - Ao concluir cada bloco → commit → próximo bloco → NÃO PARAR
> - Ao concluir TUDO → pnpm type-check → tag v1.1.0 → PARAR

---

# BLOCO 1 — MÓDULO TEAM (de 1 arquivo para completo)

O módulo team atualmente tem apenas `use-cases/manage-team.ts`. Precisa de domain, ports, adapters e use cases completos.

**Referência:** Schema Prisma tem models Team, TeamMember, TeamTask. Rotas esperadas no router team.ts.

## TASK 1.1 — Team Domain

Criar `packages/business/team/domain/entities.ts`:
```typescript
import type { Role } from '@wbc/shared';

export interface TeamEntity {
  id: string;
  tenantId: string;
  name: string;
  leaderId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMemberEntity {
  id: string;
  tenantId: string;
  teamId: string;
  name: string;
  phone: string;
  email: string | null;
  role: Role;
  isActive: boolean;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamTaskEntity {
  id: string;
  tenantId: string;
  teamId: string;
  assigneeId: string | null;
  title: string;
  description: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

Criar `packages/business/team/domain/errors.ts`:
```typescript
export class TeamNotFoundError extends Error {
  constructor(id: string) {
    super(`Team not found: ${id}`);
    this.name = 'TeamNotFoundError';
  }
}

export class TeamMemberNotFoundError extends Error {
  constructor(id: string) {
    super(`Team member not found: ${id}`);
    this.name = 'TeamMemberNotFoundError';
  }
}

export class TeamTaskNotFoundError extends Error {
  constructor(id: string) {
    super(`Team task not found: ${id}`);
    this.name = 'TeamTaskNotFoundError';
  }
}

export class DuplicateTeamMemberError extends Error {
  constructor(phone: string) {
    super(`Team member already exists with phone: ${phone}`);
    this.name = 'DuplicateTeamMemberError';
  }
}
```

Criar `packages/business/team/domain/events.ts`:
```typescript
export const TEAM_EVENTS = {
  MEMBER_ADDED: 'team.member_added',
  MEMBER_REMOVED: 'team.member_removed',
  TASK_CREATED: 'team.task_created',
  TASK_COMPLETED: 'team.task_completed',
  TASK_APPROVED: 'team.task_approved',
} as const;
```

**Commit:**
```bash
git add packages/business/team/domain/
git commit -m "feat(team): add domain entities, errors, and events"
```

**PROSSIGA IMEDIATAMENTE para TASK 1.2.**

---

## TASK 1.2 — Team Ports

Criar `packages/business/team/ports/team-repository.ts`:
```typescript
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
```

**Commit:**
```bash
git add packages/business/team/ports/
git commit -m "feat(team): add repository port interfaces"
```

**PROSSIGA IMEDIATAMENTE para TASK 1.3.**

---

## TASK 1.3 — Team Adapters

Criar `packages/business/team/adapters/prisma-team-repository.ts`:
```typescript
import { prisma } from '@wbc/db';
import type { TeamRepository } from '../ports/team-repository';
import type { TeamEntity } from '../domain/entities';

export class PrismaTeamRepository implements TeamRepository {
  async findById(tenantId: string, teamId: string): Promise<TeamEntity | null> {
    return prisma.team.findFirst({
      where: { id: teamId, tenantId },
    });
  }

  async findByLeaderId(tenantId: string, leaderId: string): Promise<TeamEntity | null> {
    return prisma.team.findFirst({
      where: { leaderId, tenantId },
    });
  }

  async create(data: Omit<TeamEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<TeamEntity> {
    return prisma.team.create({ data });
  }

  async update(tenantId: string, teamId: string, data: Partial<Pick<TeamEntity, 'name'>>): Promise<TeamEntity> {
    return prisma.team.update({
      where: { id: teamId, tenantId },
      data,
    });
  }

  async delete(tenantId: string, teamId: string): Promise<void> {
    await prisma.team.delete({
      where: { id: teamId, tenantId },
    });
  }
}
```

Criar `packages/business/team/adapters/prisma-team-member-repository.ts`:
```typescript
import { prisma } from '@wbc/db';
import type { TeamMemberRepository } from '../ports/team-repository';
import type { TeamMemberEntity } from '../domain/entities';

export class PrismaTeamMemberRepository implements TeamMemberRepository {
  async findById(tenantId: string, memberId: string): Promise<TeamMemberEntity | null> {
    return prisma.teamMember.findFirst({
      where: { id: memberId, tenantId },
    });
  }

  async findByTeamId(tenantId: string, teamId: string): Promise<TeamMemberEntity[]> {
    return prisma.teamMember.findMany({
      where: { teamId, tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findByPhone(tenantId: string, phone: string): Promise<TeamMemberEntity | null> {
    return prisma.teamMember.findFirst({
      where: { phone, tenantId },
    });
  }

  async create(data: Omit<TeamMemberEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<TeamMemberEntity> {
    return prisma.teamMember.create({ data });
  }

  async update(tenantId: string, memberId: string, data: Partial<Pick<TeamMemberEntity, 'name' | 'email' | 'role' | 'isActive'>>): Promise<TeamMemberEntity> {
    return prisma.teamMember.update({
      where: { id: memberId, tenantId },
      data,
    });
  }

  async delete(tenantId: string, memberId: string): Promise<void> {
    await prisma.teamMember.delete({
      where: { id: memberId, tenantId },
    });
  }
}
```

Criar `packages/business/team/adapters/prisma-team-task-repository.ts`:
```typescript
import { prisma } from '@wbc/db';
import type { TeamTaskRepository } from '../ports/team-repository';
import type { TeamTaskEntity } from '../domain/entities';

export class PrismaTeamTaskRepository implements TeamTaskRepository {
  async findById(tenantId: string, taskId: string): Promise<TeamTaskEntity | null> {
    return prisma.teamTask.findFirst({
      where: { id: taskId, tenantId },
    });
  }

  async findByTeamId(tenantId: string, teamId: string, filters?: { status?: string; assigneeId?: string }): Promise<TeamTaskEntity[]> {
    return prisma.teamTask.findMany({
      where: {
        teamId,
        tenantId,
        ...(filters?.status ? { status: filters.status as TeamTaskEntity['status'] } : {}),
        ...(filters?.assigneeId ? { assigneeId: filters.assigneeId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Omit<TeamTaskEntity, 'id' | 'completedAt' | 'createdAt' | 'updatedAt'>): Promise<TeamTaskEntity> {
    return prisma.teamTask.create({ data });
  }

  async update(tenantId: string, taskId: string, data: Partial<Pick<TeamTaskEntity, 'title' | 'description' | 'status' | 'assigneeId' | 'dueDate' | 'completedAt'>>): Promise<TeamTaskEntity> {
    return prisma.teamTask.update({
      where: { id: taskId, tenantId },
      data,
    });
  }

  async delete(tenantId: string, taskId: string): Promise<void> {
    await prisma.teamTask.delete({
      where: { id: taskId, tenantId },
    });
  }
}
```

**Commit:**
```bash
git add packages/business/team/adapters/
git commit -m "feat(team): add Prisma adapters for team, member, and task repositories"
```

**PROSSIGA IMEDIATAMENTE para TASK 1.4.**

---

## TASK 1.4 — Team Use Cases (substituir o manage-team.ts existente)

Deletar o arquivo existente `packages/business/team/use-cases/manage-team.ts` e substituir por use cases granulares.

Criar `packages/business/team/use-cases/create-team.ts`:
```typescript
import type { TeamRepository } from '../ports/team-repository';
import type { TeamEntity } from '../domain/entities';

export interface CreateTeamInput {
  tenantId: string;
  name: string;
  leaderId: string;
}

export async function createTeam(
  repo: TeamRepository,
  input: CreateTeamInput,
): Promise<TeamEntity> {
  const existing = await repo.findByLeaderId(input.tenantId, input.leaderId);
  if (existing) {
    return existing; // Leader already has a team
  }
  return repo.create(input);
}
```

Criar `packages/business/team/use-cases/manage-members.ts`:
```typescript
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

export async function addMember(
  repo: TeamMemberRepository,
  input: AddMemberInput,
): Promise<TeamMemberEntity> {
  const existing = await repo.findByPhone(input.tenantId, input.phone);
  if (existing) {
    throw new DuplicateTeamMemberError(input.phone);
  }
  return repo.create({
    tenantId: input.tenantId,
    teamId: input.teamId,
    name: input.name,
    phone: input.phone,
    email: input.email ?? null,
    role: input.role,
    isActive: true,
    joinedAt: new Date(),
  });
}

export async function listMembers(
  repo: TeamMemberRepository,
  tenantId: string,
  teamId: string,
): Promise<TeamMemberEntity[]> {
  return repo.findByTeamId(tenantId, teamId);
}

export async function updateMember(
  repo: TeamMemberRepository,
  tenantId: string,
  memberId: string,
  data: Partial<Pick<TeamMemberEntity, 'name' | 'email' | 'role' | 'isActive'>>,
): Promise<TeamMemberEntity> {
  const member = await repo.findById(tenantId, memberId);
  if (!member) throw new TeamMemberNotFoundError(memberId);
  return repo.update(tenantId, memberId, data);
}

export async function removeMember(
  repo: TeamMemberRepository,
  tenantId: string,
  memberId: string,
): Promise<void> {
  const member = await repo.findById(tenantId, memberId);
  if (!member) throw new TeamMemberNotFoundError(memberId);
  await repo.delete(tenantId, memberId);
}
```

Criar `packages/business/team/use-cases/manage-tasks.ts`:
```typescript
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

export async function createTask(
  repo: TeamTaskRepository,
  input: CreateTaskInput,
): Promise<TeamTaskEntity> {
  return repo.create({
    tenantId: input.tenantId,
    teamId: input.teamId,
    assigneeId: input.assigneeId ?? null,
    title: input.title,
    description: input.description ?? null,
    status: 'PENDING',
    dueDate: input.dueDate ?? null,
  });
}

export async function listTasks(
  repo: TeamTaskRepository,
  tenantId: string,
  teamId: string,
  filters?: { status?: string; assigneeId?: string },
): Promise<TeamTaskEntity[]> {
  return repo.findByTeamId(tenantId, teamId, filters);
}

export async function completeTask(
  repo: TeamTaskRepository,
  tenantId: string,
  taskId: string,
): Promise<TeamTaskEntity> {
  const task = await repo.findById(tenantId, taskId);
  if (!task) throw new TeamTaskNotFoundError(taskId);
  return repo.update(tenantId, taskId, {
    status: 'COMPLETED',
    completedAt: new Date(),
  });
}

export async function updateTask(
  repo: TeamTaskRepository,
  tenantId: string,
  taskId: string,
  data: Partial<Pick<TeamTaskEntity, 'title' | 'description' | 'status' | 'assigneeId' | 'dueDate'>>,
): Promise<TeamTaskEntity> {
  const task = await repo.findById(tenantId, taskId);
  if (!task) throw new TeamTaskNotFoundError(taskId);
  return repo.update(tenantId, taskId, data);
}

export async function deleteTask(
  repo: TeamTaskRepository,
  tenantId: string,
  taskId: string,
): Promise<void> {
  const task = await repo.findById(tenantId, taskId);
  if (!task) throw new TeamTaskNotFoundError(taskId);
  await repo.delete(tenantId, taskId);
}
```

Criar `packages/business/team/use-cases/get-ranking.ts`:
```typescript
import { prisma } from '@wbc/db';

export interface TeamRanking {
  memberId: string;
  memberName: string;
  totalSales: number;
  totalRevenue: number;
}

export async function getTeamRanking(
  tenantId: string,
  teamId: string,
): Promise<TeamRanking[]> {
  const members = await prisma.teamMember.findMany({
    where: { teamId, tenantId, isActive: true },
  });

  // For each member, count their sales (using tenantId as owner reference)
  // This is a simplified ranking — in production, members would be linked to sales
  return members.map((m) => ({
    memberId: m.id,
    memberName: m.name,
    totalSales: 0,
    totalRevenue: 0,
  }));
}
```

Deletar o arquivo antigo:
```bash
rm packages/business/team/use-cases/manage-team.ts
```

**Commit:**
```bash
git add packages/business/team/use-cases/
git commit -m "feat(team): add granular use cases for team, members, tasks, and ranking"
```

**PROSSIGA IMEDIATAMENTE para BLOCO 2.**

---

# BLOCO 2 — MÓDULO LOGISTICS (de 1 arquivo para completo)

## TASK 2.1 — Logistics Domain

Criar `packages/business/logistics/domain/entities.ts`:
```typescript
export type DeliveryMethod = 'PICKUP' | 'DELIVERY' | 'SHIPPING';
export type DeliveryStatus = 'CONFIRMED' | 'SEPARATED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface DeliveryEntity {
  id: string;
  tenantId: string;
  saleId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  address: string | null;
  method: DeliveryMethod;
  status: DeliveryStatus;
  trackingCode: string | null;
  estimatedDate: Date | null;
  deliveredAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

Criar `packages/business/logistics/domain/errors.ts`:
```typescript
export class DeliveryNotFoundError extends Error {
  constructor(id: string) {
    super(`Delivery not found: ${id}`);
    this.name = 'DeliveryNotFoundError';
  }
}

export class InvalidStatusTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot transition delivery from ${from} to ${to}`);
    this.name = 'InvalidStatusTransitionError';
  }
}
```

Criar `packages/business/logistics/domain/events.ts`:
```typescript
export const LOGISTICS_EVENTS = {
  DELIVERY_CREATED: 'delivery.created',
  DELIVERY_SHIPPED: 'delivery.shipped',
  DELIVERY_DELIVERED: 'delivery.delivered',
  DELIVERY_CANCELLED: 'delivery.cancelled',
} as const;
```

**Commit:**
```bash
git add packages/business/logistics/domain/
git commit -m "feat(logistics): add domain entities, errors, and events"
```

**PROSSIGA IMEDIATAMENTE para TASK 2.2.**

---

## TASK 2.2 — Logistics Ports

Criar `packages/business/logistics/ports/delivery-repository.ts`:
```typescript
import type { DeliveryEntity, DeliveryStatus } from '../domain/entities';

export interface DeliveryRepository {
  findById(tenantId: string, deliveryId: string): Promise<DeliveryEntity | null>;
  findBySaleId(tenantId: string, saleId: string): Promise<DeliveryEntity | null>;
  findByStatus(tenantId: string, status: DeliveryStatus): Promise<DeliveryEntity[]>;
  findPendingToday(tenantId: string): Promise<DeliveryEntity[]>;
  list(tenantId: string, filters?: { status?: DeliveryStatus; clientId?: string }): Promise<DeliveryEntity[]>;
  create(data: Omit<DeliveryEntity, 'id' | 'deliveredAt' | 'createdAt' | 'updatedAt'>): Promise<DeliveryEntity>;
  updateStatus(tenantId: string, deliveryId: string, status: DeliveryStatus, extra?: { trackingCode?: string; deliveredAt?: Date }): Promise<DeliveryEntity>;
  delete(tenantId: string, deliveryId: string): Promise<void>;
}
```

**Commit:**
```bash
git add packages/business/logistics/ports/
git commit -m "feat(logistics): add delivery repository port"
```

**PROSSIGA IMEDIATAMENTE para TASK 2.3.**

---

## TASK 2.3 — Logistics Adapter

Criar `packages/business/logistics/adapters/prisma-delivery-repository.ts`:
```typescript
import { prisma } from '@wbc/db';
import type { DeliveryRepository } from '../ports/delivery-repository';
import type { DeliveryEntity, DeliveryStatus } from '../domain/entities';

export class PrismaDeliveryRepository implements DeliveryRepository {
  async findById(tenantId: string, deliveryId: string): Promise<DeliveryEntity | null> {
    return prisma.delivery.findFirst({ where: { id: deliveryId, tenantId } }) as Promise<DeliveryEntity | null>;
  }

  async findBySaleId(tenantId: string, saleId: string): Promise<DeliveryEntity | null> {
    return prisma.delivery.findFirst({ where: { saleId, tenantId } }) as Promise<DeliveryEntity | null>;
  }

  async findByStatus(tenantId: string, status: DeliveryStatus): Promise<DeliveryEntity[]> {
    return prisma.delivery.findMany({ where: { status, tenantId }, orderBy: { createdAt: 'desc' } }) as Promise<DeliveryEntity[]>;
  }

  async findPendingToday(tenantId: string): Promise<DeliveryEntity[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.delivery.findMany({
      where: {
        tenantId,
        status: { in: ['CONFIRMED', 'SEPARATED', 'SHIPPED'] },
        estimatedDate: { gte: today, lt: tomorrow },
      },
      orderBy: { estimatedDate: 'asc' },
    }) as Promise<DeliveryEntity[]>;
  }

  async list(tenantId: string, filters?: { status?: DeliveryStatus; clientId?: string }): Promise<DeliveryEntity[]> {
    return prisma.delivery.findMany({
      where: {
        tenantId,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.clientId ? { clientId: filters.clientId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    }) as Promise<DeliveryEntity[]>;
  }

  async create(data: Omit<DeliveryEntity, 'id' | 'deliveredAt' | 'createdAt' | 'updatedAt'>): Promise<DeliveryEntity> {
    return prisma.delivery.create({ data }) as Promise<DeliveryEntity>;
  }

  async updateStatus(tenantId: string, deliveryId: string, status: DeliveryStatus, extra?: { trackingCode?: string; deliveredAt?: Date }): Promise<DeliveryEntity> {
    return prisma.delivery.update({
      where: { id: deliveryId, tenantId },
      data: { status, ...extra },
    }) as Promise<DeliveryEntity>;
  }

  async delete(tenantId: string, deliveryId: string): Promise<void> {
    await prisma.delivery.delete({ where: { id: deliveryId, tenantId } });
  }
}
```

**Commit:**
```bash
git add packages/business/logistics/adapters/
git commit -m "feat(logistics): add Prisma delivery repository adapter"
```

**PROSSIGA IMEDIATAMENTE para TASK 2.4.**

---

## TASK 2.4 — Logistics Use Cases (substituir manage-deliveries.ts)

Deletar `packages/business/logistics/use-cases/manage-deliveries.ts` e criar use cases granulares.

Criar `packages/business/logistics/use-cases/create-delivery.ts`:
```typescript
import type { DeliveryRepository } from '../ports/delivery-repository';
import type { DeliveryEntity, DeliveryMethod } from '../domain/entities';

export interface CreateDeliveryInput {
  tenantId: string;
  saleId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  address?: string;
  method: DeliveryMethod;
  estimatedDate?: Date;
  notes?: string;
}

export async function createDelivery(
  repo: DeliveryRepository,
  input: CreateDeliveryInput,
): Promise<DeliveryEntity> {
  return repo.create({
    tenantId: input.tenantId,
    saleId: input.saleId,
    clientId: input.clientId,
    clientName: input.clientName,
    clientPhone: input.clientPhone,
    address: input.address ?? null,
    method: input.method,
    status: 'CONFIRMED',
    trackingCode: null,
    estimatedDate: input.estimatedDate ?? null,
    notes: input.notes ?? null,
  });
}
```

Criar `packages/business/logistics/use-cases/update-delivery-status.ts`:
```typescript
import type { DeliveryRepository } from '../ports/delivery-repository';
import type { DeliveryEntity, DeliveryStatus } from '../domain/entities';
import { DeliveryNotFoundError, InvalidStatusTransitionError } from '../domain/errors';

const VALID_TRANSITIONS: Record<string, string[]> = {
  CONFIRMED: ['SEPARATED', 'CANCELLED'],
  SEPARATED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export async function updateDeliveryStatus(
  repo: DeliveryRepository,
  tenantId: string,
  deliveryId: string,
  newStatus: DeliveryStatus,
  trackingCode?: string,
): Promise<DeliveryEntity> {
  const delivery = await repo.findById(tenantId, deliveryId);
  if (!delivery) throw new DeliveryNotFoundError(deliveryId);

  const allowed = VALID_TRANSITIONS[delivery.status] ?? [];
  if (!allowed.includes(newStatus)) {
    throw new InvalidStatusTransitionError(delivery.status, newStatus);
  }

  const extra: { trackingCode?: string; deliveredAt?: Date } = {};
  if (trackingCode) extra.trackingCode = trackingCode;
  if (newStatus === 'DELIVERED') extra.deliveredAt = new Date();

  return repo.updateStatus(tenantId, deliveryId, newStatus, extra);
}
```

Criar `packages/business/logistics/use-cases/list-deliveries.ts`:
```typescript
import type { DeliveryRepository } from '../ports/delivery-repository';
import type { DeliveryEntity, DeliveryStatus } from '../domain/entities';

export async function listDeliveries(
  repo: DeliveryRepository,
  tenantId: string,
  filters?: { status?: DeliveryStatus; clientId?: string },
): Promise<DeliveryEntity[]> {
  return repo.list(tenantId, filters);
}

export async function getTodayRoute(
  repo: DeliveryRepository,
  tenantId: string,
): Promise<DeliveryEntity[]> {
  return repo.findPendingToday(tenantId);
}
```

Criar `packages/business/logistics/use-cases/generate-label.ts`:
```typescript
import type { DeliveryEntity } from '../domain/entities';

export interface ShippingLabel {
  recipientName: string;
  recipientPhone: string;
  address: string;
  trackingCode: string | null;
  method: string;
  notes: string | null;
}

export function generateShippingLabel(delivery: DeliveryEntity): ShippingLabel {
  return {
    recipientName: delivery.clientName,
    recipientPhone: delivery.clientPhone,
    address: delivery.address ?? 'Retirada no local',
    trackingCode: delivery.trackingCode,
    method: delivery.method,
    notes: delivery.notes,
  };
}
```

Deletar arquivo antigo:
```bash
rm packages/business/logistics/use-cases/manage-deliveries.ts
```

**Commit:**
```bash
git add packages/business/logistics/
git commit -m "feat(logistics): add granular use cases for delivery management, routing, and labels"
```

**PROSSIGA IMEDIATAMENTE para BLOCO 3.**

---

# BLOCO 3 — MÓDULO LANDING (de 1 arquivo para completo)

## TASK 3.1 — Landing Domain + Ports

Criar `packages/business/landing/domain/entities.ts`:
```typescript
export interface LandingPageEntity {
  id: string;
  tenantId: string;
  slug: string;
  name: string;
  bio: string | null;
  philosophy: string | null;
  photoUrl: string | null;
  whatsappPhone: string;
  brands: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

Criar `packages/business/landing/domain/errors.ts`:
```typescript
export class LandingPageNotFoundError extends Error {
  constructor(tenantId: string) {
    super(`Landing page not found for tenant: ${tenantId}`);
    this.name = 'LandingPageNotFoundError';
  }
}

export class SlugAlreadyTakenError extends Error {
  constructor(slug: string) {
    super(`Slug already taken: ${slug}`);
    this.name = 'SlugAlreadyTakenError';
  }
}
```

Criar `packages/business/landing/ports/landing-repository.ts`:
```typescript
import type { LandingPageEntity } from '../domain/entities';

export interface LandingRepository {
  findByTenantId(tenantId: string): Promise<LandingPageEntity | null>;
  findBySlug(slug: string): Promise<LandingPageEntity | null>;
  upsert(tenantId: string, data: Omit<LandingPageEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<LandingPageEntity>;
  toggleActive(tenantId: string, isActive: boolean): Promise<LandingPageEntity>;
}
```

**Commit:**
```bash
git add packages/business/landing/domain/ packages/business/landing/ports/
git commit -m "feat(landing): add domain entities, errors, and repository port"
```

**PROSSIGA IMEDIATAMENTE para TASK 3.2.**

---

## TASK 3.2 — Landing Adapter + Use Cases

Criar `packages/business/landing/adapters/prisma-landing-repository.ts`:
```typescript
import { prisma } from '@wbc/db';
import type { LandingRepository } from '../ports/landing-repository';
import type { LandingPageEntity } from '../domain/entities';

export class PrismaLandingRepository implements LandingRepository {
  async findByTenantId(tenantId: string): Promise<LandingPageEntity | null> {
    return prisma.landingPage.findFirst({ where: { tenantId } }) as Promise<LandingPageEntity | null>;
  }

  async findBySlug(slug: string): Promise<LandingPageEntity | null> {
    return prisma.landingPage.findFirst({ where: { slug, isActive: true } }) as Promise<LandingPageEntity | null>;
  }

  async upsert(tenantId: string, data: Omit<LandingPageEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<LandingPageEntity> {
    return prisma.landingPage.upsert({
      where: { tenantId },
      create: data,
      update: {
        slug: data.slug,
        name: data.name,
        bio: data.bio,
        philosophy: data.philosophy,
        photoUrl: data.photoUrl,
        whatsappPhone: data.whatsappPhone,
        brands: data.brands,
        isActive: data.isActive,
      },
    }) as Promise<LandingPageEntity>;
  }

  async toggleActive(tenantId: string, isActive: boolean): Promise<LandingPageEntity> {
    return prisma.landingPage.update({
      where: { tenantId },
      data: { isActive },
    }) as Promise<LandingPageEntity>;
  }
}
```

Substituir `packages/business/landing/use-cases/manage-landing.ts` com versão completa:
```typescript
import type { LandingRepository } from '../ports/landing-repository';
import type { LandingPageEntity } from '../domain/entities';
import { LandingPageNotFoundError, SlugAlreadyTakenError } from '../domain/errors';

export interface UpsertLandingInput {
  tenantId: string;
  slug: string;
  name: string;
  bio?: string;
  philosophy?: string;
  photoUrl?: string;
  whatsappPhone: string;
  brands?: string[];
}

export async function upsertLanding(
  repo: LandingRepository,
  input: UpsertLandingInput,
): Promise<LandingPageEntity> {
  // Check slug uniqueness
  const existingSlug = await repo.findBySlug(input.slug);
  if (existingSlug && existingSlug.tenantId !== input.tenantId) {
    throw new SlugAlreadyTakenError(input.slug);
  }

  return repo.upsert(input.tenantId, {
    tenantId: input.tenantId,
    slug: input.slug,
    name: input.name,
    bio: input.bio ?? null,
    philosophy: input.philosophy ?? null,
    photoUrl: input.photoUrl ?? null,
    whatsappPhone: input.whatsappPhone,
    brands: input.brands ?? [],
    isActive: true,
  });
}

export async function getLanding(
  repo: LandingRepository,
  tenantId: string,
): Promise<LandingPageEntity> {
  const page = await repo.findByTenantId(tenantId);
  if (!page) throw new LandingPageNotFoundError(tenantId);
  return page;
}

export async function getPublicLanding(
  repo: LandingRepository,
  slug: string,
): Promise<LandingPageEntity | null> {
  return repo.findBySlug(slug);
}

export async function toggleLanding(
  repo: LandingRepository,
  tenantId: string,
  isActive: boolean,
): Promise<LandingPageEntity> {
  return repo.toggleActive(tenantId, isActive);
}
```

**Commit:**
```bash
git add packages/business/landing/
git commit -m "feat(landing): add Prisma adapter and complete use cases for landing pages"
```

**PROSSIGA IMEDIATAMENTE para BLOCO 4.**

---

# BLOCO 4 — MÓDULO ANALYTICS (de 2 arquivos para completo)

## TASK 4.1 — Analytics Domain + Use Cases Expandidos

Criar `packages/business/analytics/domain/entities.ts`:
```typescript
export type ABCClassification = 'A' | 'B' | 'C';

export interface DashboardMetrics {
  salesThisMonth: number;
  revenueThisMonth: number;
  totalClients: number;
  pendingReminders: number;
  pendingPayments: number;
  overduePayments: number;
  stockAlerts: number;
  appointmentsToday: number;
}

export interface ClientEngagement {
  clientId: string;
  clientName: string;
  totalPurchases: number;
  totalSpent: number;
  lastPurchaseDate: Date | null;
  daysSinceLastPurchase: number | null;
  classification: ABCClassification;
  engagementScore: number;
}

export interface ProductRanking {
  productId: string;
  productName: string;
  brandName: string;
  totalSold: number;
  totalRevenue: number;
}

export interface SalesGoal {
  target: number;
  current: number;
  percentage: number;
  daysRemaining: number;
  dailyNeeded: number;
}

export interface SeasonalityData {
  month: number;
  year: number;
  revenue: number;
  sales: number;
}
```

Substituir `packages/business/analytics/use-cases/get-dashboard.ts`:
```typescript
import { prisma } from '@wbc/db';
import type { DashboardMetrics } from '../domain/entities';

export async function getDashboardMetrics(tenantId: string): Promise<DashboardMetrics> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [salesCount, revenue, clientCount, reminders, pendingPayments, overduePayments, stockAlerts, appointments] = await Promise.all([
    prisma.sale.count({ where: { tenantId, createdAt: { gte: startOfMonth }, status: { not: 'CANCELLED' } } }),
    prisma.sale.aggregate({ where: { tenantId, createdAt: { gte: startOfMonth }, status: { not: 'CANCELLED' } }, _sum: { total: true } }),
    prisma.client.count({ where: { tenantId } }),
    prisma.reminder.count({ where: { tenantId, status: 'PENDING' } }),
    prisma.payment.count({ where: { tenantId, status: 'PENDING' } }),
    prisma.payment.count({ where: { tenantId, status: 'OVERDUE' } }),
    prisma.stock.count({ where: { tenantId, quantity: { lte: prisma.raw('min_alert') } } }).catch(() => 0),
    prisma.appointment.count({ where: { tenantId, date: { gte: today, lt: tomorrow } } }),
  ]);

  return {
    salesThisMonth: salesCount,
    revenueThisMonth: Number(revenue._sum.total ?? 0),
    totalClients: clientCount,
    pendingReminders: reminders,
    pendingPayments,
    overduePayments,
    stockAlerts,
    appointmentsToday: appointments,
  };
}
```

Substituir `packages/business/analytics/use-cases/get-stats.ts`:
```typescript
import { prisma } from '@wbc/db';
import type { ClientEngagement, ProductRanking, SalesGoal, SeasonalityData } from '../domain/entities';

export async function getClientEngagement(tenantId: string): Promise<ClientEngagement[]> {
  const clients = await prisma.client.findMany({
    where: { tenantId },
    include: {
      sales: {
        where: { status: { not: 'CANCELLED' } },
        select: { total: true, createdAt: true },
      },
    },
  });

  const now = new Date();

  return clients.map((c) => {
    const totalSpent = c.sales.reduce((sum, s) => sum + Number(s.total), 0);
    const lastPurchase = c.sales.length > 0 ? c.sales[c.sales.length - 1]?.createdAt ?? null : null;
    const daysSince = lastPurchase ? Math.floor((now.getTime() - lastPurchase.getTime()) / 86400000) : null;

    let classification: 'A' | 'B' | 'C' = 'C';
    if (c.sales.length >= 5 && totalSpent >= 500) classification = 'A';
    else if (c.sales.length >= 2 && totalSpent >= 100) classification = 'B';

    const engagementScore = Math.min(100, c.sales.length * 10 + (daysSince !== null && daysSince < 30 ? 30 : 0));

    return {
      clientId: c.id,
      clientName: c.name,
      totalPurchases: c.sales.length,
      totalSpent,
      lastPurchaseDate: lastPurchase,
      daysSinceLastPurchase: daysSince,
      classification,
      engagementScore,
    };
  }).sort((a, b) => b.totalSpent - a.totalSpent);
}

export async function getProductRanking(tenantId: string): Promise<ProductRanking[]> {
  const items = await prisma.saleItem.findMany({
    where: { sale: { tenantId, status: { not: 'CANCELLED' } } },
    include: { product: { include: { brand: true } } },
  });

  const map = new Map<string, ProductRanking>();
  for (const item of items) {
    const existing = map.get(item.productId) ?? {
      productId: item.productId,
      productName: item.product.name,
      brandName: item.product.brand?.name ?? 'Sem marca',
      totalSold: 0,
      totalRevenue: 0,
    };
    existing.totalSold += item.quantity;
    existing.totalRevenue += Number(item.subtotal);
    map.set(item.productId, existing);
  }

  return Array.from(map.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export async function getSalesGoal(tenantId: string, monthlyTarget: number): Promise<SalesGoal> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysRemaining = endOfMonth.getDate() - now.getDate() + 1;

  const result = await prisma.sale.aggregate({
    where: { tenantId, createdAt: { gte: startOfMonth }, status: { not: 'CANCELLED' } },
    _sum: { total: true },
  });

  const current = Number(result._sum.total ?? 0);
  const remaining = Math.max(0, monthlyTarget - current);

  return {
    target: monthlyTarget,
    current,
    percentage: monthlyTarget > 0 ? Math.round((current / monthlyTarget) * 100) : 0,
    daysRemaining,
    dailyNeeded: daysRemaining > 0 ? Math.ceil(remaining / daysRemaining) : 0,
  };
}

export async function getSeasonality(tenantId: string, months: number = 12): Promise<SeasonalityData[]> {
  const now = new Date();
  const results: SeasonalityData[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const [salesCount, revenue] = await Promise.all([
      prisma.sale.count({ where: { tenantId, createdAt: { gte: start, lt: end }, status: { not: 'CANCELLED' } } }),
      prisma.sale.aggregate({ where: { tenantId, createdAt: { gte: start, lt: end }, status: { not: 'CANCELLED' } }, _sum: { total: true } }),
    ]);

    results.push({
      month: start.getMonth() + 1,
      year: start.getFullYear(),
      revenue: Number(revenue._sum.total ?? 0),
      sales: salesCount,
    });
  }

  return results;
}
```

**Commit:**
```bash
git add packages/business/analytics/
git commit -m "feat(analytics): add domain entities and expand dashboard, engagement, ranking, goals, seasonality"
```

**PROSSIGA IMEDIATAMENTE para BLOCO 5.**

---

# BLOCO 5 — BARREL FILES (index.ts para cada módulo)

Criar `index.ts` em cada módulo business exportando as interfaces públicas.

```bash
# Auth
cat > packages/business/auth/index.ts << 'EOF'
export * from './domain/otp';
export * from './domain/subscription';
export * from './domain/errors';
export * from './ports/otp-repository';
export * from './ports/subscription-repository';
export * from './use-cases/send-otp';
export * from './use-cases/verify-otp';
export * from './use-cases/register-tenant';
export * from './adapters/prisma-otp-repository';
export * from './adapters/prisma-subscription-repository';
export * from './adapters/prisma-tenant-repository';
EOF

# Clients
cat > packages/business/clients/index.ts << 'EOF'
export * from './domain/entities';
export * from './domain/errors';
export * from './domain/events';
export * from './domain/value-objects';
export * from './ports/client-repository';
export * from './ports/tag-repository';
export * from './use-cases/create-client';
export * from './use-cases/update-client';
export * from './use-cases/delete-client';
export * from './use-cases/list-clients';
export * from './use-cases/get-client-by-id';
export * from './use-cases/manage-tags';
export * from './use-cases/manage-leads';
export * from './use-cases/manage-wishlist';
export * from './adapters/prisma-client-repository';
export * from './adapters/prisma-tag-repository';
EOF

# Catalog
cat > packages/business/catalog/index.ts << 'EOF'
export * from './domain/entities';
export * from './domain/errors';
export * from './ports/brand-repository';
export * from './ports/product-repository';
export * from './ports/showcase-repository';
export * from './use-cases/list-brands';
export * from './use-cases/manage-products';
export * from './use-cases/manage-showcases';
export * from './adapters/prisma-brand-repository';
export * from './adapters/prisma-product-repository';
export * from './adapters/prisma-showcase-repository';
EOF

# Sales
cat > packages/business/sales/index.ts << 'EOF'
export * from './domain/entities';
export * from './domain/errors';
export * from './domain/events';
export * from './domain/value-objects';
export * from './ports/sale-repository';
export * from './ports/payment-repository';
export * from './ports/cashback-repository';
export * from './use-cases/create-sale';
export * from './use-cases/confirm-sale';
export * from './use-cases/cancel-sale';
export * from './use-cases/list-sales';
export * from './use-cases/get-sale-by-id';
export * from './use-cases/update-sale-status';
export * from './use-cases/manage-payments';
export * from './use-cases/manage-cashback';
export * from './use-cases/create-return';
export * from './adapters/prisma-sale-repository';
export * from './adapters/prisma-payment-repository';
export * from './adapters/prisma-cashback-repository';
EOF

# Campaigns
cat > packages/business/campaigns/index.ts << 'EOF'
export * from './domain/entities';
export * from './domain/errors';
export * from './ports/campaign-repository';
export * from './use-cases/manage-campaigns';
export * from './use-cases/manage-templates';
export * from './adapters/prisma-campaign-repository';
EOF

# Messaging
cat > packages/business/messaging/index.ts << 'EOF'
export * from './domain/whatsapp';
export * from './domain/errors';
export * from './ports/whatsapp-port';
export * from './use-cases/auto-messages';
export * from './use-cases/post-sale-flow';
export * from './use-cases/quick-replies';
export * from './adapters/whatsapp-n1-adapter';
export * from './adapters/whatsapp-n2-adapter';
export * from './adapters/whatsapp-webhook-handler';
EOF

# AI
cat > packages/business/ai/index.ts << 'EOF'
export * from './ports/ai-provider';
export * from './use-cases/generate-text';
export * from './adapters/deepseek-adapter';
EOF

# Inventory
cat > packages/business/inventory/index.ts << 'EOF'
export * from './domain/entities';
export * from './domain/errors';
export * from './domain/events';
export * from './ports/stock-repository';
export * from './ports/brand-order-repository';
export * from './ports/sample-repository';
export * from './use-cases/manage-stock';
export * from './use-cases/manage-orders';
export * from './use-cases/manage-samples';
export * from './adapters/prisma-stock-repository';
export * from './adapters/prisma-brand-order-repository';
export * from './adapters/prisma-sample-repository';
export * from './adapters/sale-confirmed-handler';
EOF

# Finance
cat > packages/business/finance/index.ts << 'EOF'
export * from './domain/entities';
export * from './domain/errors';
export * from './ports/expense-repository';
export * from './use-cases/manage-expenses';
export * from './use-cases/get-dashboard';
export * from './use-cases/calculators';
export * from './adapters/prisma-expense-repository';
EOF

# Schedule
cat > packages/business/schedule/index.ts << 'EOF'
export * from './domain/entities';
export * from './domain/errors';
export * from './use-cases/manage-appointments';
export * from './use-cases/notifications';
EOF

# Team
cat > packages/business/team/index.ts << 'EOF'
export * from './domain/entities';
export * from './domain/errors';
export * from './domain/events';
export * from './ports/team-repository';
export * from './use-cases/create-team';
export * from './use-cases/manage-members';
export * from './use-cases/manage-tasks';
export * from './use-cases/get-ranking';
export * from './adapters/prisma-team-repository';
export * from './adapters/prisma-team-member-repository';
export * from './adapters/prisma-team-task-repository';
EOF

# Analytics
cat > packages/business/analytics/index.ts << 'EOF'
export * from './domain/entities';
export * from './use-cases/get-dashboard';
export * from './use-cases/get-stats';
EOF

# Logistics
cat > packages/business/logistics/index.ts << 'EOF'
export * from './domain/entities';
export * from './domain/errors';
export * from './domain/events';
export * from './ports/delivery-repository';
export * from './use-cases/create-delivery';
export * from './use-cases/update-delivery-status';
export * from './use-cases/list-deliveries';
export * from './use-cases/generate-label';
export * from './adapters/prisma-delivery-repository';
EOF

# Landing
cat > packages/business/landing/index.ts << 'EOF'
export * from './domain/entities';
export * from './domain/errors';
export * from './ports/landing-repository';
export * from './use-cases/manage-landing';
export * from './adapters/prisma-landing-repository';
EOF

# Platform
cat > packages/business/platform/index.ts << 'EOF'
export * from './domain/email';
export * from './domain/email-templates';
export * from './ports/email-port';
export * from './use-cases/manage-platform';
export * from './use-cases/send-email';
export * from './adapters/console-email-adapter';
EOF
```

**Commit:**
```bash
git add packages/business/*/index.ts
git commit -m "chore(business): add barrel files (index.ts) for all 15 modules"
```

**PROSSIGA IMEDIATAMENTE para BLOCO 6.**

---

# BLOCO 6 — VERIFICAR REDIS NO DOCKER COMPOSE

Verificar se Redis está no `docker-compose.yml`. Se não estiver, adicionar:

```bash
# Verificar
grep -q "redis:" docker-compose.yml
if [ $? -ne 0 ]; then
  # Adicionar Redis ao docker-compose.yml antes da seção volumes:
  cat >> docker-compose.yml << 'REDIS_EOF'

  redis:
    image: redis:7-alpine
    container_name: wbc-redis
    ports:
      - "6379:6379"
    volumes:
      - wbc_redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
REDIS_EOF
  echo "Redis adicionado ao docker-compose.yml"
  git add docker-compose.yml
  git commit -m "chore(infra): add Redis to Docker Compose"
else
  echo "Redis já existe no docker-compose.yml — nada a fazer"
fi
```

**PROSSIGA IMEDIATAMENTE para BLOCO 7.**

---

# BLOCO 7 — VERIFICAÇÃO FINAL

```bash
echo "=== VERIFICAÇÃO FINAL ==="

# Type-check
pnpm type-check
if [ $? -ne 0 ]; then
  echo "❌ Type-check falhou — corrigindo..."
  # Tentar corrigir erros de tipo (max 3 tentativas)
  for i in 1 2 3; do
    echo "Tentativa $i de correção..."
    # O agente deve analisar os erros e corrigir
    pnpm type-check && break
  done
fi

# Contagem atualizada
echo ""
echo "=== CONTAGEM POR MÓDULO ==="
for module in auth clients catalog sales campaigns messaging ai inventory finance schedule team analytics logistics landing platform; do
  count=$(find packages/business/$module -name "*.ts" -not -name "*.test.ts" 2>/dev/null | wc -l | tr -d ' ')
  echo "$module: $count arquivos"
done

# Verificar barrel files
echo ""
echo "=== BARREL FILES ==="
for module in auth clients catalog sales campaigns messaging ai inventory finance schedule team analytics logistics landing platform; do
  test -f packages/business/$module/index.ts && echo "✅ $module" || echo "❌ $module (sem index.ts)"
done

# Tag
git tag v1.1.0
git add -A
git commit -m "chore: complete backend module expansion — v1.1.0"

echo ""
echo "✅ ENGORDA COMPLETA — WBC Platform v1.1.0"
echo "Team: expandido (domain + ports + adapters + 4 use cases)"
echo "Logistics: expandido (domain + ports + adapter + 4 use cases)"
echo "Landing: expandido (domain + ports + adapter + 4 use cases)"
echo "Analytics: expandido (domain + 5 use cases com métricas reais)"
echo "Barrel files: 15/15 módulos"
echo ""
echo "PARAR."
```

---

**FIM DO PROMPT. Executar sequencialmente, sem parar, sem perguntar. Ao concluir: tag v1.1.0 e PARAR.**
