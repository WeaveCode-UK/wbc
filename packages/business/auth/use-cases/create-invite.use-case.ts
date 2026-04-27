import { randomBytes } from "crypto";
import type { InviteRepository } from "../ports/invite.repository";
import type { EmailSender } from "../ports/email-sender.port";
import type { Role } from "../domain/entities/tenant-member.entity";
import { escapeHtml } from "@wbc/shared";

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

  async execute(
    input: CreateInviteInput,
  ): Promise<{ inviteId: string; token: string }> {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    const invite = await this.inviteRepo.create({
      tenantId: input.tenantId,
      email: input.email.trim().toLowerCase(),
      role: input.role,
      invitedBy: input.invitedBy,
      token,
      expiresAt,
    });

    // ACH-053: tenantName is admin-controlled and goes straight into the
    // recipient's inbox. Escape it (and the URL token) before interpolating
    // so a name like `</a><script>...` cannot turn the legitimate invite
    // email into a phishing landing for the recipient.
    const inviteUrl = `${process.env.NEXTAUTH_URL}/invite?token=${encodeURIComponent(token)}`;
    const safeTenantName = escapeHtml(input.tenantName);
    await this.emailSender.send({
      to: input.email,
      subject: `Convite para ${input.tenantName}`,
      html: `<p>Voce foi convidado(a) para o time de <strong>${safeTenantName}</strong>.</p>
             <p><a href="${inviteUrl}">Aceitar convite</a></p>
             <p>Este convite expira em 7 dias.</p>`,
    });

    return { inviteId: invite.id, token };
  }
}
