#!/usr/bin/env bash
# F11.E29: Lighthouse baseline runner.
#
# Usage:
#   ./scripts/lighthouse-baseline.sh                # uses default URL set
#   ./scripts/lighthouse-baseline.sh https://...    # one-off URL
#
# Pre-reqs:
#   - apps/web running on http://localhost:3000 (pnpm --filter @wbc/web dev)
#   - You are signed in (cookies must be supplied via LIGHTHOUSE_COOKIE).
#     Grab the value of `next-auth.session-token` from devtools, then export:
#       export LIGHTHOUSE_COOKIE='next-auth.session-token=...'
#
# Output:
#   .lighthouse-reports/<slug>-<ISO>.json (gitignored)
#   Summary table printed to stdout.

set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3000}
OUTPUT_DIR=".lighthouse-reports"
mkdir -p "$OUTPUT_DIR"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx not found. Install Node 20+." >&2
  exit 1
fi

URLS=(
  "/"
  "/clients"
  "/sales/new"
  "/campaigns/new"
)

if [[ $# -gt 0 ]]; then
  URLS=("$1")
fi

ts=$(date -u +%Y%m%d-%H%M%S)

for raw in "${URLS[@]}"; do
  slug=$(echo "$raw" | sed 's|/|_|g; s|^_||; s|^$|root|')
  out="$OUTPUT_DIR/${slug:-root}-${ts}.json"
  url="$BASE_URL$raw"
  echo "Running Lighthouse on $url..."
  extra_headers=""
  if [[ -n "${LIGHTHOUSE_COOKIE:-}" ]]; then
    extra_headers="--extra-headers={\"Cookie\":\"$LIGHTHOUSE_COOKIE\"}"
  fi
  npx --yes lighthouse@12 "$url" \
    --output=json \
    --output-path="$out" \
    --quiet \
    --chrome-flags="--headless=new --no-sandbox" \
    $extra_headers || {
      echo "Lighthouse run failed for $url" >&2
      continue
    }
  perf=$(jq -r '.categories.performance.score * 100' "$out")
  a11y=$(jq -r '.categories.accessibility.score * 100' "$out")
  bp=$(jq -r '.categories["best-practices"].score * 100' "$out")
  seo=$(jq -r '.categories.seo.score * 100' "$out")
  printf "%-20s perf=%-5s a11y=%-5s bp=%-5s seo=%-5s\n" "$raw" "$perf" "$a11y" "$bp" "$seo"
done
