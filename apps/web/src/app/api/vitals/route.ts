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

interface WebVitalReport {
  name?: string;
  value?: number;
  id?: string;
  rating?: string;
  navigationType?: string;
  url?: string;
  referrer?: string;
}

// ACH-033 seguranca: previously the body was logged with JSON.stringify(body)
// — leaking the raw URL and Referer (including query strings, which can
// carry session tokens, search terms, PII). Whitelist the metric fields and
// strip query/hash from URLs before logging.
function stripQuery(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    return `${u.origin}${u.pathname}`;
  } catch {
    return undefined;
  }
}

function sanitize(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null) return {};
  const v = body as WebVitalReport;
  return {
    name: typeof v.name === "string" ? v.name : undefined,
    value: typeof v.value === "number" ? v.value : undefined,
    id: typeof v.id === "string" ? v.id : undefined,
    rating: typeof v.rating === "string" ? v.rating : undefined,
    navigationType:
      typeof v.navigationType === "string" ? v.navigationType : undefined,
    url: stripQuery(v.url),
    referrer: stripQuery(v.referrer),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Log shape chosen so a Loki / Datadog filter like
    //   `metric:LCP value:>2500` lands on the right entries.
    console.log("[web-vitals]", JSON.stringify(sanitize(body)));
  } catch {
    // Silently drop — never turn a vital-report failure into a
    // user-visible error.
  }
  return NextResponse.json({ ok: true }, { status: 202 });
}
