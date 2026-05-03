import { describe, it, expect } from "vitest";
import {
  ProductNotFoundError,
  BrandNotFoundError,
  ShowcaseNotFoundError,
} from "../errors";

// Catalog "not found" family. Optional id arg flips between the two
// message branches — both paths are covered to lock the line coverage.

describe("ProductNotFoundError", () => {
  it("uses the generic message when id is omitted", () => {
    const e = new ProductNotFoundError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("ProductNotFoundError");
    expect(e.message).toBe("Product not found");
  });

  it("includes the product id when provided", () => {
    const e = new ProductNotFoundError("p-123");
    expect(e.message).toBe("Product not found: p-123");
  });
});

describe("BrandNotFoundError", () => {
  it("uses the generic message when id is omitted", () => {
    const e = new BrandNotFoundError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("BrandNotFoundError");
    expect(e.message).toBe("Brand not found");
  });

  it("includes the brand id when provided", () => {
    const e = new BrandNotFoundError("b-9");
    expect(e.message).toBe("Brand not found: b-9");
  });
});

describe("ShowcaseNotFoundError", () => {
  it("uses the generic message when id is omitted", () => {
    const e = new ShowcaseNotFoundError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("ShowcaseNotFoundError");
    expect(e.message).toBe("Showcase not found");
  });

  it("includes the showcase id when provided", () => {
    const e = new ShowcaseNotFoundError("s-42");
    expect(e.message).toBe("Showcase not found: s-42");
  });
});
