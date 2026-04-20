// ACH-002 codigo-manutenibilidade (revisor follow-up): barrel only exposes
// domain types and ports. Adapters (whatsapp-n1/n2, webhook handler) are
// imported directly by the composition root / webhook entry so the
// transport dependency is explicit, not implicit via the barrel.
export * from "./domain/whatsapp";
export * from "./domain/errors";
export * from "./ports/whatsapp-port";
// Adapters intentionally NOT re-exported.
