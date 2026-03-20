import type { EmailPort } from '../ports/email-port';
import type { EmailMessage } from '../domain/email';
import { randomUUID } from 'crypto';

export class ConsoleEmailAdapter implements EmailPort {
  async send(message: EmailMessage): Promise<{ success: boolean; messageId: string }> {
    const messageId = randomUUID();
    // eslint-disable-next-line no-console
    console.log('=== EMAIL (DEV) ===');
    // eslint-disable-next-line no-console
    console.log(`To: ${message.to}`);
    // eslint-disable-next-line no-console
    console.log(`Subject: ${message.subject}`);
    // eslint-disable-next-line no-console
    console.log(`Body: ${message.text ?? message.html}`);
    // eslint-disable-next-line no-console
    console.log(`MessageId: ${messageId}`);
    // eslint-disable-next-line no-console
    console.log('===================');
    return { success: true, messageId };
  }
}
