# Runbook — Disaster Recovery (restore completo)

> **Status:** procedimento documentado. **Drill real ainda não foi executado** (ACH-004 parcial). Os tempos de RPO ≤ 1h / RTO ≤ 4h vêm de `docs/DR-BACKUP-POLICY.md` e são meta — não medição.
>
> **Antes de considerar este doc operacional:** rodar o drill mensal descrito em `docs/DR-BACKUP-POLICY.md#5-dr-drill-mensal` e validar RTO em ambiente staging.

## Trigger

Cenários que exigem restore completo:

1. **Corrupção lógica** — DELETE acidental em massa, drop de tabela por engano.
2. **Perda de VPS** — hardware failure no provider, reprovisionamento.
3. **Perda de datacenter** — região inteira offline.
4. **Ataque ransomware** — dados cifrados; restore de backup limpo.

## Pré-requisitos

- Acesso SSH à VPS alvo (nova ou existente).
- Credenciais S3 (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`) para o bucket de backups.
- `AUTH_SECRET`, `TOTP_ENCRYPTION_KEY` e demais secrets disponíveis (via Secret Manager ou backup offline dos próprios operadores).

## Procedimento

### 0. Declarar incidente

```
Severity: sev-1
Incident lead: <nome>
Comms: #incidents em Slack
```

Abrir `docs/incidents/YYYY-MM-DD-dr-restore.md` para timeline.

### 1. Provisionar infraestrutura (se necessário)

Se a VPS antiga está perdida:

```bash
# Exemplo com Hetzner CLI — ajustar para seu provider
hcloud server create --name wbc-prod-new --image ubuntu-24.04 --type cx21
# copiar chaves SSH, configurar firewall (22, 80, 443)
```

Instalar Docker + Docker Compose:

```bash
apt-get update && apt-get install -y docker.io docker-compose-plugin git
```

### 2. Clonar o repo

```bash
git clone https://github.com/WeaveCode-UK/wbc.git /opt/wbc
cd /opt/wbc
git checkout <tag-do-ultimo-release>   # ou main se preferir continuar
```

### 3. Restaurar secrets

Opção A — **Secret Manager** (quando ACH-016 for implementado):

```bash
# Pseudocomando; depende do provider escolhido
secrets-cli fetch wbc-prod --out .env.production
```

Opção B — **Recovery manual** (estado atual):

1. Buscar `.env.production.gpg` do local seguro (1Password / cofre do operador).
2. `gpg -d .env.production.gpg > .env.production`.

### 4. Recuperar backup do banco

```bash
# Listar backups disponíveis
aws s3 ls s3://wbc-backups/postgres/ --recursive | tail -20

# Baixar o mais recente (ou a data desejada)
aws s3 cp s3://wbc-backups/postgres/2026-04-24/wbc-postgres.dump ./backup.dump

# Verificar integridade (hash deve bater com S3 metadata)
aws s3 head-object --bucket wbc-backups --key postgres/2026-04-24/wbc-postgres.dump \
  --query 'Metadata.sha256'
sha256sum backup.dump
```

### 5. Subir Postgres + Redis

```bash
docker compose -f docker-compose.prod.yml up -d postgres redis
# aguardar healthcheck
until docker compose -f docker-compose.prod.yml exec postgres pg_isready -U wbc; do sleep 2; done
```

### 6. Restaurar dump

```bash
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_restore --clean --if-exists --no-owner -d wbc -U wbc < backup.dump
```

**Point-in-time recovery (futuro):** quando WAL archiving estiver ativo (roadmap em `docs/DR-BACKUP-POLICY.md`), aplicar WALs até o timestamp desejado via `recovery.conf`.

### 7. Rodar migrations pendentes (se mudaram após o backup)

```bash
docker compose -f docker-compose.prod.yml exec postgres psql -U wbc -c "SELECT version()"
docker compose -f docker-compose.prod.yml run --rm web pnpm db:migrate deploy
```

### 8. Subir restante da stack

```bash
docker compose -f docker-compose.prod.yml up -d web worker nginx certbot prometheus alertmanager grafana
```

### 9. Validação smoke test

Cada item abaixo é **bloqueante** — se falhar, pausar e investigar:

- [ ] `curl -sf https://<dominio>/api/health` retorna 200.
- [ ] Login com usuário conhecido funciona.
- [ ] Grafana mostra métricas recentes (< 5 min).
- [ ] Um agendamento conhecido aparece na agenda.
- [ ] Quantidade de tenants no banco bate com o backup:
  ```sql
  SELECT count(*) FROM tenants;
  ```
- [ ] Último evento processado tem timestamp consistente com o momento do backup.
- [ ] Outbox lag saudável (< 5s) após 5 min de warm-up.

### 10. Post-mortem

- Medir RTO real: quanto levou do passo 0 ao smoke test verde?
- Registrar em `docs/dr/drill-YYYY-MM.md` (ou em `docs/incidents/` se foi incident real).
- Comparar com meta de 4h; se > 4h, ação corretiva documentada.

## Rollback

Se o restore introduziu bug (dados velhos reaplicados em cima de staging):

- Rebaixar a nova VPS, manter a antiga (se ainda acessível).
- Documentar a decisão no incident doc.

## Referências

- Política de backup + RPO/RTO: `docs/DR-BACKUP-POLICY.md`.
- Restore script: `deploy/backup/restore.sh` (pendente — roadmap para automatizar esse procedimento).
- Cross-ref: `infraestrutura-deploy-config/ACH-003`, `dados-persistencia/ACH-018`.

---

_Última revisão: 2026-04-24 · Próxima revisão esperada: 2026-07-24 (ou após primeiro drill real)_
