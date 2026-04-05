import { prisma } from '@wbc/db';
import type { StockRepository } from '../ports/stock-repository';
import type { Stock } from '../domain/entities';

export class PrismaStockRepository implements StockRepository {
  async findByProductId(tenantId: string, productId: string): Promise<Stock | null> {
    const stock = await prisma.stock.findFirst({ where: { tenantId, productId } });
    return stock as Stock | null;
  }

  async list(tenantId: string, lowOnly?: boolean): Promise<Stock[]> {
    const where: Record<string, unknown> = { tenantId };
    if (lowOnly) {
      where.quantity = { lte: prisma.stock.fields?.minAlert ?? 0 };
    }
    const stocks = await prisma.stock.findMany({ where, orderBy: { quantity: 'asc' } });
    return stocks as Stock[];
  }

  async updateQuantity(tenantId: string, productId: string, quantity: number): Promise<Stock> {
    const stock = await prisma.stock.update({ where: { productId }, data: { quantity } });
    return stock as Stock;
  }

  async adjustQuantity(tenantId: string, productId: string, adjustment: number): Promise<Stock> {
    const stock = await prisma.stock.update({
      where: { productId },
      data: { quantity: { increment: adjustment } },
    });
    return stock as Stock;
  }

  async decrementForSale(tenantId: string, items: Array<{ productId: string; quantity: number }>): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const stock = await tx.stock.findFirst({ where: { tenantId, productId: item.productId } });
        if (!stock || stock.quantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId}: need ${item.quantity}, have ${stock?.quantity ?? 0}`);
        }
        await tx.stock.update({
          where: { tenantId_productId: { tenantId, productId: item.productId } },
          data: { quantity: { decrement: item.quantity } },
        });
      }
    }, { isolationLevel: 'Serializable' });
  }
}
