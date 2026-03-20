export interface StockLowPayload { tenantId: string; productId: string; quantity: number; minAlert: number; }
export interface StockDepletedPayload { tenantId: string; productId: string; }
export interface BrandOrderReceivedPayload { tenantId: string; orderId: string; }
