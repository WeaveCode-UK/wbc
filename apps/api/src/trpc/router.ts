import { router } from './trpc';
import { authRouter } from '../routers/auth';
import { healthRouter } from '../routers/health';
import { clientsRouter } from '../routers/clients';

export const appRouter = router({
  auth: authRouter,
  health: healthRouter,
  clients: clientsRouter,
});

export type AppRouter = typeof appRouter;
