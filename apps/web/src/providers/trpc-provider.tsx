"use client";

// F11.E01 — Mounts QueryClient + tRPC client for the whole app. Sits
// inside SessionProvider so authenticated requests reach the handler with
// the JWT cookie already attached by the browser.
//
// `superjson` is required because procedures return `Date`, `BigInt`, and
// other non-JSON values; the server side already opts in via
// `initTRPC.create({ transformer: superjson })`.
//
// `httpBatchLink` is the default — multiple useQuery calls in the same
// tick are bundled into one HTTP request. Good for the dashboard pages
// that fan out to several procedures at once.

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";

function getBaseUrl(): string {
  if (typeof window !== "undefined") return "";
  if (process.env.AUTH_URL) return process.env.AUTH_URL;
  const port = process.env.PORT ?? 3000;
  return `http://localhost:${port}`;
}

export function TrpcProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            // QA found dashboards stuck on skeletons because the default
            // 3-retry exponential backoff keeps `isLoading` true for ~10s
            // even when the API is failing. One retry is enough to hide
            // a transient blip; beyond that the UI should fall through
            // to its empty/error state so the user isn't left guessing.
            retry: 1,
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    }),
  );

  // tRPC v11: QueryClientProvider must wrap trpc.Provider — the trpc hooks
  // call useQueryClient internally, so the QueryClient context has to be
  // visible at the trpc layer's render boundary.
  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        {children}
      </trpc.Provider>
    </QueryClientProvider>
  );
}
