import { NextResponse, type NextRequest } from "next/server";

// ACH-024 performance-escalabilidade: collector for Web Vitals beacons
// from `web-vitals.ts`. Kept thin — forwards to log aggregator via
// structured console.log (pino picks it up in prod). Metric volume
// is low (~5 per page load), so no batching is needed yet.
//
// Future: forward to Prometheus `Counter`/`Histogram` so Grafana can
// graph p75 LCP per route, or to a hosted RUM service.

export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Log shape chosen so a Loki / Datadog filter like
    //   `metric:LCP value:>2500` lands on the right entries.
    console.log("[web-vitals]", JSON.stringify(body));
  } catch {
    // Silently drop — never turn a vital-report failure into a
    // user-visible error.
  }
  return NextResponse.json({ ok: true }, { status: 202 });
}
