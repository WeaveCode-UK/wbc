import { auth } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

const publicPaths = [
  "/login",
  "/register",
  "/reset-password",
  "/verify-email",
  "/invite",
  "/api/auth",
];

const isProduction = process.env.NODE_ENV === "production";

/**
 * ACH-011: emit a per-request CSP nonce and tighten the policy in production
 * so it no longer depends on `'unsafe-inline'`. Next.js automatically
 * propagates the nonce into the streamed `<script>` tags it generates when
 * the `x-nonce` header is present on the request — see Next.js docs on
 * "CSP nonces with App Router".
 */
function buildCsp(nonce: string): string {
  const scriptSrc = isProduction
    ? `'self' 'nonce-${nonce}' 'strict-dynamic'`
    : "'self' 'unsafe-inline' 'unsafe-eval'";
  const styleSrc = isProduction
    ? `'self' 'nonce-${nonce}'`
    : "'self' 'unsafe-inline'";
  // ACH-040: when the runtime sets CSP_REPORT_URI/CSP_REPORT_TO, plumb the
  // CSP violations to the SRE collector so we see real-world XSS attempts.
  // Both directives are emitted in tandem so legacy Chromium still reports
  // while modern browsers prefer report-to (group "csp-endpoint").
  const reportDirectives: string[] = [];
  if (process.env.CSP_REPORT_URI) {
    reportDirectives.push(`report-uri ${process.env.CSP_REPORT_URI}`);
  }
  if (process.env.CSP_REPORT_TO) {
    reportDirectives.push(`report-to ${process.env.CSP_REPORT_TO}`);
  }
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    "img-src 'self' data: blob: https://*.googleusercontent.com https://*.gravatar.com",
    "font-src 'self' data:",
    "connect-src 'self' wss: https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...reportDirectives,
  ].join("; ");
}

function applyCspHeaders(req: NextRequest): NextResponse {
  const nonce = Buffer.from(
    crypto.getRandomValues(new Uint8Array(18)),
  ).toString("base64");
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", buildCsp(nonce));

  // ACH-040: Report-To group definition. Browsers buffer violations and
  // POST them to `endpoints[].url` after the page exits.
  if (process.env.CSP_REPORT_TO_ENDPOINT) {
    response.headers.set(
      "Report-To",
      JSON.stringify({
        group: "csp-endpoint",
        max_age: 10886400,
        endpoints: [{ url: process.env.CSP_REPORT_TO_ENDPOINT }],
      }),
    );
  }

  // ACH-041: Cross-Origin isolation. Prevents a window opener from reading
  // page state and stops cross-origin embedding of static resources.
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  // ACH-042: complete Permissions-Policy whitelist. The previous middleware
  // emitted no policy at all; the explicit-deny list below is the OWASP
  // baseline plus the WBC-specific opt-outs.
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

  return response;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return applyCspHeaders(req);
  }
  // ACH-039: previously /_next and /api skipped header injection entirely.
  // /_next assets benefit from CSP/X-Content-Type-Options/COOP/CORP just
  // as the rendered pages do (a stale chunk on a CDN must not leak as a
  // module via cross-origin embedding); /api routes inherit the same
  // baseline so JSON responses also carry the hardening headers.
  if (pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return applyCspHeaders(req);
  }

  const token = req.auth;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  const user = token.user as Record<string, unknown> | undefined;
  if (user?.needsOnboarding && pathname !== "/onboarding")
    return NextResponse.redirect(new URL("/onboarding", req.url));
  if (user?.needsWorkspaceSelection && pathname !== "/workspace")
    return NextResponse.redirect(new URL("/workspace", req.url));
  if (pathname === "/login" || pathname === "/register")
    return NextResponse.redirect(new URL("/dashboard", req.url));

  return applyCspHeaders(req);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
