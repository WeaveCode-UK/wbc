// F11.E01 — Type-safe tRPC client for `apps/web/`. All UI hooks
// (`trpc.<router>.<proc>.useQuery`, `useMutation`) flow from here. The
// actual transport is wired in `providers/trpc-provider.tsx`.
//
// The generic argument `<AppRouter>` plumbs every procedure signature
// from the server through the React hooks, so a refactor in
// `apps/api/src/routers/*.ts` shows up as a TypeScript error in the
// page.tsx that consumes it.

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@wbc/api/src/trpc/router";

export const trpc = createTRPCReact<AppRouter>();
