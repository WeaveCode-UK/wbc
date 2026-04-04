import { randomBytes } from 'crypto';
import type { AccountRepository } from '../ports/account.repository';
import type { EmailSender } from '../ports/email-sender.port';

export interface RequestEmailVerificationInput {
  accountId: string;
}

export class RequestEmailVerification {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly emailSender: EmailSender,
  ) {}

  async execute(input: RequestEmailVerificationInput): Promise<void> {
    const account = await this.accountRepo.findById(input.accountId);
    if (!account) throw new Error('Account nao encontrada');
    if (account.isEmailVerified()) return; // Ja verificado

    const token = randomBytes(32).toString('hex');
    // TODO: salvar token com expiracao no Redis
    const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;

    await this.emailSender.send({
      to: account.email,
      subject: 'Confirme seu email — WBC',
      html: `<p>Clique no link para confirmar seu email:</p>
             <p><a href="${verifyUrl}">Confirmar email</a></p>`,
    });
  }
}
