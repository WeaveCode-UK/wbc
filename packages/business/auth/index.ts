// ACH-002 codigo-manutenibilidade: the barrel exposes only the hexagonal
// boundary — domain types, ports and use-cases. Adapters are implementation
// details; consumers that need `PrismaAccountRepository` etc. import from
// the explicit adapter path (`@wbc/business/auth/adapters/...`) so the
// dependency shows up in lint / dependency-cruiser output instead of
// hiding behind a generic `@wbc/business/auth` import.
export * from "./domain/index";
export * from "./domain/otp";
export * from "./domain/subscription";
export * from "./domain/errors";
export * from "./ports/index";
export * from "./use-cases/index";
// Adapters intentionally NOT re-exported from this barrel.
