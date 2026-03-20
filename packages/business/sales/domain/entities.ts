import type { SaleStatus, PayMethod, PayStatus } from './value-objects';
import { CASHBACK_PERCENTAGE, CASHBACK_EXPIRY_DAYS } from './value-objects';

export interface Sale {
  id: string;
  tenantId: string;
  clientId: string;
  status: SaleStatus;
  deliveryDate: Date | null;
  paymentMethod: PayMethod | null;
  discount: number;
  total: number;
  cashbackUsed: number;
  cashbackGenerated: number;
  campaignId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Payment {
  id: string;
  saleId: string;
  installmentNumber: number;
  amount: number;
  dueDate: Date;
  status: PayStatus;
  paidAt: Date | null;
  mercadopagoId: string | null;
  pixQrCode: string | null;
  pixLink: string | null;
  createdAt: Date;
}

export interface Cashback {
  id: string;
  tenantId: string;
  clientId: string;
  amount: number;
  usedAmount: number;
  expiresAt: Date;
  originSaleId: string;
  createdAt: Date;
}

export interface Return {
  id: string;
  saleId: string;
  reason: string;
  refundAmount: number;
  stockUpdated: boolean;
  createdAt: Date;
}

export function calculateCashback(total: number): number {
  return Math.round(total * CASHBACK_PERCENTAGE * 100) / 100;
}

export function getCashbackExpiryDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + CASHBACK_EXPIRY_DAYS);
  return date;
}

export function calculateSaleTotal(items: Array<{ quantity: number; unitPrice: number }>, discount: number, cashbackUsed: number): number {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  return Math.max(0, subtotal - discount - cashbackUsed);
}

export function generateInstallments(total: number, count: number, startDate: Date): Array<{ amount: number; dueDate: Date }> {
  const installmentAmount = Math.round((total / count) * 100) / 100;
  const installments: Array<{ amount: number; dueDate: Date }> = [];
  for (let i = 0; i < count; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    installments.push({
      amount: i === count - 1 ? Math.round((total - installmentAmount * (count - 1)) * 100) / 100 : installmentAmount,
      dueDate,
    });
  }
  return installments;
}
