import { router } from './trpc';
import { authRouter } from '../routers/auth';
import { healthRouter } from '../routers/health';
import { clientsRouter } from '../routers/clients';
import { catalogRouter } from '../routers/catalog';
import { salesRouter } from '../routers/sales';
import { inventoryRouter } from '../routers/inventory';

export const appRouter = router({
  auth: authRouter,
  health: healthRouter,
  clients: clientsRouter,
  catalog: catalogRouter,
  sales: salesRouter,
  inventory: inventoryRouter,
});

export type AppRouter = typeof appRouter;
