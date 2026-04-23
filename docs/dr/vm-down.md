# DR Runbook — VM down (ACH-004)

## Sintomas

- Todos os healthchecks externos offline.
- DNS resolve, mas nenhuma porta responde.
- Console do provedor reporta VM suspensa, drive falho ou reboot infinito.

## Plano de ação (RTO alvo < 4 h, RPO ≤ 24 h)

### Rota A — VM recuperável

1. Acessar console do provedor (Hostinger KVM8).
2. Tentar "soft reboot". Aguardar 5 min.
3. Se subiu: `ssh wbc@host`, verificar `docker compose ps`, rodar
   `wait_for_ready` (ACH-009). Comunicar incidente resolvido.

### Rota B — VM irrecuperável (disco/hardware)

**Premissa:** backup off-site (ACH-003) está válido e replicação está
atualizada. Se não estiver, abrir incidente Sev-1 e avaliar perda de dados.

1. **Provisionar VM nova** (mesmo provedor ou alternativo):
   - Mesmo CPU/RAM (KVM8 — 8 vCPU / 32 GB).
   - SO: Ubuntu 22.04 LTS ou superior.
   - Anotar hostname/IP novo.
2. **Bootstrap inicial:**

   ```bash
   # No laptop, push da chave SSH:
   ssh-copy-id wbc@new-host

   # Na VM nova:
   sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin git
   git clone https://github.com/WeaveCode-UK/wbc ~/wbc
   cd ~/wbc
   cp .env.production.example .env.production
   # Editar .env.production com os secrets (recuperar do secret manager)
   ```

3. **Restaurar estado:**
   ```bash
   ./deploy/deploy.sh first-run
   ```
   Isso roda `prisma migrate deploy`, `apply_manual_migrations` e
   `setup_ssl`. Se secret `BACKUP_S3_URL` estiver configurado antes,
   habilitar restore manual:
   ```bash
   aws s3 cp "${BACKUP_S3_URL%/}/$(aws s3 ls $BACKUP_S3_URL | sort | tail -1 | awk '{print $4}')" ./restore.sql.gz
   docker compose -f docker-compose.prod.yml up -d postgres
   gunzip -c ./restore.sql.gz | docker compose -f docker-compose.prod.yml exec -T postgres psql -U wbc -d wbc
   ```
4. **Atualizar DNS** para apontar para o novo IP (Cloudflare/Route53).
   Aguardar propagação (TTL em 60s se configurado corretamente).
5. **Reemitir SSL** automaticamente via certbot (já roda como parte de
   `first-run`).
6. **Health check externo** + smoke test.

## Verificação

- Ping e HTTPS respondendo no novo IP.
- `/api/health` retorna 200.
- Smoke test end-to-end.
- Sentry / Grafana recebem eventos da nova instância.
- `BACKUP_S3_URL` continua recebendo uploads (confirmar em 24h).

## Prevenção

- Snapshot diário da VM no provedor (além do dump Postgres).
- DNS com TTL baixo (60s) para failover rápido.
- Documentar `.env.production` em secret manager — nunca só na VM.
- Cross-ref ACH-002 (IaC) — quando implementado, `terraform apply` em
  região alternativa acelera este runbook de horas para minutos.
