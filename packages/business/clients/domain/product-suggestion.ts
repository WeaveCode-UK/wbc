// Pure rule engine for product suggestions based on client beauty profile.
// Sem IA — apenas matching de keywords contra category + description.
// Quando uma fonte real (catálogo da marca, IA do roadmap-ecossistema) entrar,
// o adapter pode trocar essa heurística sem mexer no use-case.

import type { SkinType, HairType } from "./value-objects";

interface SuggestionInput {
  skinType: SkinType | null;
  hairType: HairType | null;
  allergies: string | null;
  preferences: string | null;
}

interface SuggestableProduct {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  isActive: boolean;
}

export interface ProductSuggestion<T extends SuggestableProduct> {
  product: T;
  matchScore: number;
  matchedKeywords: string[];
}

const SKIN_KEYWORDS: Record<SkinType, string[]> = {
  OILY: ["matte", "oil", "oleos", "controle", "purificante", "sebo"],
  DRY: ["hidrat", "moisturi", "ressecad", "nutritive", "balm", "creme rico"],
  COMBINATION: ["balanc", "mista", "equilibr", "leve"],
  NORMAL: ["diari", "neutro", "leve"],
  SENSITIVE: ["sensiv", "hipoaler", "calmant", "gentle", "soothing"],
};

const HAIR_KEYWORDS: Record<HairType, string[]> = {
  STRAIGHT: ["liso", "smoothing", "anti-frizz", "leve"],
  WAVY: ["ondulad", "definicao", "modelador"],
  CURLY: ["cachead", "definicao", "curl", "creme de pentear"],
  COILY: ["crespo", "coily", "umectacao", "co-wash", "manteiga"],
};

function normalise(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); // strip diacritics
}

function tokenise(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(/[\s,;.]+/)
    .map(normalise)
    .filter((tok) => tok.length >= 3);
}

function productHaystack(product: SuggestableProduct): string {
  return normalise(
    [product.name, product.category ?? "", product.description ?? ""].join(" "),
  );
}

function containsAny(haystack: string, needles: string[]): string[] {
  return needles.filter((needle) => haystack.includes(normalise(needle)));
}

export function suggestProductsFor<T extends SuggestableProduct>(
  client: SuggestionInput,
  products: readonly T[],
  limit: number = 5,
): ProductSuggestion<T>[] {
  const allergyTokens = tokenise(client.allergies);
  const preferenceTokens = tokenise(client.preferences);
  const skinKeywords = client.skinType ? SKIN_KEYWORDS[client.skinType] : [];
  const hairKeywords = client.hairType ? HAIR_KEYWORDS[client.hairType] : [];

  const scored: ProductSuggestion<T>[] = [];

  for (const product of products) {
    if (!product.isActive) continue;
    const haystack = productHaystack(product);

    if (allergyTokens.some((tok) => haystack.includes(tok))) {
      continue; // hard filter: allergic ingredient mentioned
    }

    const matchedSkin = containsAny(haystack, skinKeywords);
    const matchedHair = containsAny(haystack, hairKeywords);
    const matchedPreferences = preferenceTokens.filter((tok) =>
      haystack.includes(tok),
    );

    const matchScore =
      matchedSkin.length * 3 +
      matchedHair.length * 3 +
      matchedPreferences.length * 2;

    if (matchScore <= 0) continue;

    scored.push({
      product,
      matchScore,
      matchedKeywords: [...matchedSkin, ...matchedHair, ...matchedPreferences],
    });
  }

  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
}
