import { router } from './trpc';

// Root router — domain routers will be added during implementation
export const appRouter = router({
  // Placeholder — each module adds its router here
});

export type AppRouter = typeof appRouter;
