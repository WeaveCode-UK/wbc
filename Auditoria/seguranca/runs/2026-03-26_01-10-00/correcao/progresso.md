# Progresso da Correção

## Identificação
- dominio: seguranca
- run_id: 2026-03-26_01-10-00
- branch: fix/seguranca/2026-03-26_01-10-00
- data_inicio: 2026-04-04 21:00:00
- ultima_atualizacao: 2026-04-04 21:45:00
- fase_atual: revisor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 13
- corrigidos_executor: 13
- revisados_revisor: 0
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 1
- nao_aprovados: 0
- pendentes: 0

## Achados

### ACH-001
- titulo: BOLA — client update/delete ignora tenantId
- severidade: critico
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: a81e248
- commit_revisor: none
- arquivos_alterados:
  - packages/business/clients/adapters/prisma-client-repository.ts
- descricao_correcao: Adicionado guard findFirst com tenantId antes de update, delete, convertToClient e bulkEditNames. Impede operacao cross-tenant.
- observacoes: Corrigido tambem convertToClient e bulkEditNames que tinham a mesma vulnerabilidade no mesmo arquivo.

### ACH-002
- titulo: BOLA — tagClient e bulkTag sem tenantId
- severidade: critico
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: ee24e3f
- commit_revisor: none
- arquivos_alterados:
  - packages/business/clients/ports/tag-repository.ts
  - packages/business/clients/use-cases/manage-tags.ts
  - packages/business/clients/adapters/prisma-tag-repository.ts
  - apps/api/src/routers/clients.ts
- descricao_correcao: Adicionado tenantId em todo o fluxo tagClient/untagClient/bulkTag/getClientTags. Repository valida ownership de client e tag antes de operar. Router passa ctx.tenant.tenantId. Tambem corrigido delete de tag com guard de tenantId.
- observacoes: none

### ACH-003
- titulo: BOLA — listPayments e markPaid sem tenantId
- severidade: critico
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: a8673a1
- commit_revisor: none
- arquivos_alterados:
  - packages/business/sales/ports/payment-repository.ts
  - packages/business/sales/use-cases/manage-payments.ts
  - packages/business/sales/adapters/prisma-payment-repository.ts
  - apps/api/src/routers/sales.ts
- descricao_correcao: Adicionado tenantId em todo o fluxo listPayments/markPaid. Repository filtra via join sale.tenantId. markPaid usa findFirst guard antes de update.
- observacoes: none

### ACH-004
- titulo: BOLA — getRecipients sem tenantId
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: af4db44
- commit_revisor: none
- arquivos_alterados:
  - packages/business/campaigns/ports/campaign-repository.ts
  - packages/business/campaigns/use-cases/manage-campaigns.ts
  - packages/business/campaigns/adapters/prisma-campaign-repository.ts
  - apps/api/src/routers/campaigns.ts
- descricao_correcao: Adicionado tenantId em getRecipients. Use-case valida ownership da campaign antes de retornar recipients. Repository filtra via join campaign.tenantId. Tambem corrigido delete de campaign com guard.
- observacoes: none

### ACH-007
- titulo: Ausencia total de rate limiting
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: b3ea069
- commit_revisor: none
- arquivos_alterados:
  - apps/api/src/trpc/rate-limit-middleware.ts (novo)
  - apps/api/src/trpc/trpc.ts
- descricao_correcao: Criado rate-limit-middleware.ts usando Redis com sliding window. Integrado em publicProcedure (30 req/min) e protectedProcedure (100 req/min por user+tenant). Retorna TRPCError TOO_MANY_REQUESTS quando excedido.
- observacoes: none

### ACH-005
- titulo: Sem brute-force protection em OTP
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 6bfe0bf
- commit_revisor: none
- arquivos_alterados:
  - packages/business/auth/ports/otp-repository.ts
  - packages/business/auth/adapters/prisma-otp-repository.ts
  - packages/business/auth/use-cases/verify-otp.ts
  - packages/business/auth/domain/errors.ts
- descricao_correcao: Adicionado contador de tentativas falhas via Redis (15min TTL). Bloqueia apos 5 falhas com OtpTooManyAttemptsError. Reset apos sucesso. Port extendido com getFailedAttempts/incrementFailedAttempts/resetFailedAttempts.
- observacoes: none

### ACH-006
- titulo: Sem rate limiting em envio de OTP
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: f50a65f
- commit_revisor: none
- arquivos_alterados:
  - packages/business/auth/ports/otp-repository.ts
  - packages/business/auth/adapters/prisma-otp-repository.ts
  - packages/business/auth/use-cases/send-otp.ts
  - packages/business/auth/domain/errors.ts
- descricao_correcao: Adicionado rate limiting de envio de OTP: max 3 envios por telefone por hora via Redis. OtpSendRateLimitError lancado quando excedido. Port extendido com getSendCount/incrementSendCount.
- observacoes: none

### ACH-009
- titulo: Sem RBAC implementado
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 4c51f66
- commit_revisor: none
- arquivos_alterados:
  - apps/api/src/trpc/trpc.ts
  - apps/api/src/routers/team.ts
- descricao_correcao: Criado roleProtectedProcedure factory com hierarquia CONSULTANT<LEADER<DIRECTOR<ADMIN. Aplicado em addMember e removeMember (minimo LEADER). Retorna FORBIDDEN se role insuficiente.
- observacoes: none

### ACH-008
- titulo: Webhook WhatsApp sem HMAC
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: d3b700c
- commit_revisor: none
- arquivos_alterados:
  - packages/business/messaging/adapters/whatsapp-webhook-handler.ts
- descricao_correcao: Adicionado verifyWebhookSignature() com HMAC-SHA256 usando WHATSAPP_APP_SECRET. WebhookSignatureError para requests sem assinatura valida. Funcao exportada para ser chamada antes de parseWebhookStatuses.
- observacoes: none

### ACH-013
- titulo: Sem auditoria de eventos de seguranca
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: d0e53e1
- commit_revisor: none
- arquivos_alterados:
  - apps/api/src/lib/security-logger.ts (novo)
- descricao_correcao: Criado security-logger.ts com tipos de eventos (otp.send, otp.verify.success/failed/locked, auth.login, rbac.forbidden, cross_tenant_blocked). Logger dedicado via pino com contexto (phone, userId, tenantId, timestamp). Estrutura pronta para integracao nos use-cases.
- observacoes: Correcao parcial — logger criado mas integracao nos use-cases individuais requer validacao humana sobre quais eventos sao prioritarios para a primeira iteracao.

### ACH-010
- titulo: Health check expoe detalhes de erro
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 9d5ee89
- commit_revisor: none
- arquivos_alterados:
  - apps/api/src/routers/health.ts
- descricao_correcao: Removido String(error) da resposta publica. Retorna apenas { status: 'error' }. Erro logado internamente via pino logger.
- observacoes: none

### ACH-011
- titulo: Sem security headers
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: b56c683
- commit_revisor: none
- arquivos_alterados:
  - apps/web/next.config.mjs
- descricao_correcao: Adicionado securityHeaders com HSTS, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy e CSP. Aplicados em todas as rotas via headers().
- observacoes: CSP inclui unsafe-inline/unsafe-eval para compatibilidade com Next.js. Refinar em producao.

### ACH-012
- titulo: OTP logado em plaintext
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 2aba2f1
- commit_revisor: none
- arquivos_alterados:
  - packages/business/auth/use-cases/send-otp.ts
- descricao_correcao: Removido codigo OTP do console.log. Mantido apenas log de que OTP foi enviado para o telefone, sem expor o codigo.
- observacoes: none

### ACH-014
- titulo: Validacao Zod excelente
- severidade: informativo
- classificacao: nao_corrigivel
- status_executor: nao_aplicavel
- status_revisor: nao_aplicavel
- commit_executor: none
- commit_revisor: none
- observacoes: Achado positivo, sem acao necessaria
