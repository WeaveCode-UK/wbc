# Plano de Correção

## Identificação
- dominio: apis-integracoes
- run_id: 2026-03-26_01-50-00
- total_achados: 9
- corrigiveis: 5
- corrigiveis_parciais: 2
- nao_corrigiveis: 2

## Ordem de Execução

### 1. ACH-001 — Domain errors não mapeados para códigos tRPC
- severidade: alto
- classificacao: corrigivel
- acao: Criar error handler global em tRPC que mapeie domain errors para NOT_FOUND/BAD_REQUEST/CONFLICT

### 2. ACH-007 — Bulk operations sem limite de array
- severidade: baixo
- classificacao: corrigivel
- acao: Adicionar .max() em arrays de bulkTag e recipientIds

### 3. ACH-005 — WhatsApp sem timeout/retry
- severidade: medio
- classificacao: corrigivel
- acao: Adicionar AbortController timeout + retry para 5xx/429

### 4. ACH-006 — DeepSeek AI sem timeout/retry
- severidade: baixo
- classificacao: corrigivel
- acao: Adicionar AbortController timeout + retry

### 5. ACH-008 — Event handlers não registrados
- severidade: medio
- classificacao: corrigivel
- acao: Verificar e completar registros de handlers (parcialmente resolvido pela auditoria de arquitetura)

### 6. ACH-002 — Ausência de idempotência
- severidade: alto
- classificacao: corrigivel_parcial
- acao: Implementar middleware de idempotência com Redis

### 7. ACH-004 — Ausência de documentação OpenAPI
- severidade: medio
- classificacao: corrigivel_parcial
- acao: Avaliar trpc-openapi — requer decisão de design

## Não Corrigíveis
- ACH-003 (medio) — Versionamento de API: decisão arquitetural, não resolvível via código
- ACH-009 (info) — Achado positivo
