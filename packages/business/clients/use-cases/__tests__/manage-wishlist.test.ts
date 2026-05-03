// Coverage push — wishlist CRUD pass-throughs.
import { describe, it, expect, vi } from "vitest";
import {
  listWishlist,
  addToWishlist,
  removeFromWishlist,
  type WishlistRepository,
} from "../manage-wishlist";

function repo(): WishlistRepository {
  return {
    list: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  };
}

describe("listWishlist", () => {
  it("forwards (tenantId, clientId) verbatim", async () => {
    const r = repo();
    await listWishlist("t1", "c1", r);
    expect(r.list).toHaveBeenCalledWith("t1", "c1");
  });
});

describe("addToWishlist", () => {
  it("forwards (clientId, productId, tenantId) verbatim", async () => {
    const r = repo();
    await addToWishlist("c1", "p1", "t1", r);
    expect(r.add).toHaveBeenCalledWith("c1", "p1", "t1");
  });
});

describe("removeFromWishlist", () => {
  it("forwards (clientId, productId)", async () => {
    const r = repo();
    await removeFromWishlist("c1", "p1", r);
    expect(r.remove).toHaveBeenCalledWith("c1", "p1");
  });
});
