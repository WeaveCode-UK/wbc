import type { TenantMemberRepository } from '../ports/tenant-member.repository';
import type { Role } from '../domain/entities/tenant-member.entity';

export interface UpdateMemberRoleInput {
  callerAccountId: string;
  callerTenantId: string;
  memberId: string;
  newRole: Role;
}

const ROLE_HIERARCHY: Record<Role, number> = {
  CONSULTANT: 0,
  LEADER: 1,
  DIRECTOR: 2,
  ADMIN: 3,
};

export class UpdateMemberRole {
  constructor(private readonly memberRepo: TenantMemberRepository) {}

  async execute(input: UpdateMemberRoleInput): Promise<void> {
    // Buscar role do caller
    const callerMember = await this.memberRepo.findByAccountAndTenant(
      input.callerAccountId,
      input.callerTenantId,
    );
    if (!callerMember) throw new Error('Caller nao e membro deste workspace');

    const callerLevel = ROLE_HIERARCHY[callerMember.role];
    const targetLevel = ROLE_HIERARCHY[input.newRole];

    // Ninguem promove para role >= proprio
    if (targetLevel >= callerLevel) {
      throw new Error('Permissao insuficiente');
    }

    const targetMember = await this.memberRepo.findById(input.memberId);
    if (!targetMember) throw new Error('Membro nao encontrado');
    if (targetMember.tenantId !== input.callerTenantId) throw new Error('Membro nao pertence a este workspace');

    await this.memberRepo.update(input.memberId, { role: input.newRole });
  }
}
