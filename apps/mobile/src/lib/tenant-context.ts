// F11.E27: tenant id source for the mobile app. Until auth is fully
// wired the app runs in single-tenant demo mode; this constant is the
// single point of change once a tRPC session lands. Every offline-db
// helper takes a tenantId so the swap is mechanical.

export const DEMO_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export function useTenantId(): string {
  return DEMO_TENANT_ID;
}
