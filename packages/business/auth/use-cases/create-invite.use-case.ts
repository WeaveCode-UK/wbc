import { randomBytes } from 'crypto';
import type { InviteRepository } from '../ports/invite.repository';
import type { EmailSender } from '../ports/email-sender.port';
import type { Role } from '../domain/entities/tenant-member.entity';

export interface CreateInviteInput {
  tenantId: string;
  email: string;
  role: Role;
  invitedBy: string;
  tenantName: string;
}

export class CreateInvite {
  constructor(
    private readonly inviteRepo: InviteRepository,
    private readonly emailSender: EmailSender,
  ) {}

  async execute(input: CreateInviteInput): Promise<{ inviteId: string; token: string }> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    const invite = await this.inviteRepo.create({
      tenantId: input.tenantId,
      email: input.email.trim().toLowerCase(),
      role: input.role,
      invitedBy: input.invitedBy,
      token,
      expiresAt,
    });

    // Enviar email de convite
    const inviteUrl = `${process.env.NEXTAUTH_URL}/invite?token=${token}`;
    await this.emailSender.send({
      to: input.email,
      subject: `Convite para ${input.tenantName}`,
      html: `<p>Voce foi convidado(a) para o time de <strong>${input.tenantName}</strong>.</p>
             <p><a href="${inviteUrl}">Aceitar convite</a></p>
             <p>Este convite expira em 7 dias.</p>`,
    });

    return { inviteId: invite.id, token };
  }
}
