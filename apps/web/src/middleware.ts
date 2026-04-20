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
  return response;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return applyCspHeaders(req);
  }
  if (pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return NextResponse.next();
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
