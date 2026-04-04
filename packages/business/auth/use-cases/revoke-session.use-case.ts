import type { SessionRepository } from '../ports/session.repository';

export interface RevokeSessionInput {
  sessionId: string;
  accountId: string;
}

export class RevokeSession {
  constructor(private readonly sessionRepo: SessionRepository) {}

  async execute(input: RevokeSessionInput): Promise<void> {
    const session = await this.sessionRepo.findById(input.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    if (session.accountId !== input.accountId) {
      throw new Error('Unauthorized');
    }
    await this.sessionRepo.delete(input.sessionId);
  }
}
