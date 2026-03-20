export class MessageSendFailedError extends Error {
  constructor(reason?: string) { super(reason ?? 'Failed to send message'); this.name = 'MessageSendFailedError'; }
}
export class WhatsAppNotConnectedError extends Error {
  constructor() { super('WhatsApp N2 is not connected'); this.name = 'WhatsAppNotConnectedError'; }
}
