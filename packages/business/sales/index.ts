// ACH-002 codigo-manutenibilidade (revisor follow-up): barrel only exposes
// domain types, value objects, status enum and ports. Adapters come from
// `@wbc/business/sales/adapters/<name>` directly (composition root).
export * from "./domain/entities";
export * from "./domain/errors";
export * from "./domain/events";
export * from "./domain/value-objects";
export * from "./domain/status";
export * from "./ports/sale-repository";
export * from "./ports/payment-repository";
export * from "./ports/cashback-repository";
// Adapters intentionally NOT re-exported.
