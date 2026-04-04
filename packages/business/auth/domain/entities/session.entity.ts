export interface SessionProps {
  id: string;
  accountId: string;
  tenantId: string | null;
  tokenHash: string;
  expiresAt: Date;
  userAgent: string | null;
  ipAddress: string | null;
  lastUsedAt: Date;
  createdAt: Date;
}

export class Session {
  constructor(private readonly props: SessionProps) {}

  get id(): string { return this.props.id; }
  get accountId(): string { return this.props.accountId; }
  get tenantId(): string | null { return this.props.tenantId; }
  get tokenHash(): string { return this.props.tokenHash; }
  get expiresAt(): Date { return this.props.expiresAt; }
  get userAgent(): string | null { return this.props.userAgent; }
  get ipAddress(): string | null { return this.props.ipAddress; }
  get lastUsedAt(): Date { return this.props.lastUsedAt; }
  get createdAt(): Date { return this.props.createdAt; }

  isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }
}
