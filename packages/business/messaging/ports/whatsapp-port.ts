export interface SendMessageResult {
  success: boolean;
  whatsappLink?: string;
  messageId?: string;
}

export interface WhatsAppPort {
  sendText(phone: string, message: string): Promise<SendMessageResult>;
  sendImage(phone: string, imageUrl: string, caption?: string): Promise<SendMessageResult>;
  sendAudio(phone: string, audioUrl: string): Promise<SendMessageResult>;
}
