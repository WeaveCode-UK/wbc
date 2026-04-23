# WBC — Política de Backup & Disaster Recovery

> Contexto: `Auditoria/custos-finops/runs/2026-04-19_21-19-13/achados.md#ACH-011` + cross-ref `infraestrutura-deploy-config#ACH-003` + `dados-persistencia#ACH-018`. Este documento define RPO/RTO, estratégia de backup, política de retenção off-site e custos associados. Alinhamento humano exigido antes de adotar em produção.

## 1. Objetivos de recuperação

| Métrica                            | Meta inicial | Justificativa                                                                                                                               |
| ---------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **RPO** (Recovery Point Objective) | ≤ 1 hora     | Perda máxima tolerável: 1 hora de dados. Consultoras movem clientes/agendamentos ao longo do dia; perda de uma manhã inteira é inaceitável. |
| **RTO** (Recovery Time Objective)  | ≤ 4 horas    | Tempo máximo para restaurar serviço após incidente grave. Aceita janela de manhã ou tarde; não aceita "fim de semana".                      |
| **Drill frequency**                | Mensal       | Restore real em ambiente isolado. Sem drill, RTO é fantasia.                                                                                |

## 2. Estado atual (gap analysis)

`deploy/backup/backup.sh` existe e faz dump local do Postgres. Problemas:

- **Retenção não documentada:** script mantém backups até o disco encher.
- **Sem off-site:** um incêndio no datacenter zera tudo.
- **Redis não é backupeado:** filas BullMQ + cache perdem estado.
- **Sem verificação de integridade:** ninguém sabe se os backups restauram.
- **Sem drill:** RTO é estimado, não medido.

## 3. Estratégia proposta

### 3.1. Postgres

- **Local:** `pg_dump` diário via `deploy/backup/backup.sh` (já existe). Retenção local 7 dias.
- **Off-site:** upload para S3/GCS com lifecycle:
  - Standard class 30 dias.
  - Infrequent Access 90 dias.
  - Glacier 1 ano.
  - Delete após 1 ano (exceto snapshot mensal, mantido 7 anos).
- **Criptografia:** AES-256 server-side + chave gerenciada pelo WBC (KMS).
- **Continuous archiving (WAL):** habilitar `archive_mode=on` e enviar WAL para S3 a cada 5 minutos → RPO ≤ 5 min se necessário.

### 3.2. Redis

- **Local:** AOF + RDB snapshot a cada hora (config em docker-compose.prod.yml — pendente).
- **Off-site:** RDB incluído no backup diário.
- Redis não é fonte de verdade (cache + filas), então a perda de algumas horas de jobs é tolerável — o outbox no Postgres é source-of-truth.

### 3.3. Uploads de usuário (futuro)

- Se/quando o WBC aceitar upload de avatares/fotos de produtos, usar S3 com versionamento + lifecycle.
- Não é backup — é storage primário com replicação. Budget separado.

## 4. Custo mensal estimado

| Item                      | Volume              | Custo (US$/mês)   |
| ------------------------- | ------------------- | ----------------- |
| S3 Standard (30 dias)     | 50 GB × US$ 0,023   | US$ 1,15          |
| S3 IA (90 dias)           | 150 GB × US$ 0,0125 | US$ 1,88          |
| S3 Glacier (1 ano)        | 600 GB × US$ 0,004  | US$ 2,40          |
| Egress para restore teste | 50 GB × US$ 0,09    | US$ 4,50 (1x/mês) |
| KMS key usage             | ~1k ops             | US$ 0,03          |
| **Total mensal**          | —                   | **~US$ 10-12**    |

Diluído em 100 tenants: US$ 0,10-0,12 por tenant/mês.

## 5. DR drill mensal

Procedimento (detalhes em `docs/dr/` — a preencher pelo time):

1. Na primeira quinta do mês, baixar backup S3 do dia anterior.
2. Restaurar em VPS staging (isolada da prod).
3. Verificar: número de tenants, último `createdAt` em Clients, agendamentos do mês.
4. Rodar suíte de smoke tests E2E.
5. Registrar em `docs/dr/drill-YYYY-MM.md`:
   - RTO real medido.
   - Problemas encontrados.
   - Ação corretiva, se houver.

Drill **falhou**? Incidente sev-2; plano de correção em 48h.

## 6. Matriz de decisão para incidentes

| Cenário                             | RTO alvo | Ação                                                                          |
| ----------------------------------- | -------- | ----------------------------------------------------------------------------- |
| Corrupção lógica (DELETE acidental) | 1h       | Restore de dump do dia; point-in-time WAL recovery                            |
| Perda de VPS (hardware)             | 4h       | Provisionar VPS nova; restaurar S3                                            |
| Perda de datacenter                 | 4h       | Provisionar em região secundária; restaurar Glacier via IA (faster retrieval) |
| Ataque ransomware                   | 24h      | Restaurar backup pré-incidente (snapshot 7d+); auditoria de credenciais       |

## 7. Roadmap

- **Semana 1:** adicionar upload S3 em `deploy/backup/backup.sh` (rclone ou AWS CLI). Validar em staging.
- **Semana 2:** configurar lifecycle S3 + KMS.
- **Semana 3:** primeiro DR drill manual. Documentar RTO real.
- **Semana 4:** automatizar drill em CI scheduled workflow (monthly cron). Alertar se falhar.
- **Mês 2+:** continuous archiving WAL → S3 (reduzir RPO para 5 min).

## 8. Responsabilidades

- Owner: `@WeaveCode-UK/owners` (via CODEOWNERS em `docs/dr/`).
- Escrita do drill: rotação entre times de eng.
- Revisão trimestral deste doc.

## Referências

- Achados origem: `Auditoria/custos-finops/runs/2026-04-19_21-19-13/achados.md#ACH-011`
- Cross-ref: `Auditoria/infraestrutura-deploy-config/runs/.../achados.md#ACH-003`
- Cross-ref: `Auditoria/dados-persistencia/runs/.../achados.md#ACH-018`
