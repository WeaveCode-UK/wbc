// ACH-002 codigo-manutenibilidade (revisor follow-up): barrel only exposes
// the hexagonal boundary (domain + ports). Adapters — including the
// `sale-confirmed-handler` that wires itself on import — must come from
// the explicit adapter path, invoked by the composition root.
export * from "./domain/entities";
export * from "./domain/errors";
export * from "./domain/events";
export * from "./ports/stock-repository";
export * from "./ports/brand-order-repository";
export * from "./ports/sample-repository";
// Adapters intentionally NOT re-exported.
