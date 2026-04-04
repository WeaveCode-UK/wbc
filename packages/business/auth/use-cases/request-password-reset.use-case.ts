import { randomBytes } from 'crypto';
import type { AccountRepository } from '../ports/account.repository';
import type { EmailSender } from '../ports/email-sender.port';

export interface RequestPasswordResetInput {
  email: string;
}

export class RequestPasswordReset {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly emailSender: EmailSender,
  ) {}

  async execute(input: RequestPasswordResetInput): Promise<void> {
    const account = await this.accountRepo.findByEmail(input.email.trim().toLowerCase());
    // Sempre retorna sucesso para nao vazar se o email existe
    if (!account) return;
    if (!account.hasPassword()) return;

    const token = randomBytes(32).toString('hex');
    // TODO: salvar token com expiracao no Redis ou tabela dedicada
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

    await this.emailSender.send({
      to: account.email,
      subject: 'Recuperacao de senha — WBC',
      html: `<p>Clique no link para redefinir sua senha:</p>
             <p><a href="${resetUrl}">Redefinir senha</a></p>
             <p>Este link expira em 1 hora.</p>`,
    });
  }
}
