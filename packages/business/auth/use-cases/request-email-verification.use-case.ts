import type { AccountRepository } from "../ports/account.repository";
import type { EmailSender } from "../ports/email-sender.port";
import type { AuthTokenStore } from "../ports/auth-token-store.port";

export interface RequestEmailVerificationInput {
  accountId: string;
}

const EMAIL_VERIFICATION_TTL_SECONDS = 24 * 60 * 60; // 24 hours

export class RequestEmailVerification {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly emailSender: EmailSender,
    private readonly tokenStore: AuthTokenStore,
    private readonly appBaseUrl: string = process.env.NEXTAUTH_URL ??
      process.env.AUTH_URL ??
      "",
  ) {}

  async execute(input: RequestEmailVerificationInput): Promise<void> {
    const account = await this.accountRepo.findById(input.accountId);
    if (!account) throw new Error("Account nao encontrada");
    if (account.isEmailVerified()) return; // Já verificado

    await this.tokenStore.revokeAllForAccount({
      accountId: account.id,
      kind: "email-verification",
    });

    const issued = await this.tokenStore.issue({
      accountId: account.id,
      kind: "email-verification",
      ttlSeconds: EMAIL_VERIFICATION_TTL_SECONDS,
    });

    const verifyUrl = `${this.appBaseUrl}/verify-email?token=${issued.token}`;

    await this.emailSender.send({
      to: account.email,
      subject: "Confirme seu email — WBC",
      html: `<p>Clique no link para confirmar seu email:</p>
             <p><a href="${verifyUrl}">Confirmar email</a></p>`,
    });
  }
}
