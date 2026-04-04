import type { EmailSender, EmailMessage } from '../ports/email-sender.port';

export class ResendEmailSender implements EmailSender {
  async send(message: EmailMessage): Promise<void> {
    // Em dev: console.log. Em prod: Resend API.
    if (process.env.NODE_ENV === 'production') {
      // TODO: integrar com Resend API em producao
      console.warn('[EMAIL] Production email sender not yet configured');
    }
    console.log('[EMAIL]', {
      to: message.to,
      subject: message.subject,
      htmlLength: message.html.length,
    });
  }
}
