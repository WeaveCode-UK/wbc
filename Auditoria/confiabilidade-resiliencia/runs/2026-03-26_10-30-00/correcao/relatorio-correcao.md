# Relatório — confiabilidade-resiliencia

## Identificação
- dominio: confiabilidade-resiliencia
- run_id: 2026-03-26_10-30-00
- status: concluido

## Resumo
De 15 achados: 5 corrigidos, 5 pré-resolvidos por domínios anteriores, 2 parciais de infraestrutura, 3 não corrigíveis. Correções: handlers com Promise.allSettled+timeout, logging de erros WhatsApp, tenant middleware hardened (rejeita queries sem tenantId), cache invalidation por evento, Sentry sampling 10%→30%.

## Corrigidos
- ACH-005 (medio) — Promise.allSettled com 30s timeout por handler
- ACH-007 (medio) — Logging com contexto em WhatsApp adapter
- ACH-003 (alto) — Tenant middleware rejeita queries sem tenantId
- ACH-013 (baixo) — Handler de invalidação de cache por TENANT_PLAN_CHANGED
- ACH-014 (baixo) — Sentry tracesSampleRate 10%→30%

## Pré-resolvidos
- ACH-004 (alto) — Timeouts em HTTP (apis-integracoes)
- ACH-009 (alto) — Rate limiting (seguranca)
- ACH-011 (medio) — Pool config (.env.example, performance)
- ACH-006 (alto) — Deduplicação (parcial, Set em memória mantido)
- ACH-012 (medio) — DLQ processor (arquitetura)

## Não Corrigíveis
- ACH-001 (medio) — PG SPOF (infraestrutura de produção)
- ACH-002 (medio) — Redis SPOF (infraestrutura de produção)
- ACH-008 (alto) — Outbox backoff (requer redesign do pipeline)
- ACH-010 (alto) — Circuit breaker (requer decisão de biblioteca)
- ACH-015 (baixo) — Runbooks (documentação operacional)

## Commits
1. 0a78413 init | 2. 59dbafd ACH-005 | 3. d2fb40a ACH-007
4. 5adfb7e ACH-003 | 5. be8fc4f ACH-013 | 6. 7076e1f ACH-014
