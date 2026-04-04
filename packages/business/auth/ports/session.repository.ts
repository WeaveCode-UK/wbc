import type { Session } from '../domain/entities/session.entity';

export interface CreateSessionInput {
  accountId: string;
  tenantId?: string | null;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface SessionRepository {
  findById(id: string): Promise<Session | null>;
  findByTokenHash(tokenHash: string): Promise<Session | null>;
  findByAccountId(accountId: string): Promise<Session[]>;
  create(input: CreateSessionInput): Promise<Session>;
  updateLastUsed(id: string, expiresAt: Date): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByAccountId(accountId: string): Promise<void>;
  deleteExpired(): Promise<number>;
}
