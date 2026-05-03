// T-coverage — product CRUD
//
// Products are tenant-scoped via tenantId. Update + delete gate the
// destructive call on a tenant-scoped findById; without it, a hostile
// id from another tenant would silently succeed (or worse, leak the
// existence of cross-tenant rows). We assert each guard fires.
import { describe, it, expect, vi } from "vitest";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getTopProducts,
} from "../manage-products";
import { ProductNotFoundError } from "../../domain/errors";
import type { ProductRepository } from "../../ports/product-repository";
import type { Product } from "../../domain/entities";

function fakeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    tenantId: "t1",
    brandId: "b1",
    name: "Lipstick",
    description: null,
    price: 50,
    costPrice: 20,
    photoUrl: null,
    category: null,
    isCustom: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function repoMock(
  overrides: Partial<ProductRepository> = {},
): ProductRepository {
  return {
    findById: vi.fn().mockResolvedValue(fakeProduct()),
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockImplementation((data) =>
      Promise.resolve({
        ...data,
        id: "p-new",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Product),
    ),
    update: vi
      .fn()
      .mockImplementation((_t, id, data) =>
        Promise.resolve({ ...fakeProduct(), id, ...data }),
      ),
    delete: vi.fn().mockResolvedValue(undefined),
    getTopProducts: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

describe("listProducts", () => {
  it("forwards tenantId + filters verbatim", async () => {
    const repo = repoMock();
    await listProducts("t1", { brandId: "b1", search: "lip" }, repo);
    expect(repo.list).toHaveBeenCalledWith("t1", {
      brandId: "b1",
      search: "lip",
    });
  });
});

describe("createProduct", () => {
  it("delegates to repo.create with the full payload", async () => {
    const repo = repoMock();
    await createProduct(
      {
        tenantId: "t1",
        brandId: "b1",
        name: "New",
        description: null,
        price: 99,
        costPrice: 30,
        photoUrl: null,
        category: null,
        isCustom: false,
        isActive: true,
      },
      repo,
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: "t1", name: "New", price: 99 }),
    );
  });
});

describe("updateProduct", () => {
  it("updates when product exists in the tenant", async () => {
    const repo = repoMock();
    const result = await updateProduct("t1", "p1", { price: 60 }, repo);
    expect(repo.findById).toHaveBeenCalledWith("t1", "p1");
    expect(repo.update).toHaveBeenCalledWith("t1", "p1", { price: 60 });
    expect(result.price).toBe(60);
  });

  it("throws ProductNotFoundError when product doesn't exist", async () => {
    const repo = repoMock({ findById: vi.fn().mockResolvedValue(null) });
    await expect(
      updateProduct("t1", "ghost", { price: 60 }, repo),
    ).rejects.toThrow(ProductNotFoundError);
    expect(repo.update).not.toHaveBeenCalled();
  });
});

describe("deleteProduct", () => {
  it("deletes when product exists in the tenant", async () => {
    const repo = repoMock();
    await deleteProduct("t1", "p1", repo);
    expect(repo.findById).toHaveBeenCalledWith("t1", "p1");
    expect(repo.delete).toHaveBeenCalledWith("t1", "p1");
  });

  it("throws ProductNotFoundError when product is missing", async () => {
    const repo = repoMock({ findById: vi.fn().mockResolvedValue(null) });
    await expect(deleteProduct("t1", "ghost", repo)).rejects.toThrow(
      ProductNotFoundError,
    );
    expect(repo.delete).not.toHaveBeenCalled();
  });
});

describe("getTopProducts", () => {
  it("forwards tenantId + limit verbatim", async () => {
    const repo = repoMock();
    await getTopProducts("t1", 5, repo);
    expect(repo.getTopProducts).toHaveBeenCalledWith("t1", 5);
  });
});
