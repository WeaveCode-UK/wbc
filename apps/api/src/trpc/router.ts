import { router } from './trpc';
import { authRouter } from '../routers/auth';
import { healthRouter } from '../routers/health';
import { clientsRouter } from '../routers/clients';
import { catalogRouter } from '../routers/catalog';
import { salesRouter } from '../routers/sales';
import { inventoryRouter } from '../routers/inventory';
import { financeRouter } from '../routers/finance';
import { analyticsRouter } from '../routers/analytics';
import { messagingRouter } from '../routers/messaging';
import { campaignsRouter } from '../routers/campaigns';
import { aiRouter } from '../routers/ai';

export const appRouter = router({
  auth: authRouter,
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
});

export type AppRouter = typeof appRouter;
