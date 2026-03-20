import type { WhatsAppPort, SendMessageResult } from '../ports/whatsapp-port';
import { generateDeepLink } from '../domain/whatsapp';

export class WhatsAppN1Adapter implements WhatsAppPort {
  async sendText(phone: string, message: string): Promise<SendMessageResult> {
    const link = generateDeepLink(phone, message);
    return { success: true, whatsappLink: link };
  }

  async sendImage(phone: string, imageUrl: string, caption?: string): Promise<SendMessageResult> {
    const message = caption ? `${caption}\n${imageUrl}` : imageUrl;
    const link = generateDeepLink(phone, message);
    return { success: true, whatsappLink: link };
  }

  async sendAudio(phone: string, audioUrl: string): Promise<SendMessageResult> {
    const link = generateDeepLink(phone, audioUrl);
    return { success: true, whatsappLink: link };
  }
}
