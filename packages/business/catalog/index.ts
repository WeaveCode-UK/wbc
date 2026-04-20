// ACH-002 codigo-manutenibilidade (revisor follow-up): barrel only exposes
// domain types and ports. Adapters are implementation details — import them
// directly from the explicit path (`@wbc/business/catalog/adapters/<name>`)
// from the composition root, not via this barrel.
export * from "./domain/entities";
export * from "./domain/errors";
export * from "./ports/brand-repository";
export * from "./ports/product-repository";
export * from "./ports/showcase-repository";
// Adapters intentionally NOT re-exported.
