import type { AccountRepository } from "../ports/account.repository";
import type { EmailSender } from "../ports/email-sender.port";
import type { AuthTokenStore } from "../ports/auth-token-store.port";

export interface RequestPasswordResetInput {
  email: string;
}

const PASSWORD_RESET_TTL_SECONDS = 60 * 60; // 1 hour

export class RequestPasswordReset {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly emailSender: EmailSender,
    private readonly tokenStore: AuthTokenStore,
    /** Base URL used to build the reset link (e.g. https://app.example.com). */
    private readonly appBaseUrl: string = process.env.NEXTAUTH_URL ??
      process.env.AUTH_URL ??
      "",
  ) {}

  async execute(input: RequestPasswordResetInput): Promise<void> {
    const account = await this.accountRepo.findByEmail(
      input.email.trim().toLowerCase(),
    );
    // Always returns success to avoid leaking whether the email exists.
    if (!account) return;
    if (!account.hasPassword()) return;

    // Invalidate any pending reset tokens for this account so a previous
    // request can't be used in parallel with the new one.
    await this.tokenStore.revokeAllForAccount({
      accountId: account.id,
      kind: "password-reset",
    });

    const issued = await this.tokenStore.issue({
      accountId: account.id,
      kind: "password-reset",
      ttlSeconds: PASSWORD_RESET_TTL_SECONDS,
    });

    const resetUrl = `${this.appBaseUrl}/reset-password?token=${issued.token}`;

    await this.emailSender.send({
      to: account.email,
      subject: "Recuperacao de senha — WBC",
      html: `<p>Clique no link para redefinir sua senha:</p>
             <p><a href="${resetUrl}">Redefinir senha</a></p>
             <p>Este link expira em 1 hora.</p>`,
    });
  }
}
