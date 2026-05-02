// ACH-024 performance-escalabilidade: Web Vitals RUM reporter.
//
// Sentry's `tracesSampleRate` catches server performance but misses
// the user-perceived numbers: CLS (layout shift), LCP (largest
// contentful paint), FID/INP (interaction delay). This hook reports
// each vital metric once per page lifecycle to `/api/vitals` — or to
// Sentry when `Sentry.metrics` is available.
//
// The package (`web-vitals`) is imported lazily so builds without it
// installed still work. Install via:
//   pnpm --filter @wbc/web add web-vitals

import type { ReactNode } from "react";

type VitalMetric = {
  id: string;
  name: "CLS" | "LCP" | "FID" | "INP" | "FCP" | "TTFB";
  value: number;
  delta: number;
  rating: "good" | "needs-improvement" | "poor";
  navigationType?: string;
};

async function loadVitals(): Promise<{
  onCLS: (cb: (m: VitalMetric) => void) => void;
  onLCP: (cb: (m: VitalMetric) => void) => void;
  onINP: (cb: (m: VitalMetric) => void) => void;
  onFCP: (cb: (m: VitalMetric) => void) => void;
  onTTFB: (cb: (m: VitalMetric) => void) => void;
} | null> {
  try {
    // F11.E21: web-vitals is now an installed dep but kept behind a
    // dynamic import so a future removal still degrades gracefully.
    return (await import("web-vitals")) as unknown as Awaited<
      ReturnType<typeof loadVitals>
    >;
  } catch {
    return null;
  }
}

function sendToBeacon(metric: VitalMetric): void {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
    path: location.pathname,
    ts: Date.now(),
  });
  // `navigator.sendBeacon` survives page unloads, which is when TTFB
  // / LCP often fire. Fallback to fetch keepalive for browsers
  // without beacon (rare).
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/vitals", body);
    return;
  }
  void fetch("/api/vitals", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
  });
}

let started = false;

/** Wire every vital once per page; idempotent across route changes. */
export async function startWebVitals(): Promise<void> {
  if (started || typeof window === "undefined") return;
  const vitals = await loadVitals();
  if (!vitals) return;
  started = true;
  vitals.onCLS(sendToBeacon);
  vitals.onLCP(sendToBeacon);
  vitals.onINP(sendToBeacon);
  vitals.onFCP(sendToBeacon);
  vitals.onTTFB(sendToBeacon);
}

/** Small client component to drop into `app/layout.tsx`. */
export function WebVitalsReporter(): ReactNode {
  if (typeof window !== "undefined") {
    void startWebVitals();
  }
  return null;
}
