import { createHash } from 'crypto';
import type { SessionRepository } from '../ports/session.repository';

export interface RefreshSessionInput {
  refreshToken: string;
}

export interface RefreshSessionOutput {
  sessionId: string;
  accountId: string;
  tenantId: string | null;
  expiresAt: Date;
}

export class RefreshSession {
  constructor(private readonly sessionRepo: SessionRepository) {}

  async execute(input: RefreshSessionInput): Promise<RefreshSessionOutput> {
    const tokenHash = createHash('sha256').update(input.refreshToken).digest('hex');
    const session = await this.sessionRepo.findByTokenHash(tokenHash);

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.isExpired()) {
      await this.sessionRepo.delete(session.id);
      throw new Error('Session expired');
    }

    // Sliding window: extend by 30 days on each use
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.sessionRepo.updateLastUsed(session.id, newExpiresAt);

    return {
      sessionId: session.id,
      accountId: session.accountId,
      tenantId: session.tenantId,
      expiresAt: newExpiresAt,
    };
  }
}
