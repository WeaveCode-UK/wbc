import { NextResponse, type NextRequest } from "next/server";

// ACH-037 seguranca: the marketing landing previously shipped with no
// security headers — every CSP / HSTS / X-Frame-Options / Referrer-Policy
// gap that the main app middleware closes was wide open here. This
// middleware mirrors the apps/web policy with the lighter constraints
// appropriate for a static marketing surface (no `connect-src wss:`,
// allow-list for the few CDN hosts the landing uses).
const isProduction = process.env.NODE_ENV === "production";

function buildCsp(nonce: string): string {
  const scriptSrc = isProduction
    ? `'self' 'nonce-${nonce}' 'strict-dynamic'`
    : "'self' 'unsafe-inline' 'unsafe-eval'";
  const styleSrc = isProduction
    ? `'self' 'nonce-${nonce}'`
    : "'self' 'unsafe-inline'";
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    "img-src 'self' data: https://wbc.cdn.weavecode.co.uk",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");
}

// ACH-073 seguranca: simple in-memory token-bucket per-IP. The landing
// is a marketing surface — most traffic is bots / crawlers; we want a
// soft rate limit even before nginx (which is the hard one in
// deploy/nginx.conf). Bucket: 30 requests / 60 s per IP.
const RATE_BUCKET = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 1000;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = RATE_BUCKET.get(ip);
  if (!bucket || now - bucket.windowStart > RATE_WINDOW_MS) {
    RATE_BUCKET.set(ip, { count: 1, windowStart: now });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= RATE_LIMIT;
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}

export function middleware(req: NextRequest): NextResponse {
  // ACH-073: cheap edge throttle. nginx still has the authoritative
  // rate-limit; this catches localhost and dev-runtime traffic.
  const ip = clientIp(req);
  if (!rateLimit(ip)) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  const nonce = Buffer.from(
    crypto.getRandomValues(new Uint8Array(18)),
  ).toString("base64");
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // CSP — primary defense against XSS even on a static page.
  response.headers.set("Content-Security-Policy", buildCsp(nonce));

  // HSTS — only emitted in production where the site is actually HTTPS.
  if (isProduction) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }

  // Defense-in-depth headers.
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "0"); // disabled in modern browsers anyway
  // Permissions-Policy — whitelist of sensors/APIs we don't use.
  response.headers.set(
    "Permissions-Policy",
    [
      "accelerometer=()",
      "camera=()",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "payment=()",
      "usb=()",
      "fullscreen=(self)",
      "interest-cohort=()",
    ].join(", "),
  );
  // Cross-Origin isolation headers.
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
