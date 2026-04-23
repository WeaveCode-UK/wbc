---
last_reviewed: 2026-04-23
next_review_due: 2027-04-23
reviewers: [dpo, legal]
version: 0.1.0-draft
---

# Data Retention Policy (ACH-010)

LGPD art. 15/16 limita retenção ao necessário para a finalidade. Esta
política define prazos máximos por categoria. Workers de limpeza
aplicam os prazos automaticamente — ver pendências.

> **⚠️ Validação humana pendente:** DPO + jurídico devem ratificar os
> prazos. Workers de anonimização/limpeza são parciais (ver ACH-011 e
> `apps/worker/src/processors/outbox-cleanup.ts`).

## Matriz

| Entidade / categoria       | Prazo ativo               | Prazo pós-rescisão | Ação ao expirar         | Base legal / motivo                  |
| -------------------------- | ------------------------- | ------------------ | ----------------------- | ------------------------------------ |
| Account (consultora)       | Vida do contrato          | 30 dias            | Hard delete + anonim    | Execução de contrato                 |
| Client (cliente final)     | Enquanto consultora ativa | 3 anos inatividade | Anonimização            | Execução de contrato + consentimento |
| Session (NextAuth)         | 14 dias                   | —                  | Hard delete             | Segurança                            |
| OTP consumido/expirado     | 24 h                      | —                  | Hard delete             | Segurança                            |
| AuthAuditLog (ACH-020)     | 90 dias                   | 90 dias            | Hard delete             | Auditoria                            |
| Logs de aplicação (stdout) | 30 dias                   | —                  | Rotação logrotate       | Operacional                          |
| Backup DB                  | 30 dias (local)           | 30 dias            | Rotação backup.sh       | DR                                   |
| Backup off-site            | 90 dias                   | 90 dias            | Lifecycle S3            | DR prolongado                        |
| Sales / transações fiscais | 5 anos                    | 5 anos             | Anonimização parcial    | Obrigação fiscal (BR)                |
| CampaignRecipient          | 2 anos                    | —                  | Hard delete             | Analítico                            |
| Outbox events (PROCESSED)  | 7 dias                    | —                  | Hard delete (já existe) | Operacional                          |
| Media (uploads)            | Vida do contrato          | 30 dias            | Hard delete             | Contrato                             |
| DeepSeek prompts (logs)    | 7 dias                    | —                  | Hard delete             | Minimização                          |

## Gatilhos e workers

- `outbox-cleanup` — existe (`apps/worker/src/processors/outbox-cleanup.ts`).
- `session-cleanup` ⚠️ pendente.
- `otp-cleanup` ⚠️ pendente.
- `inactive-client-anonymizer` ⚠️ pendente (ACH-011).
- `auth-audit-log-retention` ⚠️ pendente.

## Propagação para backups

Ao anonimizar/excluir no DB primário, o dado ainda vive em backups por
até 90 dias (política). Após esse prazo, já não consta em nenhum
backup — o direito ao esquecimento é atendido.

Alternativa para casos críticos: criptografia de backup com chave por
tenant e destruição da chave após exclusão (ver ACH-014).

## Exportação de conformidade

Relatório mensal pode ser gerado via `/api/trpc/privacy.retentionReport`
(pendente — ver ACH-001).

## Pendências humanas

1. Ratificar prazos com jurídico (alguns são conservadores; outros
   podem precisar estender).
2. Implementar os 4 workers pendentes.
3. Documentar `retentionReport` no painel admin.
4. Alinhar com obrigações fiscais específicas por região (BR vs UK).
