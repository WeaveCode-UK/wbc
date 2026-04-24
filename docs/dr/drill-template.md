# DR Drill — <!-- YYYY-MM -->

> Template para `docs/dr/drill-YYYY-MM.md`. Rodar uma vez por mês (ver `docs/DR-BACKUP-POLICY.md`). Registrar aqui o drill em staging.

## Metadata

- **Data do drill:** YYYY-MM-DD HH:MM BRT
- **Operador:** <nome>
- **Ambiente:** staging (VPS ephemeral / nome do host)
- **Backup restaurado:** s3://wbc-backups/postgres/wbc_YYYYMMDD_HHMMSS.sql.gz
- **Idade do backup no momento do drill:** `N horas`
- **Passos executados:** 10/10 de `docs/runbooks/dr.md`

## RTO medido

| Etapa                     | Duração alvo     | Duração real | OK?   |
| ------------------------- | ---------------- | ------------ | ----- |
| 1. Provisionar VPS        | 10 min           | — min        | ✅/❌ |
| 2. Clonar repo            | 2 min            | — min        |       |
| 3. Restaurar secrets      | 5 min            | — min        |       |
| 4. Download S3            | 5 min            | — min        |       |
| 5. Subir Postgres + Redis | 2 min            | — min        |       |
| 6. `pg_restore`           | 15 min           | — min        |       |
| 7. Migrations deploy      | 5 min            | — min        |       |
| 8. Subir stack completa   | 3 min            | — min        |       |
| 9. Smoke test             | 10 min           | — min        |       |
| **Total**                 | ≤ 60 min (drill) | — min        |       |
| **RTO alvo (prod)**       | ≤ 4h             | —            |       |

> No drill, as etapas são mais rápidas que em incidente real (sem decisões novas). Use o total como piso; em incidente real multiplicar por ~3 para folgas de decisão.

## Smoke test — resultado

Saída de `psql -f deploy/dr/smoke-tests.sql`:

```
<cole o output aqui>
```

Passes / Warnings / Failures: `P / W / F`.

## Checks manuais (não automatizáveis)

- [ ] Login com usuário de teste funciona.
- [ ] Um agendamento conhecido (descrever: "João Silva, 2026-04-15 14:00") aparece na agenda.
- [ ] Um cliente conhecido (CPF truncado) aparece na listagem.
- [ ] Grafana carrega (se subido no staging).
- [ ] `/api/health` retorna 200.

## Gaps encontrados

<!-- Liste coisas que o runbook não cobriu ou cobriu errado. Ajuste docs/runbooks/dr.md em PR de follow-up. -->

-

## Ações corretivas

<!-- Se RTO > alvo ou algum gap crítico, abrir item aqui com owner e prazo. -->

1.

## Próximo drill

- Data sugerida: YYYY-MM-DD (primeira quinta do mês seguinte).

---

_Última revisão deste template: 2026-04-24_
