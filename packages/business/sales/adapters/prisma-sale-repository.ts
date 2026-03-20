import { prisma } from '@wbc/db';
import type { SaleRepository } from '../ports/sale-repository';
import type { Sale, SaleItem } from '../domain/entities';

export class PrismaSaleRepository implements SaleRepository {
  async findById(tenantId: string, id: string): Promise<(Sale & { items: SaleItem[] }) | null> {
    const sale = await prisma.sale.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
    if (!sale) return null;
    return {
      ...sale,
      discount: Number(sale.discount),
      total: Number(sale.total),
      cashbackUsed: Number(sale.cashbackUsed),
      cashbackGenerated: Number(sale.cashbackGenerated),
      items: sale.items.map((i) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        subtotal: Number(i.subtotal),
      })),
    } as Sale & { items: SaleItem[] };
  }

  async list(tenantId: string, filters: { status?: string; clientId?: string; page: number; limit: number }) {
    const where: Record<string, unknown> = { tenantId };
    if (filters.status) where.status = filters.status;
    if (filters.clientId) where.clientId = filters.clientId;

    const [data, total] = await Promise.all([
      prisma.sale.findMany({ where, skip: (filters.page - 1) * filters.limit, take: filters.limit, orderBy: { createdAt: 'desc' } }),
      prisma.sale.count({ where }),
    ]);

    return {
      data: data.map((s) => ({ ...s, discount: Number(s.discount), total: Number(s.total), cashbackUsed: Number(s.cashbackUsed), cashbackGenerated: Number(s.cashbackGenerated) })) as Sale[],
      total,
    };
  }

  async create(data: { tenantId: string; clientId: string; items: Array<{ productId: string; quantity: number; unitPrice: number }>; paymentMethod?: string; discount?: number; cashbackUsed?: number; campaignId?: string; notes?: string }): Promise<Sale> {
    const subtotal = data.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const total = Math.max(0, subtotal - (data.discount ?? 0) - (data.cashbackUsed ?? 0));

    const sale = await prisma.sale.create({
      data: {
        tenantId: data.tenantId,
        clientId: data.clientId,
        paymentMethod: data.paymentMethod as 'CASH' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'INSTALLMENT' | 'BANK_TRANSFER' | 'OTHER' | undefined,
        discount: data.discount ?? 0,
        total,
        cashbackUsed: data.cashbackUsed ?? 0,
        campaignId: data.campaignId,
        notes: data.notes,
        items: {
          create: data.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            subtotal: i.quantity * i.unitPrice,
          })),
        },
      },
    });

    return { ...sale, discount: Number(sale.discount), total: Number(sale.total), cashbackUsed: Number(sale.cashbackUsed), cashbackGenerated: Number(sale.cashbackGenerated) } as Sale;
  }

  async updateStatus(tenantId: string, id: string, status: string): Promise<Sale> {
    const sale = await prisma.sale.update({
      where: { id },
      data: { status: status as 'DRAFT' | 'CONFIRMED' | 'SEPARATED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' },
    });
    return { ...sale, discount: Number(sale.discount), total: Number(sale.total), cashbackUsed: Number(sale.cashbackUsed), cashbackGenerated: Number(sale.cashbackGenerated) } as Sale;
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await prisma.sale.delete({ where: { id } });
  }
}
