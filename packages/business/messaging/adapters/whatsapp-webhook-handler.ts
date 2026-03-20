// Meta API webhook handler for message status updates
export interface WhatsAppWebhookPayload {
  entry?: Array<{
    changes?: Array<{
      value?: {
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
        }>;
      };
    }>;
  }>;
}

export function parseWebhookStatuses(payload: WhatsAppWebhookPayload): Array<{ messageId: string; status: string }> {
  const statuses: Array<{ messageId: string; status: string }> = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const status of change.value?.statuses ?? []) {
        statuses.push({ messageId: status.id, status: status.status });
      }
    }
  }

  return statuses;
}
