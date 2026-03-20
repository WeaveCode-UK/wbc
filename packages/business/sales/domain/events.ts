export interface SaleCreatedPayload { tenantId: string; saleId: string; clientId: string; status: string; }
export interface SaleConfirmedPayload { tenantId: string; saleId: string; clientId: string; total: number; items: Array<{ productId: string; quantity: number }>; }
export interface SaleDeliveredPayload { tenantId: string; saleId: string; clientId: string; }
export interface SaleCancelledPayload { tenantId: string; saleId: string; }
export interface SaleStatusChangedPayload { tenantId: string; saleId: string; oldStatus: string; newStatus: string; }
export interface PaymentReceivedPayload { tenantId: string; saleId: string; paymentId: string; amount: number; }
export interface PaymentOverduePayload { tenantId: string; saleId: string; paymentId: string; clientId: string; amount: number; }
export interface CashbackGeneratedPayload { tenantId: string; clientId: string; amount: number; expiresAt: Date; }
export interface CashbackUsedPayload { tenantId: string; clientId: string; amount: number; }
