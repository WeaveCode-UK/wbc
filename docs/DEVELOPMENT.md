# WBC — Guia de desenvolvimento

## Stack local

```
pnpm install
pnpm db:generate
pnpm dev
```

O `pnpm dev` orquestra (via Turborepo) `apps/web`, `apps/api` e `apps/worker` em paralelo. Postgres e Redis ficam no `docker-compose.yml` (dev).

## Economizando recursos locais — parar o stack quando não está usando

> **ACH-014 custos-finops:** o `docker-compose.yml` de desenvolvimento não configura `restart: "no"` nem shutdown agendado. Em máquina de dev, isso significa que Postgres + Redis seguem consumindo CPU/RAM fora do expediente. Em VPS compartilhada, o problema é custo direto.

### Final de expediente / fim de semana

Antes de fechar o laptop, rode:

```bash
docker compose stop          # dev (docker-compose.yml)
```

Isso preserva volumes (banco intacto, filas persistidas) e tira o processo do ar. Para retomar:

```bash
docker compose start
```

### VPS compartilhada com cron

Se o dev roda numa VPS fora do horário, adicione ao crontab do usuário:

```cron
# Desliga dev stack às 22:00 BRT; liga às 08:00 dias úteis.
0 22 * * *  cd /opt/wbc && docker compose stop
0 8  * * 1-5 cd /opt/wbc && docker compose start
```

Para staging/production, `restart: unless-stopped` já cobre disponibilidade — a recomendação não se aplica.

### Medindo o impacto

Antes de ligar o cron, meça com `docker stats --no-stream` por 5-10 segundos o consumo idle do Postgres e Redis. Documente o baseline antes/depois — justifica o esforço se alguém questionar.

## Links de referência

- Compose dev: `docker-compose.yml`
- Compose prod: `docker-compose.prod.yml` (digests pinados, restart: unless-stopped)
- Runbook de DR: `docs/DR-BACKUP-POLICY.md`
- Política de retenção: `docs/DATA_RETENTION_POLICY.md`
