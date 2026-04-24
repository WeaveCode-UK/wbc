# Documentation Roadmap

> Criado pelo ACH-018 da auditoria `documentacao-runbooks/runs/2026-04-19_21-26-25` — consolida pedidos de documentação originados em outros domínios de auditoria para um backlog único com priorização.

Este é um doc **vivo**: conforme runs futuras ou trabalho regular gerarem novas demandas documentais, adicionar linha à tabela correspondente e atualizar o status.

## Estado das docs críticas (abril 2026)

### Governança e segurança (status: em dia)

| Doc                          | Status      | Origem                                    | Última revisão |
| ---------------------------- | ----------- | ----------------------------------------- | -------------- |
| `README.md`                  | ✅ completo | ACH-002 documentacao-runbooks             | 2026-04-24     |
| `CONTRIBUTING.md`            | ✅ completo | ACH-003/011/014/016 documentacao-runbooks | 2026-04-24     |
| `CODE_OF_CONDUCT.md`         | ✅ completo | ACH-015 documentacao-runbooks             | 2026-04-24     |
| `SECURITY.md`                | ✅ completo | ACH-001 documentacao-runbooks             | 2026-04-24     |
| `CHANGELOG.md`               | ✅ completo | ACH-012 documentacao-runbooks             | 2026-04-24     |
| `docs/LICENSING.md`          | ✅ completo | ACH-007 supply-chain-dependencias         | 2026-04-23     |
| `docs/OVERRIDES.md`          | ✅ completo | ACH-008 supply-chain-dependencias         | 2026-04-23     |
| `docs/SECURITY-HUSKY.md`     | ✅ completo | ACH-015 supply-chain-dependencias         | 2026-04-23     |
| `docs/AUTH-NEXTAUTH-BETA.md` | ✅ completo | ACH-002 supply-chain-dependencias         | 2026-04-23     |

### Operações (status: suficiente para operar; alguns runbooks de backfill)

| Doc                                     | Status          | Origem                                              | Próximo passo                          |
| --------------------------------------- | --------------- | --------------------------------------------------- | -------------------------------------- |
| `docs/OPERATIONS.md`                    | ✅              | ACH-008 documentacao-runbooks                       | —                                      |
| `docs/DEPLOYMENT.md`                    | ✅              | ACH-002 arquitetura + ACH-009 documentacao-runbooks | —                                      |
| `docs/DR-BACKUP-POLICY.md`              | ✅ política     | ACH-011 custos-finops                               | **Drill real** (humano)                |
| `docs/runbooks/dr.md`                   | ✅ procedimento | ACH-004 documentacao-runbooks                       | **Drill real** (humano)                |
| `docs/runbooks/outbox-lag.md`           | ✅              | ACH-001 observabilidade-operacao                    | —                                      |
| `docs/runbooks/dlq-growing.md`          | ✅              | ACH-004 observabilidade-operacao                    | —                                      |
| `docs/runbooks/dlq-replay.md`           | ✅              | ACH-005 documentacao-runbooks                       | —                                      |
| `docs/runbooks/worker-scaling.md`       | ✅              | ACH-005 documentacao-runbooks                       | —                                      |
| `docs/runbooks/certbot-ssl-expiring.md` | ✅              | ACH-005 documentacao-runbooks                       | —                                      |
| `docs/runbooks/queue-depth.md`          | ✅              | existente                                           | —                                      |
| `docs/runbooks/target-down.md`          | ✅              | existente                                           | —                                      |
| `docs/runbooks/error-rate.md`           | ❌ roadmap      | cross-ref observabilidade                           | criar quando houver primeiro incidente |
| `docs/runbooks/slow-requests.md`        | ❌ roadmap      | cross-ref observabilidade                           | criar quando houver primeiro incidente |

### FinOps (status: seed + doc entregues; implementação pendente)

| Doc                                  | Status                            | Origem                          |
| ------------------------------------ | --------------------------------- | ------------------------------- |
| `docs/PRICING.md`                    | ✅                                | ACH-008 custos-finops           |
| `docs/FINOPS-KILL-SWITCH.md`         | ✅ (parcial, impl humano)         | ACH-001 custos-finops           |
| `docs/FINOPS-PLAN-LIMITS.md`         | ✅ (parcial, migration humano)    | ACH-002 custos-finops           |
| `docs/FINOPS-WHATSAPP-BILLING.md`    | ✅ (parcial, adapter humano)      | ACH-003 custos-finops           |
| `docs/FINOPS-OBSERVABILITY.md`       | ✅ (parcial, métricas humano)     | ACH-004 custos-finops           |
| `docs/FINOPS-COST-RECONCILIATION.md` | ✅ (parcial, schema humano)       | ACH-010 custos-finops           |
| `docs/DEEPSEEK-FALLBACK.md`          | ✅ (parcial, cache humano)        | ACH-006 custos-finops           |
| `docs/FEATURE-FLAGS-FOLLOWUP.md`     | ✅ (kill-switch seção em parcial) | ACH-008 + ACH-012 custos-finops |

### Compliance / privacidade (gap conhecido — pendente corrigir em novo domínio ou follow-up)

| Doc                                 | Status                              | Domínio que cobrará                                    |
| ----------------------------------- | ----------------------------------- | ------------------------------------------------------ |
| `docs/PRIVACY_POLICY.md`            | ❌ ausente                          | `compliance-privacidade/ACH-002`                       |
| `docs/SUB_PROCESSORS.md`            | ❌ ausente                          | `compliance-privacidade/ACH-006`                       |
| `docs/DPIA.md`                      | ❌ ausente                          | `compliance-privacidade/ACH-007`                       |
| `docs/INCIDENT_RESPONSE_PRIVACY.md` | ❌ ausente                          | `compliance-privacidade/ACH-013`                       |
| `docs/DATA_RETENTION_POLICY.md`     | ✅ (expandido com cost perspective) | ACH-010 compliance-privacidade + ACH-007 custos-finops |
| `docs/COOKIE_POLICY.md`             | ❌ ausente                          | `compliance-privacidade/ACH-015`                       |

### APIs (gap conhecido)

| Doc                             | Status                                      | Domínio                    |
| ------------------------------- | ------------------------------------------- | -------------------------- |
| `docs/VERSIONING.md`            | ✅ completo (follow-up 2026-04-24)          | `apis-integracoes/ACH-002` |
| `docs/FILTERING_AND_SORTING.md` | ✅ completo (follow-up 2026-04-24)          | `apis-integracoes/ACH-011` |
| `docs/EVENTS_SCHEMAS.md`        | ✅ catálogo completo (follow-up 2026-04-24) | `apis-integracoes/ACH-014` |

### Observabilidade (gap conhecido)

| Doc           | Status                                                                  | Domínio                            |
| ------------- | ----------------------------------------------------------------------- | ---------------------------------- |
| `docs/SLO.md` | ✅ presente (criado em performance-escalabilidade; validado 2026-04-24) | `observabilidade-operacao/ACH-007` |

### Arquitetura (gap conhecido)

| Doc                          | Status | Origem                        |
| ---------------------------- | ------ | ----------------------------- |
| `docs/GLOSSARY.md`           | ✅     | ACH-010 documentacao-runbooks |
| `docs/architecture/flows.md` | ✅     | ACH-006 documentacao-runbooks |

## Priorização sugerida

Ordenada por risco × valor. Cada item deveria virar issue/épico antes da execução.

1. **`docs/SLO.md`** — alto valor (dá número a "qualidade"); efeito amplo. 1-2 semanas.
2. **`docs/PRIVACY_POLICY.md` + `docs/SUB_PROCESSORS.md`** — obrigação legal LGPD antes de processar dados de clientes em produção. 1 semana (com jurídico).
3. **`docs/VERSIONING.md`** — evita breaking changes caóticas quando tivermos primeiro cliente externo. 2-3 dias.
4. **Primeiro DR drill real** (não é doc, mas valida `docs/runbooks/dr.md`). 1 dia.
5. **`docs/DPIA.md` + `docs/INCIDENT_RESPONSE_PRIVACY.md`** — obrigação legal LGPD; menos urgente que Privacy Policy. 1-2 semanas.
6. **`docs/COOKIE_POLICY.md`** — baixo esforço se tiver pouca analytics. 1 dia.
7. **`docs/FILTERING_AND_SORTING.md`, `docs/EVENTS_SCHEMAS.md`** — qualidade interna; fazer junto com próxima evolução da API. 2-3 dias.
8. **Runbooks `error-rate.md` / `slow-requests.md`** — **não criar preventivamente**; criar na primeira ocorrência para evitar drift.

## Como manter este doc

- PRs que criarem/estenderem docs listados como ❌ ou ⚠ devem atualizar a linha correspondente.
- Runs de auditoria novas que gerarem pedidos documentais devem adicionar seção ou linha aqui.
- Revisão trimestral (fev/mai/ago/nov) — remover itens concluídos; priorizar o que restou.

## Referências

- Achado origem: `Auditoria/documentacao-runbooks/runs/2026-04-19_21-26-25/achados.md#ACH-018`
- Todas as runs arquivadas: `Auditoria/_framework/status-geral.md`
- Report consolidado: `Auditoria/_framework/report-consolidado.md`

---

_Última revisão: 2026-04-24 · Próxima revisão esperada: 2026-07-24_
