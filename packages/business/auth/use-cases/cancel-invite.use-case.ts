import type { InviteRepository } from '../ports/invite.repository';

export interface CancelInviteInput {
  inviteId: string;
  tenantId: string;
}

export class CancelInvite {
  constructor(private readonly inviteRepo: InviteRepository) {}

  async execute(input: CancelInviteInput): Promise<void> {
    const invite = await this.inviteRepo.findById(input.inviteId);
    if (!invite) throw new Error('Convite nao encontrado');
    if (invite.tenantId !== input.tenantId) throw new Error('Convite nao pertence a este workspace');
    if (invite.status !== 'PENDING') throw new Error('Convite nao esta pendente');
    await this.inviteRepo.updateStatus(input.inviteId, 'CANCELLED');
  }
}
