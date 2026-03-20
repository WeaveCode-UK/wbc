export type SaleStatus = 'DRAFT' | 'CONFIRMED' | 'SEPARATED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PayMethod = 'CASH' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'INSTALLMENT' | 'BANK_TRANSFER' | 'OTHER';
export type PayStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export const CASHBACK_PERCENTAGE = 0.05; // 5%
export const CASHBACK_EXPIRY_DAYS = 90;
