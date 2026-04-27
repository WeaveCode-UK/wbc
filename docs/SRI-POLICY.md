# Subresource Integrity (SRI) policy — ACH-038

The WBC apps currently host every script and stylesheet themselves —
no third-party CDN appears in the rendered HTML. SRI is therefore
**not load-bearing today**. This document captures the policy that
protects us when (not if) a CDN is added later.

## When SRI is required

Any `<script src="https://...">` or `<link rel="stylesheet"
href="https://...">` whose origin is **outside** of:

- `*.weavecode.co.uk`
- `wbc.cdn.weavecode.co.uk`

…must carry an `integrity="sha384-..."` attribute and `crossorigin="anonymous"`.

## How to add a third-party asset

1. Fetch the asset and compute the hash:
   ```bash
   curl -sL https://cdn.example/foo.js | openssl dgst -sha384 -binary | openssl base64 -A
   ```
2. Embed it:
   ```html
   <script
     src="https://cdn.example/foo.js"
     integrity="sha384-AbC123..."
     crossorigin="anonymous"
   ></script>
   ```
3. Add the host to the CSP `script-src` directive in
   `apps/web/src/middleware.ts` (or `apps/landing/src/middleware.ts`).
4. Document the dependency in `docs/THIRD-PARTY-ASSETS.md` (created on
   first use).

## Enforcement

- `apps/web/src/middleware.ts` ships a CSP with `script-src 'self'
'nonce-...'` — anything outside `'self'` will be blocked even if the
  developer forgets the SRI attribute. The CSP is the hard gate; SRI is
  the integrity check on top.
- `apps/landing/src/middleware.ts` mirrors the policy for the marketing
  surface (ACH-037).

## Why we don't preemptively allow-list a CDN

- Bundling locally keeps the supply chain narrow — every dependency is in
  `package-lock.json` / `pnpm-lock.yaml` and goes through `pnpm audit` +
  Trivy.
- Not allow-listing a CDN until we actually need one means the next
  developer has to consciously edit the CSP and SRI policy together,
  which surfaces the decision in code review.
