# Plano de Correção

## Identificação
- dominio: seguranca
- run_id: 2026-03-26_01-10-00
- data_geracao: 2026-04-04 21:00:00
- total_achados: 14
- corrigiveis: 10
- corrigiveis_parciais: 1
- nao_corrigiveis: 1

## Ordem de Execução

### 1. ACH-001 — BOLA — client update/delete ignora tenantId
- severidade: critico
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/business/clients/adapters/prisma-client-repository.ts
- acao_planejada: Alterar where clause de update() e delete() para incluir tenantId. Adicionar tenantId como parametro obrigatorio nos metodos.
- dependencias: nenhuma
- justificativa_ordem: Severidade critica, sem dependencias, primeiro achado BOLA no modulo clients
- risco_da_correcao: Baixo — adicionar filtro de tenant e update/delete que nao encontra registro retorna erro em vez de afetar dado errado

### 2. ACH-002 — BOLA — tagClient e bulkTag sem tenantId
- severidade: critico
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/api/src/routers/clients.ts, packages/business/clients/adapters/prisma-tag-repository.ts
- acao_planejada: Passar ctx.tenant.tenantId para tagClient/bulkTag no router. Validar que clientId e tagId pertencem ao tenant no repository antes de criar associacao.
- dependencias: nenhuma
- justificativa_ordem: Severidade critica, mesmo modulo clients que ACH-001, proximidade de arquivo
- risco_da_correcao: Baixo — adicionar validacao de ownership antes de criar associacao

### 3. ACH-003 — BOLA — listPayments e markPaid sem tenantId
- severidade: critico
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/api/src/routers/sales.ts, packages/business/sales/adapters/prisma-payment-repository.ts
- acao_planejada: Passar ctx.tenant.tenantId para listPayments/markPaid no router. Alterar repository para filtrar por tenantId via join com Sale.
- dependencias: nenhuma
- justificativa_ordem: Severidade critica, ultimo achado BOLA critico
- risco_da_correcao: Medio — payment nao tem tenantId direto, precisa join com sale. Verificar schema Prisma.

### 4. ACH-004 — BOLA — getRecipients sem tenantId
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/api/src/routers/campaigns.ts
- acao_planejada: Passar ctx.tenant.tenantId para getRecipients. Validar que campaign pertence ao tenant antes de retornar recipients.
- dependencias: nenhuma
- justificativa_ordem: Alto, mesmo padrao BOLA, ultimo achado de autorizacao
- risco_da_correcao: Baixo — adicionar filtro de tenant na query

### 5. ACH-007 — Ausencia total de rate limiting
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/api/src/trpc/trpc.ts, packages/business/shared/
- acao_planejada: Instalar pacote de rate limiting. Criar middleware tRPC de rate limiting usando Redis. Aplicar como middleware global em publicProcedure e protectedProcedure com limites diferenciados.
- dependencias: nenhuma
- justificativa_ordem: Alto, fundacao para ACH-005 e ACH-006
- risco_da_correcao: Medio — middleware global afeta todos os endpoints. Limites devem ser generosos para nao bloquear uso legitimo.

### 6. ACH-005 — Sem brute-force protection em OTP
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/business/auth/use-cases/verify-otp.ts
- acao_planejada: Adicionar contador de tentativas falhas por telefone usando Redis. Bloquear apos 5 falhas por 15 minutos. Retornar erro especifico quando bloqueado.
- dependencias: ACH-007 (infra Redis rate limiting)
- justificativa_ordem: Alto, depende da infra de rate limiting criada em ACH-007
- risco_da_correcao: Baixo — adicionar check antes de verificar OTP

### 7. ACH-006 — Sem rate limiting em envio de OTP
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/business/auth/use-cases/send-otp.ts
- acao_planejada: Adicionar rate limiting especifico para envio de OTP: max 3 por telefone por hora usando Redis.
- dependencias: ACH-007 (infra Redis rate limiting)
- justificativa_ordem: Alto, depende da infra criada em ACH-007
- risco_da_correcao: Baixo — adicionar check antes de enviar OTP

### 8. ACH-009 — Sem RBAC implementado
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/api/src/trpc/trpc.ts, apps/api/src/routers/team.ts
- acao_planejada: Criar roleProtectedProcedure factory com check de role minimo. Aplicar em routers administrativos (team, platform).
- dependencias: nenhuma
- justificativa_ordem: Medio, independente, autorizacao
- risco_da_correcao: Medio — precisa mapear quais routers sao administrativos sem quebrar acesso de consultoras

### 9. ACH-008 — Webhook WhatsApp sem HMAC
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/business/messaging/adapters/whatsapp-webhook-handler.ts
- acao_planejada: Implementar verificacao HMAC-SHA256 no handler de webhook. Validar X-Hub-Signature contra WHATSAPP_API_TOKEN. Rejeitar requests sem assinatura valida.
- dependencias: nenhuma
- justificativa_ordem: Medio, independente, webhook security
- risco_da_correcao: Baixo — adicionar validacao, rejeitar invalidos

### 10. ACH-013 — Sem auditoria de eventos de seguranca
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: packages/business/auth/use-cases/, packages/business/shared/
- acao_planejada: Criar security event logger dedicado. Integrar em send-otp, verify-otp, e login. Logar eventos de seguranca com contexto (userId, tenantId, action, success/failure, IP).
- dependencias: nenhuma
- justificativa_ordem: Medio, parcial — estrutura criada pelo agente, eventos a validar pelo usuario
- risco_da_correcao: Baixo — adicionar logging nao altera fluxo de negocio

### 11. ACH-010 — Health check expoe detalhes de erro
- severidade: baixo
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/api/src/routers/health.ts
- acao_planejada: Remover String(error) da resposta publica. Retornar apenas { status: 'error' }. Manter log interno do erro.
- dependencias: nenhuma
- justificativa_ordem: Baixo, correcao simples
- risco_da_correcao: Nenhum

### 12. ACH-011 — Sem security headers
- severidade: baixo
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/web/next.config.mjs
- acao_planejada: Adicionar securityHeaders em next.config.mjs com CSP, HSTS, X-XSS-Protection, Referrer-Policy, Permissions-Policy.
- dependencias: nenhuma
- justificativa_ordem: Baixo, config
- risco_da_correcao: Baixo — CSP restritivo pode bloquear recursos legitimos, usar modo report-only inicialmente

### 13. ACH-012 — OTP logado em plaintext
- severidade: baixo
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/business/auth/use-cases/send-otp.ts
- acao_planejada: Remover codigo OTP do log. Manter apenas log de que OTP foi enviado para o telefone (sem o codigo).
- dependencias: nenhuma
- justificativa_ordem: Baixo, correcao trivial
- risco_da_correcao: Nenhum

## Achados Não Corrigíveis

### ACH-014 — Validacao Zod excelente
- motivo: Achado positivo (informativo). Nao ha problema a corrigir. A validacao com Zod esta bem implementada.
- acao_recomendada_ao_usuario: Manter padrao atual. Considerar adicionar .max() em campos de texto livre.

## Resumo do Plano
- Total a corrigir: 12
- Total parcial (requer validação humana após correção): 1
- Total não corrigível (ação humana necessária): 1
- Estimativa de commits: 13
