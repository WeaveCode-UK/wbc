# Runbook — OutboxLagHigh

## Trigger

- Alerta: `OutboxLagHigh`
- Expressão: `wbc_outbox_lag_ms > 60000`
- Severidade: `warning`
- Janela: `for: 3m`

## Diagnóstico

1. Grafana > WBC Overview > "Outbox Lag" para ver tendência.
2. `SELECT COUNT(*), status FROM "OutboxEvent" GROUP BY status;` no Postgres.
3. Verificar `/health/ready` do worker — `checks.outboxLagMeanMs`.
4. Procurar erros em handlers: logs do worker filtrando `"EventDispatch"` e `"Failed to process outbox event"`.

## Mitigação

- **Worker paused ou crashed**: `docker compose ps worker` → restart se necessário.
- **Provider externo lento**: abrir circuit breaker manualmente (env `WHATSAPP_CIRCUIT_THRESHOLD=1` + restart).
- **Overload**: escalar workers (`docker compose up --scale worker=3`).
- **Backpressure**: middleware `applyOutboxBackpressure` já começa a rejeitar mutations em `sales.confirm` quando lag > 30s; expandir para outras mutations se necessário.

## Rollback

Se recente deploy introduziu regressão: revert.

## Pós-incidente

- Revisar SLO de outbox em docs/SLO.md.
- Adicionar test de carga se for recorrente.
