import { router } from "./trpc";
import { authRouter } from "../routers/auth";
import { mfaRouter } from "../routers/mfa";
import { healthRouter } from "../routers/health";
import { clientsRouter } from "../routers/clients";
import { catalogRouter } from "../routers/catalog";
import { salesRouter } from "../routers/sales";
import { inventoryRouter } from "../routers/inventory";
import { financeRouter } from "../routers/finance";
import { analyticsRouter } from "../routers/analytics";
import { messagingRouter } from "../routers/messaging";
import { campaignsRouter } from "../routers/campaigns";
import { aiRouter } from "../routers/ai";
import { scheduleRouter } from "../routers/schedule";
import { teamRouter } from "../routers/team";
import { logisticsRouter } from "../routers/logistics";
import { landingRouter } from "../routers/landing";
import { platformRouter } from "../routers/platform";
// adminRouter removido em 2026-04-28 — ver begin/WBC_SECURITY_REQUIREMENTS_CONTROL_PLANE.md.
// O stub original misturava role intra-tenant (ADMIN) com endpoints cross-tenant
// (DLQ, blacklist global, sessões de outro tenant). Será reescrito atrás de
// platformAdminProcedure quando o control plane for construído.
import { privacyRouter } from "../routers/privacy";
import { loyaltyRouter } from "../routers/loyalty";

export const appRouter = router({
  auth: authRouter,
  // ACH-003: TOTP/MFA enrolment, disable and status endpoints. Login flow
  // enforces the second factor via NextAuth Credentials.authorize.
  mfa: mfaRouter,
  health: healthRouter,
  clients: clientsRouter,
  catalog: catalogRouter,
  sales: salesRouter,
  inventory: inventoryRouter,
  finance: financeRouter,
  analytics: analyticsRouter,
  messaging: messagingRouter,
  campaigns: campaignsRouter,
  ai: aiRouter,
  schedule: scheduleRouter,
  team: teamRouter,
  logistics: logisticsRouter,
  landing: landingRouter,
  platform: platformRouter,
  // ACH-001 compliance-privacidade: LGPD/GDPR data-subject rights endpoints.
  // Currently stubs — see docs/PRIVACY-ENDPOINTS.md.
  privacy: privacyRouter,
  // F11.E08: client-side loyalty programme.
  loyalty: loyaltyRouter,
});

export type AppRouter = typeof appRouter;
