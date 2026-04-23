# DR Runbook — database corruption (ACH-004)

## Sintomas

- Postgres reclama `invalid page in block` ou `could not read block`.
- `SELECT` de tabela específica falha com `xid is ahead of next_xid`.
- Alerta de Postgres down ou healthcheck falhando consistentemente.
- `pg_dump` quebra no meio.

## Diagnóstico rápido

```bash
docker exec -it wbc-postgres psql -U wbc -d wbc -c "\\l"
docker logs wbc-postgres --tail 200 | grep -Ei 'panic|invalid|could not'
```

## Plano de ação (RTO alvo < 4 h, RPO ≤ 24 h)

### Rota A — corrupção pontual, dados lidos intactos

1. Tentar `REINDEX DATABASE wbc` e `VACUUM FULL` (requer downtime).
2. Se tabela específica, `pg_repack` pode corrigir fragmentação sem downtime.
3. Validar com `CHECKSUM` via `pg_checksums` antes de declarar recuperado.

### Rota B — corrupção grave, restauração completa

1. **Parar workload:**
   ```bash
   docker compose -f docker-compose.prod.yml stop web worker
   ```
2. **Preservar estado atual** (forense):
   ```bash
   docker exec wbc-postgres pg_dumpall -U wbc > ./forensic_$(date +%s).sql
   ```
   (OK falhar — apenas tentativa.)
3. **Baixar último backup válido** (preferir off-site, ver ACH-003):
   ```bash
   aws s3 ls $BACKUP_S3_URL | sort | tail -5
   aws s3 cp "${BACKUP_S3_URL%/}/wbc_YYYYMMDD_HHMMSS.sql.gz" ./restore.sql.gz
   ```
4. **Drop + recreate database:**
   ```bash
   docker exec wbc-postgres psql -U wbc -d postgres -c "DROP DATABASE wbc"
   docker exec wbc-postgres psql -U wbc -d postgres -c "CREATE DATABASE wbc OWNER wbc"
   ```
5. **Restaurar:**
   ```bash
   gunzip -c ./restore.sql.gz | docker exec -i wbc-postgres psql -U wbc -d wbc
   ```
6. **Re-aplicar migrations manuais** (ACH-012) — o tracker `_manual_migrations`
   foi zerado junto com o DB:
   ```bash
   ./deploy/deploy.sh update   # chamar apply_manual_migrations é idempotente
   ```
7. **Reiniciar workload:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d web worker
   ./deploy/deploy.sh update  # para ter wait_for_ready + markers
   ```

## Verificação

- Healthcheck `/api/health` → 200.
- Migrations Prisma e manual ambas em `applied`.
- Sanity query: `SELECT COUNT(*) FROM "Tenant"` retorna valor esperado.
- Smoke test de login + criação de cliente.

## Prevenção

- Manter replicação off-site (ACH-003) e drill semanal (ACH-010).
- Enable `pg_stat_statements` + alerta de erros I/O.
- Checksums ativos no cluster (`initdb --data-checksums` — verificar).
