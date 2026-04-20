import type {
  WhatsAppPort,
  SendMessageResult,
  SendMessageOptions,
} from "../ports/whatsapp-port";
import { generateDeepLink } from "../domain/whatsapp";

// N1 generates deep links (wa.me) and doesn't talk to Meta, so
// `SendMessageOptions.idempotencyKey` (ACH-016) is accepted to satisfy
// the port but isn't forwarded anywhere — there's no upstream request
// to deduplicate.

export class WhatsAppN1Adapter implements WhatsAppPort {
  async sendText(
    phone: string,
    message: string,
    _opts?: SendMessageOptions,
  ): Promise<SendMessageResult> {
    const link = generateDeepLink(phone, message);
    return { success: true, whatsappLink: link };
  }

  async sendImage(
    phone: string,
    imageUrl: string,
    caption?: string,
    _opts?: SendMessageOptions,
  ): Promise<SendMessageResult> {
    const message = caption ? `${caption}\n${imageUrl}` : imageUrl;
    const link = generateDeepLink(phone, message);
    return { success: true, whatsappLink: link };
  }

  async sendAudio(
    phone: string,
    audioUrl: string,
    _opts?: SendMessageOptions,
  ): Promise<SendMessageResult> {
    const link = generateDeepLink(phone, audioUrl);
    return { success: true, whatsappLink: link };
  }
}
