# DR Runbook — disk full (ACH-004)

## Sintomas

- Alerta `NodeFilesystemAlmostOutOfSpace` em Prometheus/Grafana.
- `docker compose logs` mostra erro `no space left on device` ou Postgres
  retorna `could not extend file`.
- Healthcheck de worker falha com "cannot create temporary file".

## Diagnóstico rápido

```bash
# Ranking de maiores consumidores
sudo du -xh --max-depth=2 / 2>/dev/null | sort -h | tail -20

# Volumes Docker
docker system df
docker volume ls
```

## Plano de ação (RTO alvo < 30 min)

1. **Descobrir o top-2 consumidor.** Normalmente: `./backups/`, logs do
   Docker (`/var/lib/docker/containers/*/*.log`), ou Prometheus TSDB
   (`prometheus_data`).
2. **Se backups locais:**
   - Verificar se replicação off-site está OK: `aws s3 ls $BACKUP_S3_URL`.
   - Se sim, apagar locais com > 7 dias: `find ./backups -mtime +7 -delete`.
   - Se NÃO, não apagar — mover para disco externo antes.
3. **Se logs Docker:**
   - `truncate -s 0 /var/lib/docker/containers/*/*.log` (preserva containers).
   - Confirmar que daemon tem `log-opts` com `max-size: 10m` e `max-file: 3`
     em `/etc/docker/daemon.json`. Se não, adicionar e `systemctl restart docker`.
4. **Se Prometheus TSDB:**
   - Reduzir retention: `--storage.tsdb.retention.time=7d` (já está em 30d).
   - Reiniciar prometheus (scraping retoma imediatamente).
5. **Rodar `docker system prune -a --volumes`** se estiver seguro de que
   nenhum volume não-declarado é crítico.

## Verificação

- `df -h` abaixo de 80%.
- Prometheus alert limpa em < 5 min.
- `docker compose ps` todos Up+Healthy.
- Postgres aceita writes: `docker exec wbc-postgres psql -U wbc -c "CREATE TEMP TABLE _t(x int)"`.

## Prevenção

- Alert rule `deploy/alerts.yml` deve disparar em 85%, não só 95%.
- Configurar `logrotate` ou log-driver Docker com rotação.
- Monitorar crescimento de `backups/` e ajustar retention.
