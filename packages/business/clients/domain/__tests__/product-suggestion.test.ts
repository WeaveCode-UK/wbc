import { describe, it, expect } from "vitest";
import { suggestProductsFor } from "../product-suggestion";

const SAMPLE = {
  matte: {
    id: "p1",
    name: "Matte Foundation",
    category: "skincare",
    description: "Matte finish, oil control for oily skin",
    isActive: true,
  },
  hydrating: {
    id: "p2",
    name: "Hydrating Cream",
    category: "skincare",
    description: "Rich moisturising cream for dry skin",
    isActive: true,
  },
  curl: {
    id: "p3",
    name: "Curl Defining Cream",
    category: "haircare",
    description: "Curl creme de pentear pra cabelos cacheados",
    isActive: true,
  },
  lipstick: {
    id: "p4",
    name: "Lipstick Red",
    category: "makeup",
    description: "Bold red lip color",
    isActive: true,
  },
  retired: {
    id: "p5",
    name: "Old Matte Stick",
    category: "makeup",
    description: "Matte controle oil",
    isActive: false,
  },
};

describe("suggestProductsFor — pure rule engine (item 3)", () => {
  it("returns empty when client has no profile and no preferences", () => {
    const result = suggestProductsFor(
      {
        skinType: null,
        hairType: null,
        allergies: null,
        preferences: null,
      },
      Object.values(SAMPLE),
    );
    expect(result).toEqual([]);
  });

  it("scores skin-matching products higher (oily → matte)", () => {
    const result = suggestProductsFor(
      {
        skinType: "OILY",
        hairType: null,
        allergies: null,
        preferences: null,
      },
      Object.values(SAMPLE),
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]?.product.id).toBe("p1");
    expect(result[0]?.matchedKeywords).toContain("matte");
  });

  it("respects allergies as a hard exclude even when other keywords match", () => {
    const result = suggestProductsFor(
      {
        skinType: "OILY",
        hairType: null,
        allergies: "matte",
        preferences: null,
      },
      Object.values(SAMPLE),
    );
    expect(result.find((s) => s.product.id === "p1")).toBeUndefined();
  });

  it("never suggests an inactive product", () => {
    const result = suggestProductsFor(
      {
        skinType: "OILY",
        hairType: null,
        allergies: null,
        preferences: null,
      },
      [SAMPLE.retired],
    );
    expect(result).toEqual([]);
  });

  it("matches hair-type keywords (curly → curl/cachead)", () => {
    const result = suggestProductsFor(
      {
        skinType: null,
        hairType: "CURLY",
        allergies: null,
        preferences: null,
      },
      Object.values(SAMPLE),
    );
    expect(result[0]?.product.id).toBe("p3");
  });

  it("respects the limit", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      id: `m${i}`,
      name: "Matte Item",
      category: "skincare",
      description: "matte oil control",
      isActive: true,
    }));
    const result = suggestProductsFor(
      { skinType: "OILY", hairType: null, allergies: null, preferences: null },
      many,
      3,
    );
    expect(result).toHaveLength(3);
  });

  it("preferences boost the score when keywords appear in product copy", () => {
    const withPreferences = suggestProductsFor(
      {
        skinType: "OILY",
        hairType: null,
        allergies: null,
        preferences: "matte oil",
      },
      [SAMPLE.matte, SAMPLE.lipstick],
    );
    const withoutPreferences = suggestProductsFor(
      {
        skinType: "OILY",
        hairType: null,
        allergies: null,
        preferences: null,
      },
      [SAMPLE.matte, SAMPLE.lipstick],
    );
    expect(withPreferences[0]?.matchScore).toBeGreaterThan(
      withoutPreferences[0]?.matchScore ?? 0,
    );
  });
});
