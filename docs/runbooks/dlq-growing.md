# Runbook — DLQEventsGrowing

## Trigger

- Alerta: `DLQEventsGrowing`
- Expressão: `increase(wbc_dlq_events_total[5m]) > 10`
- Severidade: `warning`
- Janela: `for: 2m`

## Diagnóstico

1. `pnpm tsx scripts/dlq-replay.ts list --limit=50` — inspecionar eventos em DLQ.
2. Olhar logs do worker filtrando por `"DLQ entry"` nas últimas 15 min.
3. Grafana > WBC Overview > panel "DLQ Events" para ver picos por queue.
4. Correlacionar com alertas concorrentes (OutboxLagHigh, circuit breakers).

## Mitigação

- **Provider externo caiu** (WhatsApp, DeepSeek, MercadoPago): aguardar recuperação + replay via `admin.dlq.replay` (ou CLI) em lote após restauração.
- **Bug no handler**: reverter deploy (ver Rollback abaixo) e replayar DLQ após fix.
- **Carga súbita**: escalar worker horizontalmente; ajustar `BULLMQ_CONCURRENCY`.

## Rollback

Se o alerta começou logo após deploy: revert + re-deploy da versão anterior.

## Pós-incidente

- Registrar causa raiz.
- Se for bug lógico, adicionar teste unitário + métrica específica que detectaria antes.
