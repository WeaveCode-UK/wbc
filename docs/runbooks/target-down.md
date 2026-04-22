# Runbook — TargetDown

## Trigger

- Alerta: `TargetDown`
- Expressão: `up == 0`
- Severidade: `critical`
- Janela: `for: 1m`

## Diagnóstico

1. `docker compose ps` — serviço parado/unhealthy?
2. `docker logs wbc-<service> --tail=200`.
3. Último deploy? Crashloop? Health check falhando?

## Mitigação

- Restart do container: `docker compose up -d <service>`.
- Se crashloop: verificar logs, env vars, connectivity (Postgres/Redis).
- Último deploy causou: rollback.

## Rollback

Revert do commit/tag problemático.

## Pós-incidente

- Adicionar health check ou pre-deploy test que teria detectado.
