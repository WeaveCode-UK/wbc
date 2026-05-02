# Performance runbook (F11.E21)

How to measure and what to fix when bundle size or Lighthouse drops below
target.

## Targets

| Metric                    | Target          | Where measured                              |
| ------------------------- | --------------- | ------------------------------------------- |
| First-Load JS (web)       | ≤ 300 KB on `/` | `pnpm --filter @wbc/web build` output table |
| LCP (RUM)                 | ≤ 2.5s p75      | `/api/vitals` aggregated                    |
| CLS (RUM)                 | ≤ 0.1 p75       | `/api/vitals` aggregated                    |
| INP (RUM)                 | ≤ 200ms p75     | `/api/vitals` aggregated                    |
| Lighthouse Performance    | ≥ 90            | `npx lighthouse http://localhost:3000`      |
| Lighthouse Accessibility  | ≥ 90            | same                                        |
| Lighthouse Best Practices | ≥ 90            | same                                        |
| Lighthouse SEO            | ≥ 90            | same                                        |

## Bundle analyzer

`@next/bundle-analyzer` is wired into `apps/web/next.config.mjs` behind the
`ANALYZE` env var, so it stays out of normal builds.

```bash
ANALYZE=1 pnpm --filter @wbc/web build
```

Two HTML reports open at the end (client + server). Anything > 50 KB on the
client chunk that's not React, Next, or NextAuth is a candidate for
`next/dynamic`.

## Lighthouse run

```bash
# In one shell
pnpm --filter @wbc/web build
pnpm --filter @wbc/web start

# In another shell — needs Chrome installed
npx -y lighthouse http://localhost:3000 \
  --output=json --output-path=./.lighthouse-report.json \
  --chrome-flags="--headless"
```

Authenticated routes need a session cookie. Use `--extra-headers` with the
cookie copied from a logged-in browser:

```bash
npx -y lighthouse http://localhost:3000 \
  --extra-headers='{"Cookie":"authjs.session-token=..."}' \
  --output=json --output-path=./.lighthouse-auth.json
```

## Web Vitals (RUM)

Every page reports CLS / LCP / INP / FCP / TTFB to `/api/vitals` via
`navigator.sendBeacon`. The route handler fans them into Sentry when
`Sentry.metrics` is available.

The reporter is mounted once at `apps/web/src/components/web-vitals-client.tsx`
and started inside `app/layout.tsx`. Local dev: open DevTools Console
under `/api/vitals` to see the JSON payloads.

## Lazy-loaded components

Already on demand:

- `FunnelChart` (only `/campaigns/[id]`)

Candidates for the next sweep:

- AI text editor (when wired beyond `/ai`)
- Logistics map (when geocoding lands)
- Promo card SVG render (currently inline; trivial cost so kept eager)

## Known wins

- Replace `<img>` with `next/image` for **real URLs**. Data URLs (QR,
  generated SVGs) cannot use `next/image` — they stay as `<img>` with the
  ESLint rule disabled inline.
- `transpilePackages` already keeps `@wbc/ui`, `@wbc/shared`,
  `@wbc/validators`, `@wbc/i18n` in the same chunk graph as the app.
- The dev process runs Webpack (not Turbopack) because of the i18n dynamic
  import (see CLAUDE.md). Production build uses the same Webpack output, so
  bundle numbers match.

## When something regresses

1. `git bisect` between the last green build and HEAD.
2. Re-run `ANALYZE=1` on both sides to find the chunk that grew.
3. If it's a workspace package, check whether a new top-level `import`
   pulled in a Node-only dep (like `crypto`) into a client component.
4. If it's a node module, look for a deep-imported submodule that's
   tree-shake-hostile (lodash without the `lodash-es` swap, moment.js,
   etc.).
