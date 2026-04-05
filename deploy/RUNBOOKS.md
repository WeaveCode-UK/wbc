# WBC Platform — Runbooks

## 1. Deploy / Update

```bash
# Primeiro deploy (build + migrate + SSL)
./deploy/deploy.sh first-run

# Atualizar codigo (pull + rebuild + migrate + restart)
./deploy/deploy.sh update

# Renovar SSL manualmente
./deploy/deploy.sh ssl
```

## 2. Backup / Restore

```bash
# Backup manual
./deploy/backup/backup.sh

# Instalar cron diario (3 AM)
./deploy/backup/install-cron.sh

# Restaurar backup
./deploy/backup/restore.sh backups/wbc_20260405_030000.sql.gz
```

## 3. Logs

```bash
# Web logs
docker logs wbc-web --tail 100 -f

# Worker logs
docker logs wbc-worker --tail 100 -f

# Nginx logs
docker logs wbc-nginx --tail 100 -f

# Todos os servicos
docker compose -f docker-compose.prod.yml logs -f
```

## 4. Reiniciar Servicos

```bash
# Reiniciar tudo
docker compose -f docker-compose.prod.yml restart

# Reiniciar apenas web
docker compose -f docker-compose.prod.yml restart web

# Reiniciar apenas worker
docker compose -f docker-compose.prod.yml restart worker
```

## 5. Database

```bash
# Rodar migrations
docker compose -f docker-compose.prod.yml run --rm web npx prisma migrate deploy

# Abrir Prisma Studio (dev only)
docker compose -f docker-compose.prod.yml run --rm web npx prisma studio

# Console SQL
docker exec -it wbc-postgres psql -U wbc -d wbc
```

## 6. Redis

```bash
# Console Redis
docker exec -it wbc-redis redis-cli -a $REDIS_PASSWORD

# Limpar cache (cuidado!)
docker exec -it wbc-redis redis-cli -a $REDIS_PASSWORD FLUSHDB

# Verificar filas BullMQ
docker exec -it wbc-redis redis-cli -a $REDIS_PASSWORD KEYS "bull:wbc:*"
```

## 7. Monitoramento

```bash
# Health check
curl https://seudominio.com.br/api/health

# Metricas Prometheus
curl https://seudominio.com.br/api/metrics

# Grafana dashboards
# Acesse https://seudominio.com.br/grafana/
# Login: admin / $GRAFANA_PASSWORD
```

## 8. Incidentes Comuns

### App nao responde
1. `docker compose -f docker-compose.prod.yml ps` — verificar containers
2. `docker logs wbc-web --tail 50` — verificar erros
3. `curl localhost:3000/api/health` — testar internamente
4. `docker compose -f docker-compose.prod.yml restart web`

### Worker parado
1. `docker logs wbc-worker --tail 50` — verificar erros
2. Verificar Redis: `docker exec wbc-redis redis-cli -a $REDIS_PASSWORD PING`
3. `docker compose -f docker-compose.prod.yml restart worker`

### Banco lento
1. `docker exec -it wbc-postgres psql -U wbc -d wbc -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"`
2. Verificar disco: `docker exec wbc-postgres df -h`
3. Considerar vacuum: `docker exec wbc-postgres vacuumdb -U wbc -d wbc --analyze`

### Disco cheio
1. `docker system df` — verificar uso Docker
2. `docker image prune -f` — limpar imagens orfas
3. `docker volume prune` — limpar volumes nao usados (CUIDADO!)
4. Verificar backups: `ls -lh backups/`
