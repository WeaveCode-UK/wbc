import type { TenantMemberRepository } from '../ports/tenant-member.repository';

export interface UpdateMemberInput {
  memberId: string;
  accountId: string;
  phone?: string;
  displayName?: string;
  avatar?: string;
}

export class UpdateMember {
  constructor(private readonly memberRepo: TenantMemberRepository) {}

  async execute(input: UpdateMemberInput): Promise<void> {
    const member = await this.memberRepo.findById(input.memberId);
    if (!member) throw new Error('Member nao encontrado');
    if (member.accountId !== input.accountId) throw new Error('Unauthorized');
    await this.memberRepo.update(input.memberId, {
      phone: input.phone,
      displayName: input.displayName,
      avatar: input.avatar,
    });
  }
}
