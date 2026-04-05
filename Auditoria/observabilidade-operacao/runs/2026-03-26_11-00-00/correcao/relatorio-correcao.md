# Relatório — observabilidade-operacao

## Identificação
- dominio: observabilidade-operacao
- run_id: 2026-03-26_11-00-00
- status: concluido

## Resumo
Corrigidos 5 achados em commit único: Sentry.captureException no error handler tRPC, handlers para unhandledRejection/uncaughtException no worker, SENTRY_DSN no .env.example, success logging no outbox processor.

## Corrigidos
- ACH-003 (alto) — Sentry.captureException integrado no domainErrorMiddleware
- ACH-005 (alto) — unhandledRejection + uncaughtException handlers no worker
- ACH-010 (baixo) — Success logging no outbox processor
- ACH-011 (baixo) — SENTRY_DSN adicionado ao .env.example

## Não Corrigíveis / Parciais
- ACH-001 (critico) — Métricas: requer instalação de prom-client e design de métricas
- ACH-002 (alto) — Tracing: requer OpenTelemetry setup
- ACH-004 (alto) — Worker Sentry: requer Sentry DSN e config separada
- ACH-006 (alto) — Monitoramento: infraestrutura (Grafana/Datadog)
- ACH-007 (medio) — Health HTTP: requer route HTTP fora do tRPC
- ACH-008 (medio) — Web console.error: requer @sentry/nextjs config
- ACH-009 (medio) — RequestId: requer refactor do tRPC context

## Commits
1. c84fdf5 init | 2. b7cfb2f ACH-003/005/010/011
