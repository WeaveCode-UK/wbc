// ACH-002 codigo-manutenibilidade: same rule as auth — barrel exposes the
// hexagonal boundary (domain + ports). Adapters must be imported from the
// explicit `./adapters/<name>` path, only from the composition root.
export * from "./domain/entities";
export * from "./domain/errors";
export * from "./domain/events";
export * from "./domain/value-objects";
export * from "./domain/updatable-fields";
export * from "./ports/client-repository";
export * from "./ports/tag-repository";
// Adapters intentionally NOT re-exported.
