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
