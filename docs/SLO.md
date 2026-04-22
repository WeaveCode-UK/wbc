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
- 2026-04-22 — formal SLO/SLI section added (ACH-007 observabilidade-operacao):
  error budget, review cadence, Prometheus recording rules mapping.

## SLIs & Prometheus mapping (ACH-007 observabilidade-operacao)

Cada SLO deve ter regra Prometheus derivada em
`deploy/alerts.yml`. Abaixo a fórmula esperada para cada SLI da tabela
acima. Usar `record:` rules para pré-calcular quando os dashboards
consumirem a mesma métrica repetidamente.

| SLI                  | Fórmula                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| Web availability     | `1 - (sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])))`      |
| tRPC p95 queries     | `histogram_quantile(0.95, rate(wbc_trpc_request_duration_seconds_bucket{type="query"}[5m]))`        |
| tRPC p95 mutations   | `histogram_quantile(0.95, rate(wbc_trpc_request_duration_seconds_bucket{type="mutation"}[5m]))`     |
| Outbox lag           | `wbc_outbox_lag_ms`                                                                                 |
| DLQ depth            | `wbc_bullmq_queue_depth{queue=~".*dlq.*"}` + eventos Postgres em status DLQ (ver admin.dlq.list)    |
| Worker readiness     | `avg_over_time(up{job="wbc-worker"}[5m])`                                                           |
| Postgres connections | `wbc_prisma_pool_size / <max_connections>` (max é config do Postgres; definir via env ou recording) |
| Redis memory         | `redis_memory_used_bytes / redis_memory_max_bytes` (requer redis_exporter — follow-up)              |
| LCP / INP            | `wbc_web_vitals_seconds_bucket` (quantile via histogram_quantile)                                   |

## Review cadence expandida

- **Semanal** (segunda): verificar se algum SLO está abaixo do target
  na última semana; se sim, abrir discussão no canal #wbc-alerts.
- **Mensal**: revisar error budget consumido por serviço; ajustar
  targets se tendência consistente (tighten quando consistentemente
  batemos; loosen quando causa ruído repetido sem user impact).
- **Trimestral**: comparar SLOs com contratos/SLAs acordados com
  clientes; revisar com produto.

## Service-level reporting

Dashboard "SLO Overview" (Grafana, ACH-008) consome as recording rules
acima e mostra:

- painel por SLO com linha de target + série atual + banda de erro
- widget de error budget remanescente (gauge)
- lista de alertas ativos relacionados

Se algum SLO ficar sem dashboard equivalente, é um gap — abrir issue.
