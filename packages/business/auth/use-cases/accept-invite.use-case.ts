import type { InviteRepository } from '../ports/invite.repository';
import type { TenantMemberRepository } from '../ports/tenant-member.repository';
import type { AccountRepository } from '../ports/account.repository';

export interface AcceptInviteInput {
  inviteToken: string;
  accountId: string;
  displayName: string;
  phone: string;
}

export interface AcceptInviteOutput {
  memberId: string;
  tenantId: string;
}

export class AcceptInvite {
  constructor(
    private readonly inviteRepo: InviteRepository,
    private readonly memberRepo: TenantMemberRepository,
    private readonly accountRepo: AccountRepository,
  ) {}

  async execute(input: AcceptInviteInput): Promise<AcceptInviteOutput> {
    const invite = await this.inviteRepo.findByToken(input.inviteToken);
    if (!invite) {
      throw new Error('Convite nao encontrado');
    }
    if (invite.status !== 'PENDING') {
      throw new Error('Convite nao esta pendente');
    }
    if (invite.expiresAt < new Date()) {
      await this.inviteRepo.updateStatus(invite.id, 'EXPIRED');
      throw new Error('Convite expirado');
    }

    const account = await this.accountRepo.findById(input.accountId);
    if (!account) {
      throw new Error('Account nao encontrada');
    }
    if (account.email !== invite.email) {
      throw new Error('Email do convite nao corresponde a esta conta');
    }

    // Verificar se Account ja tem membership nesse tenant
    const existingMember = await this.memberRepo.findByAccountAndTenant(input.accountId, invite.tenantId);
    if (existingMember && existingMember.isActive) {
      throw new Error('Voce ja e membro deste workspace');
    }

    // Criar TenantMember
    const member = await this.memberRepo.create({
      accountId: input.accountId,
      tenantId: invite.tenantId,
      role: invite.role,
      phone: input.phone,
      displayName: input.displayName,
    });

    // Atualizar invite
    await this.inviteRepo.updateStatus(invite.id, 'ACCEPTED', new Date());

    return { memberId: member.id, tenantId: invite.tenantId };
  }
}
