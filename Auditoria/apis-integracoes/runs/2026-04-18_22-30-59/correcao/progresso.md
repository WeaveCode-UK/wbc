# Progresso da Correção

## Identificação
- dominio: apis-integracoes
- run_id: 2026-04-18_22-30-59
- branch: fix/apis-integracoes/2026-04-18_22-30-59
- data_inicio: 2026-04-20 22:30:00
- ultima_atualizacao: 2026-04-20 22:30:00
- fase_atual: executor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 20
- corrigidos_executor: 0
- revisados_revisor: 0
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 0
- nao_aprovados: 0
- pendentes: 20

## Achados

### ACH-017
- titulo: event-publisher falha hard se OutboxPort não inicializado
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-013
- titulo: Mapper domain → TRPCError incompleto
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: complemento de correção de codigo-manutenibilidade (run 2026-04-18_21-45-58 / ACH-018)

### ACH-018
- titulo: Paginação permite page arbitrariamente alto
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-015
- titulo: Integrações externas sem timeout/retry consistentes
- severidade: alto
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: cria helper compartilhado

### ACH-011
- titulo: Outbox sem schema Zod por tipo de evento
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: migração dos eventos existentes é follow-up documentado

### ACH-012
- titulo: Payloads de job BullMQ sem schema Zod
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: pareado com ACH-011

### ACH-019
- titulo: Adapters não validam shape de respostas externas
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-016
- titulo: Idempotência outbound ausente em WhatsApp/Email
- severidade: alto
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-001
- titulo: Idempotência é opcional — só sales e finance
- severidade: critico
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: rollout gradual — middleware gera key estável se ausente e emite warn

### ACH-003
- titulo: Webhooks inbound — MP sem handler e WhatsApp sem rota HTTP
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: secrets e teste E2E ficam como pendência humana

### ACH-004
- titulo: Webhook WhatsApp sem proteção contra replay
- severidade: alto
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: depende de Redis disponível

### ACH-006
- titulo: Response shape heterogêneo
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: helpers + doc; migração é follow-up

### ACH-007
- titulo: Paginação sem metadata
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: aplica aos 4 routers principais

### ACH-010
- titulo: Datas/timestamps sem contrato explícito
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-008
- titulo: Schemas Zod não totalmente centralizados
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: 13 routers; ESLint rule já existe

### ACH-009
- titulo: Filtros/ordenação sem convenção
- severidade: baixo
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: doc de convenção; migração é follow-up

### ACH-002
- titulo: Sem versionamento de API
- severidade: critico
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: acordo formal com mobile é pendência humana

### ACH-005
- titulo: Deprecation path ausente
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: doc + script check; CI integration é follow-up

### ACH-014
- titulo: Sem OpenAPI/contrato externo
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: doc avaliativo + exemplo

### ACH-020
- titulo: DLQ consumer apenas loga
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: Sentry/Slack via env opcional; sem credenciais reais configuradas
