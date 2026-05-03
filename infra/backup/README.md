# Backup & restore — operações WBC

Scaffold dos itens **HG2** (backup automatizado) e **HG3** (smoketest de restore) do `CHECAGEM.md`. Os scripts são autônomos e ficam parados sem credencial. O humano provê as credenciais do bucket e o cron, e os scripts assumem o resto.

## O que está aqui

| Arquivo                   | O que faz                                                                                               | Cadência sugerida          |
| ------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------- |
| `pg-backup.sh`            | `pg_dump` → gzip → gpg (AES-256) → upload S3-compatível. Stream end-to-end (não toca disco até cifrar). | diário, 03:00 UTC          |
| `pg-restore-smoketest.sh` | Pega o backup mais recente, restaura num Postgres em Docker, roda `COUNT(*)` em tabelas críticas.       | semanal, domingo 04:00 UTC |

## Pré-requisitos no host

Precisam estar instalados (qualquer Linux moderno; Hostinger KVM4 vem com tudo via apt):

- `postgresql-client` (`pg_dump`, `psql`, `pg_isready`)
- `gnupg`
- `awscli` v2 (compatível com R2, S3, B2, MinIO via `--endpoint-url`)
- `docker` (só para o smoketest)
- `curl` (só se for usar `SMOKETEST_ALERT_WEBHOOK`)

## Variáveis de ambiente

Os scripts não leem `.env` — herdam do ambiente do cron. Coloque num `/etc/wbc/backup.env` com permissões `0600`:

```bash
# Postgres
DATABASE_URL=postgresql://wbc:<senha>@<host>:5432/wbc?sslmode=require

# Bucket (R2 = Cloudflare)
BACKUP_S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
BACKUP_S3_BUCKET=wbc-prod-backups
BACKUP_S3_REGION=auto                      # "auto" no R2; us-east-1 etc. na AWS
BACKUP_S3_ACCESS_KEY_ID=<gerar no Cloudflare/AWS>
BACKUP_S3_SECRET_KEY=<gerar no Cloudflare/AWS>

# Encryption (gera com: openssl rand -base64 48)
BACKUP_ENCRYPTION_KEY=<chave de >=32 bytes>

# Opcional
BACKUP_PREFIX=wbc/postgres                 # caminho dentro do bucket
BACKUP_RETAIN_LOCAL_DIR=/var/backups/wbc   # mantém últimos 2 dumps locais
SMOKETEST_ALERT_WEBHOOK=https://hooks.slack.com/services/...   # opcional
```

> **Importante:** `BACKUP_ENCRYPTION_KEY` é o que separa "backup encriptado" de "dump cleartext num bucket público no caso de credencial vazar". Trate como secret de produção. Backup feito hoje sem essa chave **não pode ser restaurado**.

## Cron

Editar `crontab -e` do user que roda o backup (criar user dedicado `wbc-backup` é o recomendado):

```cron
# Backup diário 03:00 UTC (= 00:00 BRT)
0 3 * * * . /etc/wbc/backup.env && /opt/wbc/infra/backup/pg-backup.sh >> /var/log/wbc/backup.log 2>&1

# Smoketest semanal domingo 04:00 UTC
0 4 * * 0 . /etc/wbc/backup.env && /opt/wbc/infra/backup/pg-restore-smoketest.sh >> /var/log/wbc/smoketest.log 2>&1
```

Para alertar via cron padrão (mailto): adicione `MAILTO=ops@weavecode.co.uk` no topo do crontab. Para Slack: setar `SMOKETEST_ALERT_WEBHOOK`.

## Lifecycle do bucket (retenção)

Os scripts **não fazem retenção remota** — isso fica na lifecycle policy do bucket, que é mais barato e mais robusto. Política sugerida em `wbc-prod-backups`:

- `wbc/postgres/wbc-*.sql.gz.gpg`:
  - dias 0–30: storage padrão
  - dias 31–365: storage frio (R2 não tem tier frio; AWS = Glacier IR)
  - dia 365: deletar

Configurar em **Cloudflare R2 → bucket → Lifecycle rules** (ou `aws s3api put-bucket-lifecycle-configuration`).

## Restore manual (procedimento de incidente)

Para subir um backup em produção real (não smoketest):

```bash
# 1. Baixar o dump
aws s3 cp s3://wbc-prod-backups/wbc/postgres/wbc-20260601T030000Z.sql.gz.gpg ./dump.sql.gz.gpg \
  --endpoint-url "$BACKUP_S3_ENDPOINT"

# 2. Decifrar + descomprimir
gpg --decrypt --passphrase "$BACKUP_ENCRYPTION_KEY" --output - dump.sql.gz.gpg \
  | gunzip > dump.sql

# 3. Restaurar (ATENÇÃO: drop antes se for replace total)
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f dump.sql
```

**Ordem de validação pós-restore** (manual, não automatizar — incidente é momento de pensar):

1. `SELECT count(*) FROM tenants;` — bate com o esperado?
2. `SELECT max(created_at) FROM sales;` — qual o ponto de truncamento?
3. Login como tenant de teste pela UI — o JWT/sessão renderiza?
4. Disparar venda de teste — outbox/queue funcionam?

## Cobertura limitada (intencional)

O que esses scripts **não fazem** e por quê:

- **Não snapshottam Redis**: filas BullMQ são reconstruíveis a partir do banco (outbox), e cache não é dado autoritativo.
- **Não snapshottam mídia uploadada**: vai viver no R2 (já replicado pela Cloudflare).
- **Não rodam point-in-time recovery (PITR)**: requer WAL archiving contínuo, complexidade alta. Quando o RPO precisar ser <24h, evoluir para WAL-G ou pgBackRest. Hoje RPO = 24h é aceitável para o estágio do produto.

## Quando isso vira insuficiente

Métricas que indicam que precisamos evoluir para PITR (WAL streaming) e/ou managed Postgres:

- Volume da tabela `sales` > 50M linhas (dump + restore começa a passar de 1h, RTO inaceitável).
- RPO contratual com cliente cai abaixo de 24h.
- Compliance/auditoria exige logs de quem acessou o backup.

Até lá, o scaffold aqui é o suficiente.
