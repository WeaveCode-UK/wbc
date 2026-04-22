# Runbook — BullMQQueueDepthHigh

## Trigger

- Alerta: `BullMQQueueDepthHigh`
- Expressão: `wbc_bullmq_queue_depth{state="waiting"} > 1000`
- Severidade: `warning`
- Janela: `for: 5m`

## Diagnóstico

1. Grafana > "BullMQ Queue Depth" — qual queue?
2. `/health/ready` do worker → `workers.<queue>.waiting/active/delayed/failed`.
3. Inspect rate de ingestão vs processamento.

## Mitigação

- Escalar worker para a queue afetada (`BULLMQ_CONCURRENCY_<QUEUE>` env se suportado).
- Se for campanha em burst: pausar produção temporária até drenagem (`getCampaignQueue().pause()`).
- Verificar se handler travou (CPU alto, lock Postgres, provider externo).

## Rollback

Raramente. Se for efeito de deploy, revert.

## Pós-incidente

- Validar se `defaultJobOptions.attempts` suficiente (hoje 3).
- Considerar rate-limit BullMQ (messagingQueue já tem `limiter`).
