# DR Runbook — Redis loss (ACH-004)

## Sintomas

- Worker BullMQ reporta erros de conexão.
- `docker compose ps` mostra wbc-redis Restarting ou Unhealthy.
- Filas param de processar (sem novos `job.completed` em Grafana).
- Cache de sessão NextAuth invalidada → logouts em massa.

## Impacto

- **Filas perdidas:** jobs em flight podem ser perdidos (configurações
  atuais não usam AOF/persist por default).
- **Sessões NextAuth:** se usar Redis store (verificar `auth.config.ts`).
- **Rate limiter:** contadores zerados — não bloqueia nada mas perde
  histórico.

## Plano de ação (RTO alvo < 30 min, RPO = jobs em flight)

### Rota A — Redis reiniciável

1. `docker compose -f docker-compose.prod.yml restart redis`
2. Aguardar `healthcheck` verde.
3. Worker se reconecta automaticamente (BullMQ tem retry com backoff).
4. Verificar filas:
   ```bash
   docker exec wbc-redis redis-cli KEYS 'bull:*' | head
   ```

### Rota B — Dados Redis perdidos (volume corrompido)

1. Parar worker: `docker compose stop worker`.
2. Remover volume Redis: `docker volume rm wbc_redis_data`.
3. Subir Redis limpo: `docker compose up -d redis`.
4. **Replay de jobs perdidos** (se possível):
   - WhatsApp webhooks: reenviar via `POST /api/webhooks/whatsapp/replay`
     se a rota existir.
   - Campanhas agendadas: refatorar via `platform.rescheduleAll` ou
     recriar manualmente via UI.
5. Reiniciar worker: `docker compose up -d worker`.
6. Monitorar Grafana pelo retorno de `jobs_processed_total`.

### Rota C — Redis master perdido, Sentinel disponível

Se `docker-compose.sentinel.yml` estiver ativo:

1. Verificar que Sentinel detectou a falha:
   ```bash
   docker exec wbc-redis-sentinel redis-cli -p 26379 SENTINEL masters
   ```
2. Failover automático promove replica a master. App deve seguir
   porque usa URL do Sentinel.
3. Recuperar o ex-master quando possível e ele vira replica.

## Verificação

- `redis-cli PING` → `PONG`.
- Worker `health.ready` → 200.
- `jobs_processed_total` retomando taxa normal em Grafana.
- Login/logout funcionando (se usa Redis session store).

## Prevenção

- Habilitar AOF (`appendonly yes` em `redis.conf`) para persistência
  granular — cross-ref confiabilidade/ACH-005.
- Ativar Sentinel em prod (hoje é overlay opcional).
- Alertar em `redis_up == 0` em Prometheus.
