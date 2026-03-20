import { router } from './trpc';
import { authRouter } from '../routers/auth';
import { healthRouter } from '../routers/health';
import { clientsRouter } from '../routers/clients';
import { catalogRouter } from '../routers/catalog';

export const appRouter = router({
  auth: authRouter,
  health: healthRouter,
  clients: clientsRouter,
  catalog: catalogRouter,
});

export type AppRouter = typeof appRouter;
