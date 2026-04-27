import { prisma } from "@wbc/db";
import type { StockRepository } from "../ports/stock-repository";
import type { Stock } from "../domain/entities";

export class PrismaStockRepository implements StockRepository {
  async findByProductId(
    tenantId: string,
    productId: string,
  ): Promise<Stock | null> {
    const stock = await prisma.stock.findFirst({
      where: { tenantId, productId },
    });
    return stock as Stock | null;
  }

  async list(tenantId: string, lowOnly?: boolean): Promise<Stock[]> {
    const where: Record<string, unknown> = { tenantId };
    if (lowOnly) {
      where.quantity = { lte: prisma.stock.fields?.minAlert ?? 0 };
    }
    const stocks = await prisma.stock.findMany({
      where,
      orderBy: { quantity: "asc" },
    });
    return stocks as Stock[];
  }

  async updateQuantity(
    tenantId: string,
    productId: string,
    quantity: number,
  ): Promise<Stock> {
    if (quantity < 0) {
      throw new Error(`Stock quantity cannot be negative (got ${quantity})`);
    }
    // ACH-025 seguranca: scope by (tenantId, productId) so a leaked
    // productId cannot mutate another tenant's stock row.
    const stock = await prisma.stock.update({
      where: { tenantId_productId: { tenantId, productId } },
      data: { quantity },
    });
    return stock as Stock;
  }

  async adjustQuantity(
    tenantId: string,
    productId: string,
    adjustment: number,
  ): Promise<Stock> {
    // ACH-025 seguranca: previously this allowed arbitrary negative
    // adjustments and missed tenantId in the WHERE — letting any
    // tenant member zero or push another tenant's stock into the
    // negatives. updateMany with the conditional `quantity + adj >= 0`
    // guard is atomic; updated.count==0 means either the row doesn't
    // belong to this tenant or the adjustment would make stock
    // negative.
    const result = await prisma.$queryRaw<
      Array<{ id: string; quantity: number }>
    >`
      UPDATE "Stock"
      SET "quantity" = "quantity" + ${adjustment}
      WHERE "tenantId" = ${tenantId}
        AND "productId" = ${productId}
        AND "quantity" + ${adjustment} >= 0
      RETURNING "id", "quantity"
    `;
    if (result.length === 0) {
      throw new Error(
        `Stock adjustment refused for product ${productId} (would go negative or wrong tenant)`,
      );
    }
    const stock = await prisma.stock.findFirstOrThrow({
      where: { tenantId, productId },
    });
    return stock as Stock;
  }

  async decrementForSale(
    tenantId: string,
    items: Array<{ productId: string; quantity: number }>,
  ): Promise<void> {
    await prisma.$transaction(
      async (tx) => {
        for (const item of items) {
          const stock = await tx.stock.findFirst({
            where: { tenantId, productId: item.productId },
          });
          if (!stock || stock.quantity < item.quantity) {
            throw new Error(
              `Insufficient stock for product ${item.productId}: need ${item.quantity}, have ${stock?.quantity ?? 0}`,
            );
          }
          await tx.stock.update({
            where: {
              tenantId_productId: { tenantId, productId: item.productId },
            },
            data: { quantity: { decrement: item.quantity } },
          });
        }
      },
      { isolationLevel: "Serializable" },
    );
  }
}
