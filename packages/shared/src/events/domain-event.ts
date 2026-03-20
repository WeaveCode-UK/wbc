export interface DomainEvent<T = unknown> {
  id: string;
  type: string;
  tenantId: string;
  payload: T;
  timestamp: Date;
  version: number;
}

// Event type constants — organized by module
export const EVENTS = {
  // Auth
  TENANT_CREATED: 'tenant.created',
  TENANT_PLAN_CHANGED: 'tenant.plan_changed',
  TENANT_DEACTIVATED: 'tenant.deactivated',

  // Clients
  CLIENT_CREATED: 'client.created',
  CLIENT_UPDATED: 'client.updated',
  CLIENT_IMPORTED: 'client.imported',
  CLIENT_TAGGED: 'client.tagged',
  CLIENT_CLASSIFICATION_CHANGED: 'client.classification_changed',
  CLIENT_GOING_INACTIVE: 'client.going_inactive',

  // Sales
  SALE_CREATED: 'sale.created',
  SALE_CONFIRMED: 'sale.confirmed',
  SALE_DELIVERED: 'sale.delivered',
  SALE_CANCELLED: 'sale.cancelled',
  SALE_STATUS_CHANGED: 'sale.status_changed',

  // Payments
  PAYMENT_RECEIVED: 'payment.received',
  PAYMENT_OVERDUE: 'payment.overdue',
  PAYMENT_PIX_GENERATED: 'payment.pix_generated',

  // Cashback
  CASHBACK_GENERATED: 'cashback.generated',
  CASHBACK_EXPIRING: 'cashback.expiring',
  CASHBACK_USED: 'cashback.used',

  // Campaigns
  CAMPAIGN_CREATED: 'campaign.created',
  CAMPAIGN_DISPATCHED: 'campaign.dispatched',
  CAMPAIGN_COMPLETED: 'campaign.completed',
  CAMPAIGN_RECIPIENT_REPLIED: 'campaign.recipient_replied',

  // Messaging
  MESSAGE_SENT: 'message.sent',
  MESSAGE_FAILED: 'message.failed',
  POSTSALE_STAGE_COMPLETED: 'postsale.stage_completed',

  // Inventory
  STOCK_LOW: 'stock.low',
  STOCK_DEPLETED: 'stock.depleted',
  BRAND_ORDER_RECEIVED: 'brand_order.received',

  // Schedule
  REMINDER_TRIGGERED: 'reminder.triggered',
  APPOINTMENT_UPCOMING: 'appointment.upcoming',

  // Team
  TEAM_MEMBER_ADDED: 'team.member_added',
  TEAM_TASK_CREATED: 'team.task_created',
  TEAM_TASK_APPROVED: 'team.task_approved',

  // AI
  AI_GENERATION_USED: 'ai.generation_used',
  AI_LIMIT_REACHED: 'ai.limit_reached',

  // Logistics
  DELIVERY_SHIPPED: 'delivery.shipped',
  DELIVERY_DELIVERED: 'delivery.delivered',
} as const;

export type EventType = (typeof EVENTS)[keyof typeof EVENTS];
