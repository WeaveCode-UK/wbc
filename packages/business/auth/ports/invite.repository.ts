import type { Role } from '../domain/entities/tenant-member.entity';

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';

export interface InviteData {
  id: string;
  tenantId: string;
  email: string;
  role: Role;
  invitedBy: string;
  token: string;
  status: InviteStatus;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
}

export interface CreateInviteInput {
  tenantId: string;
  email: string;
  role: Role;
  invitedBy: string;
  token: string;
  expiresAt: Date;
}

export interface InviteRepository {
  findById(id: string): Promise<InviteData | null>;
  findByToken(token: string): Promise<InviteData | null>;
  findByTenantId(tenantId: string, status?: InviteStatus): Promise<InviteData[]>;
  create(input: CreateInviteInput): Promise<InviteData>;
  updateStatus(id: string, status: InviteStatus, acceptedAt?: Date): Promise<void>;
  expirePending(): Promise<number>;
}
