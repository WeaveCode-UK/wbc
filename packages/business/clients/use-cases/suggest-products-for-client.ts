import type { ClientRepository } from "../ports/client-repository";
import type { ProductRepository } from "../../catalog/ports/product-repository";
import type { Product } from "../../catalog/domain/entities";
import {
  suggestProductsFor,
  type ProductSuggestion,
} from "../domain/product-suggestion";

export interface SuggestProductsInput {
  tenantId: string;
  clientId: string;
  limit?: number;
}

export async function suggestProductsForClient(
  input: SuggestProductsInput,
  clientRepo: ClientRepository,
  productRepo: ProductRepository,
): Promise<ProductSuggestion<Product>[]> {
  const client = await clientRepo.findById(input.tenantId, input.clientId);
  if (!client) return [];

  const products = await productRepo.list(input.tenantId, {});
  return suggestProductsFor(
    {
      skinType: client.skinType,
      hairType: client.hairType,
      allergies: client.allergies,
      preferences: client.preferences,
    },
    products,
    input.limit ?? 5,
  );
}
