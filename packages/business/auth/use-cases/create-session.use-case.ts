import { createHash, randomBytes } from 'crypto';
import type { SessionRepository } from '../ports/session.repository';

export interface CreateSessionInput {
  accountId: string;
  tenantId?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export interface CreateSessionOutput {
  sessionId: string;
  refreshToken: string;
  expiresAt: Date;
}

export class CreateSession {
  constructor(private readonly sessionRepo: SessionRepository) {}

  async execute(input: CreateSessionInput): Promise<CreateSessionOutput> {
    const refreshToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 dias

    const session = await this.sessionRepo.create({
      accountId: input.accountId,
      tenantId: input.tenantId,
      tokenHash,
      expiresAt,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    });

    return {
      sessionId: session.id,
      refreshToken,
      expiresAt,
    };
  }
}
