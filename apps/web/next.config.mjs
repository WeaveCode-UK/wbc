import { withSentryConfig } from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// ACH-017 performance-escalabilidade: bundle analyzer opt-in via
// `ANALYZE=1 pnpm --filter @wbc/web build`. Keeps prod builds fast
// while giving a one-command path to inspect chunk sizes on a PR.
// The dep (`@next/bundle-analyzer`) is lazy-loaded so the import is
// a no-op when ANALYZE isn't set — if the package isn't installed
// locally, the plain config returns unmodified.
async function maybeWithBundleAnalyzer(config) {
  if (process.env.ANALYZE !== '1' && process.env.ANALYZE !== 'true') {
    return config;
  }
  try {
    const mod = await import('@next/bundle-analyzer');
    const withBundleAnalyzer = mod.default({ enabled: true });
    return withBundleAnalyzer(config);
  } catch {
    // Package not installed — document the install in the README.
    return config;
  }
}

// ACH-011: Content-Security-Policy is now emitted per-request by the
// middleware (apps/web/src/middleware.ts) so it can carry a fresh nonce.
// `next.config.mjs` only sets the static security headers; the policy
// itself is added by the middleware's `applyCspHeaders` for every matched
// route.
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@wbc/ui', '@wbc/shared', '@wbc/validators', '@wbc/i18n'],
  // ACH-022 performance-escalabilidade: when a CDN fronts the app,
  // point `_next/static/*` at it via `CDN_URL` so global users pull
  // chunks from the nearest edge instead of the single nginx host.
  // Absent → served locally (dev / small deploys).
  assetPrefix: process.env.CDN_URL || undefined,
  async headers() {
    const allowedOrigin = process.env.AUTH_URL ?? 'http://localhost:3000';
    return [
      { source: '/(.*)', headers: securityHeaders },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: allowedOrigin },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ];
  },
};

// Compose: withNextIntl → (maybe)analyzer → withSentry.
const composed = await maybeWithBundleAnalyzer(withNextIntl(nextConfig));

export default withSentryConfig(composed, {
  silent: true,
  disableLogger: true,
});
