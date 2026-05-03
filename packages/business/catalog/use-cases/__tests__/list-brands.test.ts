// T-coverage — listBrands
//
// Brands are global (system-wide), not tenant-scoped — there is no
// tenantId on the brand row. Use-case is a one-line pass-through; we
// assert it doesn't add any filtering of its own.
import { describe, it, expect, vi } from "vitest";
import { listBrands } from "../list-brands";
import type { BrandRepository } from "../../ports/brand-repository";
import type { Brand } from "../../domain/entities";

const seed: Brand[] = [
  { id: "b1", name: "Natura", logo: null, isSystem: true },
  { id: "b2", name: "Avon", logo: null, isSystem: true },
];

describe("listBrands", () => {
  it("returns the repo payload as-is (no filtering at the use-case)", async () => {
    const repo: BrandRepository = {
      list: vi.fn().mockResolvedValue(seed),
      findById: vi.fn(),
    };
    const out = await listBrands(repo);
    expect(out).toEqual(seed);
    expect(repo.list).toHaveBeenCalledOnce();
  });

  it("returns an empty array when the catalog is empty", async () => {
    const repo: BrandRepository = {
      list: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
    };
    const out = await listBrands(repo);
    expect(out).toEqual([]);
  });
});
