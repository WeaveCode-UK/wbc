# Restore Drill (ACH-010)

## O que é

Workflow semanal (`.github/workflows/dr-drill.yml`) que:

1. Baixa o último backup de `BACKUP_S3_URL`.
2. Restaura em um Postgres 16 ephemeral (serviço GitHub Actions).
3. Verifica tabelas obrigatórias de `DR_DRILL_EXPECTED_TABLES`.
4. Falha com erro se alguma tabela sumiu; alerta se alguma vier zerada.

Dispara todo domingo 03:00 UTC (baixa atividade de prod), e pode ser
disparado manualmente via `workflow_dispatch`.

## Configuração (secrets do repo)

- `BACKUP_S3_URL` — mesmo valor de prod (`s3://wbc-backups/postgres/`).
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — IAM user **somente leitura**
  no bucket (nunca compartilhe com o user de escrita).
- `AWS_DEFAULT_REGION` — região do bucket.
- `DR_DRILL_EXPECTED_TABLES` — lista comma-separated. Começar com
  `Tenant,User,Client` e expandir conforme novos modelos críticos surgem.

## Pendências para validação humana

1. **Provisionar IAM read-only** e adicionar os secrets ao repo.
2. **Popular `DR_DRILL_EXPECTED_TABLES`** com as tabelas que precisam ter
   dados em qualquer prod saudável (após inspecionar `prisma/schema.prisma`).
3. **Integrar alerta**: quando o workflow falhar, notificar via Slack/Email
   (reusar o mesmo canal dos alerts de Sentry).
4. **Benchmarks**: gravar tempo de restauração como métrica ao longo das
   semanas — serve como validação contínua do RTO declarado.
5. **Expandir** para restaurar Redis (se streams críticos forem persistidos)
   e verificar roundtrip de migrations manuais (ACH-012).
