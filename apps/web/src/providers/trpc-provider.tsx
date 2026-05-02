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
import { trpc } from "../lib/trpc";

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

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
