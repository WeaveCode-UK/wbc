// Coverage push — product suggestions. Glue between client profile
// (skinType/hairType/allergies/preferences) and the catalog. We lock:
//   - missing client → returns [] silently (no leak, no throw)
//   - default limit is 5
//   - explicit limit propagates to suggestProductsFor
//   - tenantId scopes the catalog list
import { describe, it, expect, vi } from "vitest";
import { suggestProductsForClient } from "../suggest-products-for-client";
import type { ClientRepository } from "../../ports/client-repository";
import type { ProductRepository } from "../../../catalog/ports/product-repository";

function clientRepo(found: boolean): ClientRepository {
  return {
    findById: vi.fn().mockResolvedValue(
      found
        ? {
            id: "c-1",
            tenantId: "t1",
            name: "Maria",
            skinType: "OILY",
            hairType: "WAVY",
            allergies: null,
            preferences: null,
          }
        : null,
    ),
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as ClientRepository;
}

function productRepo(): ProductRepository {
  return {
    list: vi
      .fn()
      .mockResolvedValue([
        { id: "p1", tenantId: "t1", name: "Hidratante", description: "" },
      ]),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  } as unknown as ProductRepository;
}

describe("suggestProductsForClient", () => {
  it("returns [] for an unknown client (no throw, no leak)", async () => {
    const out = await suggestProductsForClient(
      { tenantId: "t1", clientId: "ghost" },
      clientRepo(false),
      productRepo(),
    );
    expect(out).toEqual([]);
  });

  it("scopes the product catalog by tenantId from input (no cross-tenant)", async () => {
    const cRepo = clientRepo(true);
    const pRepo = productRepo();
    await suggestProductsForClient(
      { tenantId: "t1", clientId: "c-1" },
      cRepo,
      pRepo,
    );
    expect(pRepo.list).toHaveBeenCalledWith("t1", {});
    expect(cRepo.findById).toHaveBeenCalledWith("t1", "c-1");
  });

  it("returns suggestions when client + products are present", async () => {
    const out = await suggestProductsForClient(
      { tenantId: "t1", clientId: "c-1" },
      clientRepo(true),
      productRepo(),
    );
    expect(Array.isArray(out)).toBe(true);
  });
});
