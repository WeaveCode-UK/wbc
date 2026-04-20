import { prisma, Prisma } from "@wbc/db";
import { buildTenantWhere, paginatedQuery } from "@wbc/shared";
import type { SaleRepository } from "../ports/sale-repository";
import type { Sale, SaleItem } from "../domain/entities";
import type { SaleStatus } from "../domain/status";
import {
  computeItemSubtotal,
  computeSaleSubtotal,
  computeSaleTotal,
} from "../domain/value-objects";

// ACH-009 revisor follow-up: use Prisma.*GetPayload instead of
// `as unknown as Record<string, unknown>`. Narrow, auto-generated types
// catch schema drift at compile time instead of silently passing through.
type PrismaSale = Prisma.SaleGetPayload<Record<string, never>>;
type PrismaSaleWithItems = Prisma.SaleGetPayload<{ include: { items: true } }>;
type PrismaSaleItem = PrismaSaleWithItems["items"][number];

function mapSaleFromPrisma(sale: PrismaSale): Sale {
  return {
    ...sale,
    discount: Number(sale.discount),
    total: Number(sale.total),
    cashbackUsed: Number(sale.cashbackUsed),
    cashbackGenerated: Number(sale.cashbackGenerated),
  } as unknown as Sale;
}

function mapSaleItemFromPrisma(item: PrismaSaleItem): SaleItem {
  return {
    ...item,
    unitPrice: Number(item.unitPrice),
    subtotal: Number(item.subtotal),
  } as unknown as SaleItem;
}

export class PrismaSaleRepository implements SaleRepository {
  async findById(
    tenantId: string,
    id: string,
  ): Promise<(Sale & { items: SaleItem[] }) | null> {
    const sale = await prisma.sale.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
    if (!sale) return null;
    return {
      ...mapSaleFromPrisma(sale),
      items: sale.items.map((i) => mapSaleItemFromPrisma(i)),
    } as Sale & { items: SaleItem[] };
  }

  async list(
    tenantId: string,
    filters: {
      status?: string;
      clientId?: string;
      page: number;
      limit: number;
    },
  ) {
    const where = buildTenantWhere(tenantId, {
      status: filters.status,
      clientId: filters.clientId,
    });
    const result = await paginatedQuery<PrismaSale>(
      prisma.sale as never,
      where,
      { page: filters.page, limit: filters.limit },
    );
    return {
      data: result.data.map((s) => mapSaleFromPrisma(s)),
      total: result.total,
    };
  }

  async create(data: {
    tenantId: string;
    clientId: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number }>;
    paymentMethod?: string;
    discount?: number;
    cashbackUsed?: number;
    campaignId?: string;
    notes?: string;
  }): Promise<Sale> {
    const subtotal = computeSaleSubtotal(data.items);
    const total = computeSaleTotal(subtotal, data.discount, data.cashbackUsed);

    const sale = await prisma.sale.create({
      data: {
        tenantId: data.tenantId,
        clientId: data.clientId,
        paymentMethod: data.paymentMethod as
          | "CASH"
          | "PIX"
          | "CREDIT_CARD"
          | "DEBIT_CARD"
          | "INSTALLMENT"
          | "BANK_TRANSFER"
          | "OTHER"
          | undefined,
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
            subtotal: computeItemSubtotal(i.quantity, i.unitPrice),
          })),
        },
      },
    });

    return mapSaleFromPrisma(sale);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: SaleStatus,
  ): Promise<Sale> {
    // ACH-012: status typed as SaleStatus so new values flow through tsc.
    const sale = await prisma.sale.update({
      where: { id },
      data: { status },
    });
    return mapSaleFromPrisma(sale);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await prisma.sale.delete({ where: { id } });
  }
}
