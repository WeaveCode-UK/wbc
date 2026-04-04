import type { SessionRepository } from '../ports/session.repository';

export interface RevokeAllSessionsInput {
  accountId: string;
}

export class RevokeAllSessions {
  constructor(private readonly sessionRepo: SessionRepository) {}

  async execute(input: RevokeAllSessionsInput): Promise<void> {
    await this.sessionRepo.deleteByAccountId(input.accountId);
  }
}
