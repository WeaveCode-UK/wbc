export type Role = 'CONSULTANT' | 'LEADER' | 'DIRECTOR' | 'ADMIN';

export interface TenantMemberProps {
  id: string;
  accountId: string;
  tenantId: string;
  role: Role;
  phone: string | null;
  displayName: string | null;
  avatar: string | null;
  isActive: boolean;
  deletedAt: Date | null;
  joinedAt: Date;
  updatedAt: Date;
}

export class TenantMember {
  constructor(private readonly props: TenantMemberProps) {}

  get id(): string { return this.props.id; }
  get accountId(): string { return this.props.accountId; }
  get tenantId(): string { return this.props.tenantId; }
  get role(): Role { return this.props.role; }
  get phone(): string | null { return this.props.phone; }
  get displayName(): string | null { return this.props.displayName; }
  get avatar(): string | null { return this.props.avatar; }
  get isActive(): boolean { return this.props.isActive; }
  get deletedAt(): Date | null { return this.props.deletedAt; }
  get joinedAt(): Date { return this.props.joinedAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }
}
