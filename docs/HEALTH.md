# Health Checks — Convenção

ACH-010 observabilidade-operacao. Padroniza `live` / `ready` / `startup` entre `api`, `web` e `worker` para que o orquestrador (Docker Compose, Kubernetes) receba sinais coerentes.

## Níveis

- **live** — processo está vivo? Sempre 200 se o event loop responde.
- **ready** — está pronto para receber tráfego? Só 200 quando dependências críticas estão OK.
- **startup** (opcional, k8s) — ainda inicializando? 503 durante warm-up (composition root + migrations), depois 200.

## Contrato por serviço

### `apps/api` (Node tRPC)

Rota: `/health/live`, `/health/ready`, `/health` (alias para ready).

Checks em `ready`:

- Postgres — `SELECT 1`
- Redis — `PING`
- Outbox lag (via `getOutboxLagMs()`) < threshold

Estado atual: `apps/api/src/routers/health.ts` já implementa — **OK**.

### `apps/web` (Next.js)

Rota: `/api/health` (dinâmica).

Checks:

- Postgres — `SELECT 1`
- Redis — `PING` (adicionar; hoje falta)

Estado atual: só `SELECT 1`. **Gap:** adicionar Redis. Follow-up em `docs/OBSERVABILITY-FOLLOWUP.md`.

### `apps/worker` (BullMQ)

Porta dedicada 9100. Rotas: `/health/live`, `/health/ready`, `/health`, `/metrics` (ACH-001).

Checks em `ready`:

- Outbox lag (EMA sobre 6 samples) ≤ threshold
- Workers BullMQ não pausados
- Queue depth não saturada (adicionar — hoje só reporta, não falha)

Estado atual: `apps/worker/src/health-server.ts` — bom, mas sem failure em queue depth alta.

## Regras gerais

1. `live` nunca toca banco. 200 apenas se o processo responde.
2. `ready` deve ter timeout por dependência (evita travar orquestrador).
3. Estrutura de resposta:
   ```json
   {
     "status": "ok|degraded",
     "checks": { "<dep>": "ok|error" },
     "timestamp": "ISO-8601"
   }
   ```
4. `503` para `degraded`, `200` para `ok`, `500` apenas em bug real.

## Convenção de threshold

- Outbox lag threshold: 60s (worker), 30s (middleware de backpressure — metade do do worker).
- Queue depth warning: 1000 waiting (alerta); readiness fail apenas > 5000.

Ver `docs/SLO.md` para valores oficiais.
