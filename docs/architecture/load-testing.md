# Load Testing (ACH-026 performance-escalabilidade)

## Why

The `docs/SLO.md` numbers are conservative best-guesses. Without load
tests, we don't know breaking point, saturation, or where the first
bottleneck lives. When the first spike comes, we'll be guessing.

## Tooling

`k6` (Grafana's load tester) — single-binary Go, scripts in
JavaScript, mature scenarios API. Install locally via
`brew install k6` or run in CI container.

## Scripts

- `scripts/load-tests/k6-smoke.js` — smoke test (1 VU, 30 s), the
  minimum bar: does the system respond at all under load.

Planned (follow-up):

- `k6-soak.js` — 20 VUs for 10 min against staging. Surfaces memory
  leaks and connection-pool exhaustion.
- `k6-spike.js` — 0 → 200 VUs over 30 s, hold 1 min, back to 0.
  Tests autoscaling behaviour (once K8s is in).
- `k6-campaign.js` — creates a campaign with 1000 recipients and
  measures end-to-end dispatch time. This is the real product-risk
  flow.

## Running against staging

```bash
BASE_URL=https://staging.seudominio.com.br \
TEST_EMAIL=loadtest@wbc \
TEST_PASSWORD=... \
k6 run scripts/load-tests/k6-smoke.js
```

Never run against production without a maintenance window — load
tests will trigger alerts, consume quota, and exercise failure paths.

## CI (follow-up)

Nightly job in a separate workflow (`load-nightly.yml`):

```yaml
- uses: grafana/k6-action@v0.3.1
  with:
    filename: scripts/load-tests/k6-smoke.js
  env:
    BASE_URL: ${{ secrets.STAGING_URL }}
    TEST_EMAIL: ${{ secrets.LOADTEST_EMAIL }}
    TEST_PASSWORD: ${{ secrets.LOADTEST_PASSWORD }}
```

Publish results to the SLO doc so the month-over-month numbers are
grounded in data rather than promises.
