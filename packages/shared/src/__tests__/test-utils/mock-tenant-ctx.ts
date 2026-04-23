// ACH-015 testes-qualidade: helper para testes que rodam dentro de
// runWithTenant. Reduz boilerplate e garante consistência nos campos.

export interface MockTenantCtx {
  tenantId: string;
  userId: string;
  role: "CONSULTANT" | "LEADER" | "DIRECTOR" | "ADMIN";
  plan?: string;
}

export function mockTenantCtx(
  overrides: Partial<MockTenantCtx> = {},
): MockTenantCtx {
  return {
    tenantId: overrides.tenantId ?? "test-tenant-a",
    userId: overrides.userId ?? "test-user-1",
    role: overrides.role ?? "CONSULTANT",
    plan: overrides.plan,
  };
}

// Para o "evil twin" pattern (ACH-002): dois ctxs em tenants distintos.
export function mockTenantPair(): {
  alice: MockTenantCtx;
  bob: MockTenantCtx;
} {
  return {
    alice: mockTenantCtx({ tenantId: "tenant-a", userId: "alice" }),
    bob: mockTenantCtx({ tenantId: "tenant-b", userId: "bob" }),
  };
}
