# Service Level Objectives (ACH-001 performance-escalabilidade)

## Goals

First executive-level SLO document. These numbers are the bar ops and
product commit to; when one fires off-target for three consecutive
measurement windows, that's a production incident regardless of
whether users have complained yet.

## Targets

| Service / Path        | SLI                                     | Target    | Window   |
| --------------------- | --------------------------------------- | --------- | -------- |
| Web availability      | % of HTTP 5xx < 1%                      | 99.5%     | 30 days  |
| tRPC p95 latency      | /api/trpc/_.query_ p95                  | ≤ 800 ms  | 5 min    |
| tRPC p95 mutations    | /api/trpc/_.mutation_ p95               | ≤ 1200 ms | 5 min    |
| Outbox lag            | age of oldest PENDING event             | ≤ 30 s    | rolling  |
| DLQ depth             | count of FAILED + DLQ rows              | ≤ 100     | snapshot |
| Worker readiness      | /health/ready 200 rate                  | 99.9%     | 30 days  |
| Postgres connections  | active / max                            | ≤ 80%     | rolling  |
| Redis memory          | used / maxmemory                        | ≤ 70%     | rolling  |
| LCP (Web Vitals, p75) | user-perceived largest contentful paint | ≤ 2500 ms | 30 days  |
| INP (Web Vitals, p75) | interaction to next paint               | ≤ 200 ms  | 30 days  |

## Error budget

- Availability 99.5% over 30 days → **3.6 h budget** per month.
- Consume > 50% in the first two weeks: halt non-critical deploys;
  focus engineering on reliability.

## Alert rules

See `deploy/prometheus-alerts.yml` (ACH-001 follow-up). Stub: alerts
fire only when a target is crossed for three consecutive scrapes to
avoid page-storm on transient spikes.

## Review cadence

Monthly: compare last 30 d numbers against each target, revise when a
target is consistently beaten (tighten) or missed (investigate and
either fix or accept). Record the decision in a dated section below.

## History

- 2026-04-22 — initial targets set (ACH-001 correction). No prior
  measurements; the numbers are conservative best-guesses based on
  current infra. Expect first adjustment after one month of RUM +
  Prometheus data.
