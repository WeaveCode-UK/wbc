# Operations — índice central

Este é o **ponto de partida em incidentes**. Se você foi paginado, comece aqui e siga o link do alerta correspondente. Cada runbook descreve trigger, diagnóstico, mitigação e rollback.

## Runbooks por alerta Prometheus

Alertas estão em [`deploy/alerts.yml`](../deploy/alerts.yml). A tabela abaixo mapeia cada alerta ao runbook.

| Alerta                     | Severidade | Runbook                                                                   |
| -------------------------- | ---------- | ------------------------------------------------------------------------- |
| `HighErrorRate`            | warning    | [error-rate.md](runbooks/error-rate.md) _(roadmap)_                       |
| `SlowRequests`             | warning    | [slow-requests.md](runbooks/slow-requests.md) _(roadmap)_                 |
| `HighRequestRate`          | info       | _informativo — investigar só se persistente_                              |
| `TargetDown`               | critical   | [target-down.md](runbooks/target-down.md)                                 |
| `DLQEventsGrowing`         | warning    | [dlq-growing.md](runbooks/dlq-growing.md)                                 |
| `OutboxLagHigh`            | warning    | [outbox-lag.md](runbooks/outbox-lag.md)                                   |
| `BullMQQueueDepthHigh`     | warning    | [queue-depth.md](runbooks/queue-depth.md)                                 |
| `TenantBudget80PctReached` | warning    | [../FINOPS-KILL-SWITCH.md](../docs/FINOPS-KILL-SWITCH.md)                 |
| `TenantBudgetExhausted`    | critical   | [../FINOPS-KILL-SWITCH.md](../docs/FINOPS-KILL-SWITCH.md)                 |
| `GlobalCostSpike`          | warning    | [../FINOPS-OBSERVABILITY.md](../docs/FINOPS-OBSERVABILITY.md)             |
| `ReconciliationDivergence` | warning    | [../FINOPS-COST-RECONCILIATION.md](../docs/FINOPS-COST-RECONCILIATION.md) |

## Runbooks por cenário operacional

Eventos que podem acontecer sem um alerta específico:

| Cenário                                    | Runbook                                                                                                    |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| DR — restore completo a partir de backup   | [runbooks/dr.md](runbooks/dr.md)                                                                           |
| DLQ grande — replay de eventos             | [runbooks/dlq-replay.md](runbooks/dlq-replay.md)                                                           |
| Worker sobrecarregado — escalar            | [runbooks/worker-scaling.md](runbooks/worker-scaling.md)                                                   |
| Certbot — SSL próximo de expirar           | [runbooks/certbot-ssl-expiring.md](runbooks/certbot-ssl-expiring.md)                                       |
| Spike de custo — kill switch de integração | [../FEATURE-FLAGS-FOLLOWUP.md#emergency-kill-switches-ach-012-custos-finops](../FEATURE-FLAGS-FOLLOWUP.md) |

## Como ler um runbook

Cada runbook segue o template:

1. **Trigger** — o alerta ou condição que dispara o procedimento.
2. **Diagnóstico** — comandos/queries para confirmar a hipótese.
3. **Mitigação** — o que fazer para estabilizar (curto prazo).
4. **Rollback** — reverter a mitigação quando seguro.
5. **Post-mortem** — quando abrir incident doc; o que coletar.

## Criação de novos runbooks

1. Arquivo em `docs/runbooks/<nome-kebab>.md`.
2. Use o template de outros runbooks (seções padrão).
3. Referência cruzada no alerta correspondente (`runbook_url` em `deploy/alerts.yml`).
4. Adicione entrada nas tabelas deste arquivo.
5. PR com label `docs/runbook`.

## Runbooks em outros documentos

Nem todo runbook mora em `docs/runbooks/`. Alguns ficam em docs temáticos quando o contexto exige:

- **FinOps** — `docs/FINOPS-KILL-SWITCH.md` tem runbook de emergência para spike de custo.
- **Husky** — `docs/SECURITY-HUSKY.md` tem checklist de review de hooks maliciosos.
- **Auth (next-auth beta)** — `docs/AUTH-NEXTAUTH-BETA.md` tem checklist de bump.
- **Deploy** — `deploy/RUNBOOKS.md` tem procedimentos de deploy manual como fallback.

---

_Última revisão: 2026-04-24 · Próxima revisão esperada: 2026-07-24_
