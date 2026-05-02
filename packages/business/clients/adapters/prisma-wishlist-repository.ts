import { prisma } from "@wbc/db";
import type {
  WishlistItem,
  WishlistRepository,
} from "../use-cases/manage-wishlist";

// F11.E16: Prisma adapter for the client wishlist. Joins with Product
// in the list call so the UI doesn't have to fan out a second query.

export class PrismaWishlistRepository implements WishlistRepository {
  async add(
    clientId: string,
    productId: string,
    tenantId: string,
  ): Promise<void> {
    await prisma.clientWishlist.upsert({
      where: { clientId_productId: { clientId, productId } },
      update: {},
      create: { tenantId, clientId, productId },
    });
  }

  async remove(clientId: string, productId: string): Promise<void> {
    await prisma.clientWishlist.deleteMany({
      where: { clientId, productId },
    });
  }

  async list(tenantId: string, clientId: string): Promise<WishlistItem[]> {
    const rows = await prisma.clientWishlist.findMany({
      where: { tenantId, clientId },
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, name: true, price: true } },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      productId: r.productId,
      productName: r.product.name,
      productPrice: Number(r.product.price),
      createdAt: r.createdAt,
    }));
  }
}
