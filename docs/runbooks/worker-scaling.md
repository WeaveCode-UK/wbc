# Runbook — Escalar worker

## Trigger

- Alerta `BullMQQueueDepthHigh` (fila `waiting > 1000` por 5 min).
- Alerta `OutboxLagHigh` com volume legítimo identificado (campanha em massa, não bug).
- Cenário planejado: envio de campanha para > 10k clientes.

## Diagnóstico

1. Confirmar que a causa é volume (não bug ou provider down) — ver [outbox-lag.md](outbox-lag.md) primeiro.
2. Conferir CPU/RAM do worker: Grafana → "Container resources".
3. Checar throttle upstream (WA/DeepSeek):
   - WA rate limit por tenant: ~80 msgs/s.
   - DeepSeek: varia por plano; checar dashboard.

## Mitigação — horizontal

### Scale up (Docker Compose prod)

```bash
ssh prod "docker compose -f docker-compose.prod.yml up -d --scale worker=3 --no-recreate"
```

Validação:

```bash
docker compose ps | grep worker
# deve mostrar 3 réplicas. BullMQ distribui jobs automaticamente.
```

### Scale down (após pico)

```bash
docker compose -f docker-compose.prod.yml up -d --scale worker=1 --no-recreate
```

> **Atenção graceful shutdown:** worker tem `stop_grace_period: 40s` (ACH-005 confiabilidade-resiliencia). Nunca force `docker kill` durante scale down — jobs in-flight ficam PROCESSING órfãos.

## Mitigação — vertical (concurrency)

Se horizontal não for opção (VPS com CPU limitado):

```bash
# .env.production
WORKER_CONCURRENCY=10   # default: 5
```

Reiniciar worker. `WORKER_CONCURRENCY` controla quantos jobs BullMQ processa em paralelo por réplica.

> **Cuidado:** concurrency alto sem memória adequada → OOMKilled. Monitorar RAM nos primeiros 10 min.

## Rollback

- Horizontal: `--scale worker=1`.
- Vertical: reverter env e restart.

## Post-mortem

Se scaling foi reativo (não planejado) por > 1h:

- Considerar **auto-scaling** (HPA se migrar para Kubernetes).
- Ver ADR-008 — `docs/adr/008-worker-scaling.md` para decisão de longo prazo.

## Referências

- Concurrency: `apps/worker/src/index.ts`.
- BullMQ docs: https://docs.bullmq.io/guide/workers
- Decisão de HPA: `docs/adr/008-worker-scaling.md`.

---

_Última revisão: 2026-04-24 · Próxima revisão esperada: 2026-07-24_
