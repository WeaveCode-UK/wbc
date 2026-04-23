# Disaster Recovery — índice (ACH-004)

Runbooks por cenário para incidentes de infra. Sempre começar aqui
durante um incidente — escolher o runbook correspondente ao sintoma
e seguir o plano de ação.

## Runbooks

- **[disk-full.md](./disk-full.md)** — host sem espaço em disco.
- **[db-corrupt.md](./db-corrupt.md)** — Postgres com corrupção.
- **[vm-down.md](./vm-down.md)** — VM inacessível ou comprometida.
- **[redis-loss.md](./redis-loss.md)** — Redis/BullMQ offline ou zerado.

## Processos contínuos

- **[BACKUP-OFFSITE.md](./BACKUP-OFFSITE.md)** — replicação off-site (ACH-003).
- **[RESTORE-DRILL.md](./RESTORE-DRILL.md)** — drill semanal (ACH-010).

## Pendências globais de DR

- Formalizar RTO/RPO com stakeholders (ainda marcados como "pendente
  validação humana" em `docs/DEPLOYMENT.md`).
- Drill mensal executado manualmente até o workflow semanal estar
  validado.
- Comunicação de incidente — templates de status-page / e-mail.
