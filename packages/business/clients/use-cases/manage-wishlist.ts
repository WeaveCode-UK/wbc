export interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: number;
  createdAt: Date;
}

export interface WishlistRepository {
  add(clientId: string, productId: string, tenantId: string): Promise<void>;
  remove(clientId: string, productId: string): Promise<void>;
  // F11.E16: list a client's wishlist with product join.
  list(tenantId: string, clientId: string): Promise<WishlistItem[]>;
}

export async function listWishlist(
  tenantId: string,
  clientId: string,
  wishlistRepository: WishlistRepository,
): Promise<WishlistItem[]> {
  return wishlistRepository.list(tenantId, clientId);
}

export async function addToWishlist(
  clientId: string,
  productId: string,
  tenantId: string,
  wishlistRepository: WishlistRepository,
): Promise<void> {
  await wishlistRepository.add(clientId, productId, tenantId);
}

export async function removeFromWishlist(
  clientId: string,
  productId: string,
  wishlistRepository: WishlistRepository,
): Promise<void> {
  await wishlistRepository.remove(clientId, productId);
}
