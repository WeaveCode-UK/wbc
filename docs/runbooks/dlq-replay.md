# Runbook — DLQ replay

## Trigger

- Cenário operacional (não alerta): eventos acumulados na DLQ após provider cair/bug pontual. Precisamos reprocessá-los após a causa raiz estar resolvida.
- Relacionado: [dlq-growing.md](dlq-growing.md) (detecção), [outbox-lag.md](outbox-lag.md) (sintoma comum).

## Pré-requisitos

- Causa raiz **resolvida** (senão, o replay vai re-falhar). Confirmar:
  - Provider externo saudável (WA/DeepSeek/Resend).
  - Bug no handler corrigido e deployado.
  - Quotas/credenciais válidas.

## Diagnóstico antes de replay

1. Volume atual da DLQ:
   ```sql
   SELECT topic, count(*) AS dlq_size, min(created_at) AS oldest
   FROM outbox_events
   WHERE status = 'DLQ'
   GROUP BY topic
   ORDER BY dlq_size DESC;
   ```
2. Amostra de 5 eventos para verificar que o payload é válido:
   ```sql
   SELECT id, topic, payload, error, attempts
   FROM outbox_events
   WHERE status = 'DLQ'
   ORDER BY created_at DESC
   LIMIT 5;
   ```
3. Se o `error` indica problema diferente do esperado — pausar; investigar antes de replay em massa.

## Replay

### Opção A — Via SQL (preferido para volumes < 10k)

```sql
-- Move DLQ → PENDING, zera attempts. Idempotência na ingestão cobre duplicatas.
UPDATE outbox_events
SET status = 'PENDING',
    attempts = 0,
    error = NULL,
    processed_at = NULL
WHERE status = 'DLQ'
  AND topic = '<topic>'  -- ou remova este filtro para replay de tudo
  AND created_at >= '2026-04-20';  -- limite o blast radius
```

### Opção B — Em lotes (volumes grandes)

Para > 10k eventos, replay em lotes de 1k a cada 30s evita throttle no provider:

```sql
-- Substitua 1000 por um lote menor se o provider tem rate limit mais apertado
UPDATE outbox_events
SET status = 'PENDING', attempts = 0, error = NULL, processed_at = NULL
WHERE id IN (
  SELECT id FROM outbox_events
  WHERE status = 'DLQ'
  ORDER BY created_at
  LIMIT 1000
);
```

Repetir a cada 30s até `status='DLQ'` ser zero. Monitorar DLQ crescendo de novo (= causa raiz NÃO resolvida — parar).

## Validação pós-replay

- Lag do outbox deve subir temporariamente e depois voltar ao normal em < 10 min.
- DLQ volta a decrescer.
- Nenhuma nova "wave" de erros nos logs do worker.
- Idempotência: `ProcessedEvent.idempotencyKey` previne efeito duplicado no handler — consultar tabela `processed_events` para confirmar que eventos não são aplicados 2x.

## Rollback

Se o replay provocar nova cascata de erros:

1. Pausar o worker: `docker compose stop worker`.
2. Mover eventos de volta para DLQ:
   ```sql
   UPDATE outbox_events SET status = 'DLQ'
   WHERE status IN ('PENDING','PROCESSING') AND attempts > 0
     AND updated_at >= '<timestamp-do-replay>';
   ```
3. Investigar. Reiniciar worker só após diagnóstico.

## Post-mortem

Se replay foi necessário > 1x no mês no mesmo topic:

- Circuit breaker está aberto o suficiente?
- Timeout do handler está correto?
- Precisa de retry exponencial no handler antes de mandar para DLQ?

## Referências

- Fluxo de outbox: `docs/architecture/events.md`.
- ADR-007 Resilience strategies: `docs/adr/007-resilience-strategies.md`.

---

_Última revisão: 2026-04-24 · Próxima revisão esperada: 2026-07-24_
