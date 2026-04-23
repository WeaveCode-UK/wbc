# Infrastructure-as-Code — Follow-up (ACH-002)

## Estado atual

Deploy imperativo:

- `deploy/deploy.sh` orquestra steps.
- `docker-compose.prod.yml` descreve o stack.
- VM única (Hostinger KVM8).
- DNS, SSL (Certbot), firewall configurados manualmente na VM.

Não há estado versionado para a infra propriamente dita — só para o
**app** (código + compose). Reconstruir o ambiente exige o runbook
`docs/dr/vm-down.md` executado manualmente.

## Etapas de migração (ordem sugerida)

### Fase 1 — Documentar o estado atual

1. Auditar o que existe na VM hoje:
   - Versão do SO, kernel.
   - Regras de firewall (`ufw status`, `iptables -L`).
   - Users, groups, SSH keys.
   - Crons configurados (`crontab -l`, `/etc/cron.d/`).
   - Paths montados (`mount`, `/etc/fstab`).
2. Salvar como `docs/infra/CURRENT-STATE.md`.

### Fase 2 — Escolher stack de IaC

Candidatos:

- **Terraform + hcloud provider** (se ficar em Hetzner/similar).
- **Terraform + AWS** (se migrar para EC2 + RDS + ElastiCache).
- **Pulumi** (TypeScript — combina com stack atual).
- **Docker Swarm + Ansible** (mais simples mas menos padrão).

Decisão deve considerar: custo, expertise da equipe, multi-região
futura, vendor lock-in.

### Fase 3 — Módulos mínimos (preview)

- `dns` — managed por Cloudflare (ou Route53) com records apontando
  para IPs das VMs.
- `vm` — imagens idempotentes com cloud-init para subir Docker +
  compose + certbot.
- `database` — decidir entre Postgres managed (ex: AWS RDS) ou
  continuar em container com backup off-site (ACH-003).
- `redis` — idem.

### Fase 4 — CI

- Workflow `terraform-plan` em PRs que tocam `infra/terraform/**`.
- Workflow `terraform-apply` com approval manual em tag específica.

## Pendências para validação humana

1. **Decisão de provider** — maior custo/benefício no curto prazo.
2. **Contrato de estado remoto** — bucket S3 + DynamoDB lock (se AWS)
   ou equivalente.
3. **Runbook de migração** — passo a passo de cutover sem downtime.
4. **Testes** — ambiente de staging via IaC antes de prod.
5. **Compliance** — auditar que RLS policies, secret access e network
   ACL batem com o estado atual antes do cutover.

## Critério de fechamento

- (1) `infra/terraform` populado com módulos reais.
- (2) `terraform plan` em PR mostra diff limpo contra prod atual.
- (3) Cutover executado em janela planejada.
- (4) `deploy/deploy.sh` simplificado para apenas `docker compose up`
  (sem certbot/SSL — IaC cuida).
- (5) Runbook `vm-down.md` reduz a `terraform apply` em região alternativa.
