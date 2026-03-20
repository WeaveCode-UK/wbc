export interface WishlistRepository {
  add(clientId: string, productId: string, tenantId: string): Promise<void>;
  remove(clientId: string, productId: string): Promise<void>;
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
