# Retention Policy

## Outbox (`OutboxEvent`)

- **Default**: 30 dias após `processedAt` para eventos em status `PROCESSED`.
- **Override**: `OUTBOX_RETENTION_DAYS` (inteiro positivo). Valores inválidos caem no default.
- **Cleanup**: `apps/worker/src/processors/outbox-cleanup.ts` roda periodicamente (ver `apps/worker/src/index.ts`).
- **Cold storage**: ainda não implementado. Follow-up: exportar eventos antes de deletar (S3 ou equivalente), sincronizado com a decisão de infra (ver ACH-013 infraestrutura-deploy-config).

## Processed Events (`processed_events`)

- Não há cleanup automático atual. A tabela tende a crescer proporcional ao volume de eventos em janela de retenção do outbox.
- Se o outbox retém 30 dias, `processed_events` também precisa manter pelo menos isso — caso contrário a idempotência é perdida antes do limite de retry.
- **Recomendação**: manter janela ≥ outbox retention. Adicionar cleanup espelhado quando `OUTBOX_RETENTION_DAYS` for alterado.

## DLQ (`OutboxEvent` com status `DLQ`)

- **Nunca apagar automaticamente.** Eventos em DLQ requerem investigação manual (replay via `scripts/dlq-replay.ts` ou `admin.dlq.replay`).
- Archive manual após análise é permitido.

## LGPD

- Eventos podem conter PII (phone, email em payloads). Ver `docs/observabilidade-operacao` (ACH-003) para redação de logs e `docs/LGPD.md` quando implementado.
- Exportação para cold storage deve aplicar mascaramento antes de persistir fora do Postgres controlado.
