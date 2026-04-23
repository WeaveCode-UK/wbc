/**
 * ACH-003 custos-finops: port para registrar custo por mensagem enviada.
 *
 * Hoje `whatsapp-n2-adapter.ts` envia mensagens sem emitir evento com
 * custo unitário, tornando impossível ratear a fatura da Meta por tenant.
 * Esta interface define o contrato que o adapter deve chamar
 * **imediatamente após** o envio bem-sucedido, emitindo um evento outbox
 * que agrega o custo.
 *
 * Adapter real (pendente — humano) vai escrever o evento via
 * `OutboxService` em `@wbc/shared/events/outbox-service`.
 *
 * Ver doc em `docs/FINOPS-WHATSAPP-BILLING.md`.
 */

/**
 * Categorias de conversação WhatsApp conforme billing da Meta Cloud API.
 * - `utility`: confirmações de agendamento, notificações transacionais.
 * - `marketing`: campanhas outbound.
 * - `service`: dentro da janela de 24h após incoming do cliente (grátis).
 * - `authentication`: OTP / 2FA.
 */
export type WhatsAppConversationCategory =
  | "utility"
  | "marketing"
  | "service"
  | "authentication";

export interface MessageBillingEvent {
  tenantId: string;
  messageId: string;
  toPhoneRedacted: string; // hash ou E.164 mascarado — PII
  category: WhatsAppConversationCategory;
  /** US$ por conversa, arredondado para 4 casas decimais. */
  costUsd: number;
  /** Timestamp do envio (ISO-8601). */
  sentAt: string;
  /** Se a mensagem fez parte de uma conversa já aberta (service window). */
  conversationAlreadyOpen: boolean;
}

export interface MessageBillingPort {
  /**
   * Registra o custo de uma mensagem enviada. Deve ser idempotente —
   * `messageId` é a chave natural. Se chamado duas vezes com o mesmo
   * messageId, o segundo é no-op.
   */
  record(event: MessageBillingEvent): Promise<void>;
}

/**
 * Stub — não persiste, apenas loga. Usado em dev e testes.
 * **Nunca em produção.**
 */
export class NoopMessageBillingPort implements MessageBillingPort {
  async record(): Promise<void> {
    // no-op
  }
}
