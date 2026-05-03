"use client";

// Next.js route-segment error boundary for the dashboard. The
// in-tree <ErrorBoundary> in layout.tsx only catches synchronous render
// errors; this file additionally catches errors that bubble up from
// route data fetching, suspense boundaries, and tRPC procedures rendered
// during the segment.

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("DashboardError:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <div className="w-full max-w-[420px] rounded-wc-xl border border-[var(--wc-border)] bg-[var(--wc-bg-elevated)] p-8 text-center shadow-wc-md">
        <span
          aria-hidden="true"
          className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-wc-lg bg-[#FCDBDC] text-[28px] font-semibold text-[#9F2A2D]"
        >
          !
        </span>
        <h2 className="text-[18px] font-semibold tracking-tight text-[var(--wc-fg-1)]">
          Algo se soltou.
        </h2>
        <p className="mx-auto mt-2 max-w-[300px] text-[13px] font-light leading-[1.55] text-[var(--wc-fg-2)]">
          {error?.message ?? "Erro inesperado. Tente novamente."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center justify-center rounded-wc-sm bg-[var(--wc-purple)] px-4 py-2.5 text-[13px] font-medium text-white transition-colors duration-wc-2 hover:bg-[var(--wc-purple-600)] hover:shadow-[0_4px_12px_rgba(129,39,232,0.35)]"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
