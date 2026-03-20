import type { EmailMessage } from '../domain/email';

export interface EmailPort {
  send(message: EmailMessage): Promise<{ success: boolean; messageId?: string }>;
}
