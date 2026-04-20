# Progresso da Correção

## Identificação
- dominio: codigo-manutenibilidade
- run_id: 2026-04-18_21-45-58
- branch: fix/codigo-manutenibilidade/2026-04-18_21-45-58
- data_inicio: 2026-04-20 19:05:00
- ultima_atualizacao: 2026-04-20 20:30:00
- fase_atual: revisor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 20
- corrigidos_executor: 20
- revisados_revisor: 0
- corrigidos_pelo_revisor: 0
- ja_resolvidos_por_outra_run: 2
- nao_corrigiveis: 0
- nao_aprovados: 0
- pendentes: 0

## Mapa commit_executor por achado (Fase Executor concluída)
- ACH-010: 3deb49a — packages/shared/src/constants/timings.ts
- ACH-019: 15e44cd — comentários WHY em cache.ts
- ACH-022: ed9adeb — PrismaOtpRepository recebe RedisLike via construtor
- ACH-020: b191603 — CLAUDE.md convenção de use-case
- ACH-021: 00f8920 — ESLint no-restricted-imports + normaliza clients.ts
- ACH-009: aaf7fc7 — IdempotencyRedis interface explícita
- ACH-004: 401646c — clients router reusa schemas de @wbc/validators
- ACH-012: bfa694d — enum SaleStatus/PaymentMethod centralizado
- ACH-015: 7f1b2a0 — chunk pipeline Redis SCAN (lotes de 500)
- ACH-017: 7b8cf73 — dividir getDashboard em métodos por métrica
- ACH-018: 9e36cf4 — mapper domain-error → tRPC expandido
- ACH-007: 8bf5e25 — extrai resolveWorkspaceMembership
- ACH-013: 6dc3e91 — sementar bootstrap() async no worker (parcial)
- ACH-003: a153f1c — composition-root.ts com getRepositories() (parcial)
- ACH-006: 863477d — doc de follow-up PrismaClient via constructor (parcial)
- ACH-002: 2a91b02 — barrels auth/clients expõem só domain/ports
- ACH-005: 6dcaaa0 — subpath exports em @wbc/shared + SPLIT.md (parcial)
- ACH-011: 3ecbfe0 — pickFields/pickDefinedFields helpers (parcial)
- ACH-008: d8ab37c — doc split plan auth.ts (parcial)
- ACH-016: cd08a76 — doc padrão domain events (parcial)

## Achados

### ACH-001
- titulo: TODOs críticos em auth — token storage, email sender e reset não implementados
- severidade: critico
- classificacao: ja_resolvido_por_outra_run
- status_executor: nao_aplicavel
- status_revisor: nao_aplicavel
- commit_executor: 5d3072c (run seguranca/2026-04-18_22-06-18)
- commit_revisor: none
- observacoes: Resolvido pelo fix ACH-001 da correção de seguranca — AuthTokenStore (Redis one-shot), RedisAuthTokenStore adapter, request/reset password e email-verification reescritos, ResendEmailSender real com requireEnv em produção.

### ACH-014
- titulo: Acesso a process.env disperso sem camada de configuração tipada
- severidade: medio
- classificacao: ja_resolvido_por_outra_run
- status_executor: nao_aplicavel
- status_revisor: nao_aplicavel
- commit_executor: 491192b (run seguranca/2026-04-18_22-06-18)
- commit_revisor: none
- observacoes: Resolvido pelo fix ACH-012 da correção de seguranca — packages/shared/src/env.ts ganhou validateEnv estendido com REQUIRED_IN_PRODUCTION, authSecretSchema com min(32) + refusal de padrões fracos, e helper requireEnv(name). Adapters DeepSeek e WhatsApp-N2 passaram a chamar requireEnv em produção.

### ACH-010
- titulo: Números mágicos espalhados para TTLs, intervalos, janelas e thresholds
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-022
- titulo: Duplicação de helper getRedis() entre adapter de auth e lib de api
- severidade: baixo
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-019
- titulo: Comentários em caminhos críticos descrevem O QUÊ, não o PORQUÊ
- severidade: baixo
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-020
- titulo: Estilo misto (classe vs função) para use-cases sem critério documentado
- severidade: baixo
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-021
- titulo: Importações relativas profundas em vez dos aliases @wbc/*
- severidade: informativo
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-009
- titulo: Type casting `as unknown as X` em mappers Prisma e Redis sem justificativa
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-012
- titulo: Literais de status/enum espalhados em filtros Prisma
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-004
- titulo: Schemas Zod duplicados entre packages/validators e routers inline
- severidade: alto
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-018
- titulo: Ausência de mapper testável de erros de domínio → HTTP/tRPC
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-002
- titulo: index.ts de packages/business expõe adapters e use-cases sem barreira
- severidade: alto
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-007
- titulo: Callback jwt em auth.config.ts com lógica complexa e estado mutável
- severidade: alto
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-008
- titulo: Router auth.ts com 391 linhas e 17 procedures heterogêneas
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-013
- titulo: Side-effects pesados no entry-point ao importar módulos
- severidade: alto
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-015
- titulo: cacheInvalidatePattern sem batching/backpressure em Redis SCAN
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-003
- titulo: Ausência de composition root — repositórios instanciados como singletons no topo dos routers
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-006
- titulo: Singleton global de PrismaClient em packages/db sem contrato de ciclo de vida
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-011
- titulo: Duplicação de mapeamento entidade↔Prisma em múltiplos adapters
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-005
- titulo: packages/shared é saco de utilitários incoeso
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-016
- titulo: Comunicação inter-módulo sem domain events
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-017
- titulo: Analytics getDashboard() god function
- severidade: baixo
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none
