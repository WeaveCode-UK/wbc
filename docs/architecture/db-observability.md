# Database Observability (ACH-022 dados-persistencia)

## pg_stat_statements

Enabled via `deploy/postgres/init.sql` (CREATE EXTENSION on fresh
clusters) plus the Postgres command flags:

```yaml
# docker-compose.prod.yml
postgres:
  command:
    - "postgres"
    - "-c"
    - "shared_preload_libraries=pg_stat_statements"
    - "-c"
    - "pg_stat_statements.track=all"
```

Without the `shared_preload_libraries` flag the extension is created
but collects nothing — easy miss when rolling out to a fresh env.

## Weekly snapshot query

Run this in the DB on a weekly cadence (cron or a dashboard panel):

```sql
-- Top 30 statements by total time over the last week.
SELECT
  substring(query, 1, 200) AS query_snippet,
  calls,
  round(total_exec_time::numeric, 1)        AS total_ms,
  round(mean_exec_time::numeric, 2)         AS mean_ms,
  round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 1)
                                            AS percent_of_total
FROM pg_stat_statements
WHERE calls > 10
ORDER BY total_exec_time DESC
LIMIT 30;
```

Save the output; diff week-over-week to spot regressions (a new query
shooting to the top usually means a missing index).

## Reset cadence

`SELECT pg_stat_statements_reset();` after each snapshot so the next
week starts clean. Without the reset, old noisy queries stick around
and mask recent regressions.

## Follow-up

- Grafana datasource pointing at `pg_stat_statements` with a panel
  that graphs the top-10 by mean_exec_time over time.
- Alert rule: any query whose `mean_exec_time` crosses a threshold
  (e.g. 500 ms) for three consecutive scrapes.
- A tiny script (`scripts/pg-stats-weekly.mjs`) that runs the query
  above, writes Markdown to `docs/perf/<date>.md`, and commits it so
  perf trend is reviewable via git history.
