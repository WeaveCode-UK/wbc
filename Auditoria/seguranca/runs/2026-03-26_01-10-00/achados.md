# Achados da Auditoria

## Identificação
- dominio: seguranca
- run_id: 2026-03-26_01-10-00
- ultima_atualizacao: 2026-03-26 01:40:00

## Severidades Permitidas
- critico
- alto
- medio
- baixo
- informativo

## Status Permitidos
- aberto
- confirmado
- mitigado
- resolvido
- aceito
- nao_aplicavel

## Achados Registrados

### ACH-001
- titulo: BOLA — client update/delete ignora tenantId no repositorio
- severidade: critico
- categoria: autorizacao
- status: confirmado
- resumo: prisma-client-repository.ts usa where: { id } sem tenantId em update() e delete(). Atacante autenticado em tenant A pode modificar ou deletar client de tenant B usando ID direto.

#### Evidencia
- arquivo_ou_area: packages/business/clients/adapters/prisma-client-repository.ts linhas 47-54
- detalhe: update() faz prisma.client.update({ where: { id } }) e delete() faz prisma.client.delete({ where: { id } }) — ambos sem tenantId no where clause.

#### Impacto
- tecnico: Cross-tenant data manipulation/deletion. Violacao de isolamento multi-tenant.
- negocio: Risco de perda de dados de clientes de outros tenants. Violacao de privacidade. Potencial responsabilidade legal.

#### Recomendacao
- acao_sugerida: Alterar where clause para { id, tenantId } em update() e delete(). Usar findFirst com tenantId antes de update/delete como guard.
- prioridade: alta

#### Observacoes
- O middleware de tenant cobre findMany/findFirst, mas update/delete usam where unico por id sem composite check.

---

### ACH-002
- titulo: BOLA — tagClient e bulkTag nao recebem tenantId do router
- severidade: critico
- categoria: autorizacao
- status: confirmado
- resumo: Router clients.ts linhas 100-119 chama tagClient e bulkTag sem ctx.tenant.tenantId. O repositorio cria clientTag sem validar que clientId e tagId pertencem ao mesmo tenant.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/clients.ts linhas 100-119, packages/business/clients/adapters/prisma-tag-repository.ts linhas 30-45
- detalhe: tagClient mutation usa async ({ input }) sem ctx. Repository faz prisma.clientTag.create({ data: { clientId, tagId } }) sem tenantId check.

#### Impacto
- tecnico: Atacante pode associar tags de seu tenant a clientes de outro tenant, causando data corruption cross-tenant.
- negocio: Privacidade violada — atacante descobre existencia de clientes por ID.

#### Recomendacao
- acao_sugerida: Passar ctx.tenant.tenantId para tagClient/bulkTag. Validar que clientId e tagId pertencem ao tenant antes de criar associacao.
- prioridade: alta

#### Observacoes
- none

---

### ACH-003
- titulo: BOLA — listPayments e markPaid ignoram tenantId
- severidade: critico
- categoria: autorizacao
- status: confirmado
- resumo: Router sales.ts linhas 66-76 chama listPayments e markPaid sem ctx.tenant. Repository busca por saleId/paymentId sem validar que pertence ao tenant autenticado. Atacante pode marcar pagamentos de outro tenant como pagos.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/sales.ts linhas 66-76, packages/business/sales/adapters/prisma-payment-repository.ts linhas 6-14
- detalhe: listPayments query usa async ({ input }) sem ctx. markPaid mutation usa async ({ input }) sem ctx. Repository faz where: { saleId } e where: { id } sem tenantId.

#### Impacto
- tecnico: Fraude financeira — atacante marca pagamentos alheios como pagos. Corrupcao de dados financeiros cross-tenant.
- negocio: Risco financeiro direto. Potencial prejuizo para consultoras.

#### Recomendacao
- acao_sugerida: Passar ctx.tenant.tenantId para ambas funcoes. Validar que sale/payment pertence ao tenant antes de qualquer operacao.
- prioridade: alta

#### Observacoes
- getAccountsReceivable no mesmo arquivo ja usa tenantId corretamente — inconsistencia no padrao.

---

### ACH-004
- titulo: BOLA — getRecipients de campaigns nao valida tenantId
- severidade: alto
- categoria: autorizacao
- status: confirmado
- resumo: Router campaigns.ts linha 40-44 chama getRecipients sem ctx.tenant. Atacante pode enumerar IDs de campanhas e obter lista de destinatarios (telefones, nomes) de outro tenant.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/campaigns.ts linhas 40-44
- detalhe: getRecipients query usa async ({ input }) sem ctx. Retorna lista de recipients incluindo dados de contato.

#### Impacto
- tecnico: Vazamento de dados pessoais (telefones, nomes) cross-tenant.
- negocio: Violacao de privacidade. Inteligencia competitiva. Risco legal LGPD.

#### Recomendacao
- acao_sugerida: Passar ctx.tenant.tenantId e validar que campaign pertence ao tenant antes de retornar recipients.
- prioridade: alta

#### Observacoes
- none

---

### ACH-005
- titulo: Sem brute-force protection em verificacao de OTP
- severidade: alto
- categoria: autenticacao
- status: confirmado
- resumo: verify-otp.ts aceita tentativas ilimitadas de verificacao. OTP de 6 digitos (1 milhao de combinacoes) pode ser brute-forced sem penalidade, lockout ou rate limit.

#### Evidencia
- arquivo_ou_area: packages/business/auth/use-cases/verify-otp.ts linhas 14-35
- detalhe: Funcao verifica OTP contra banco, mas nao conta tentativas falhas nem bloqueia apos N falhas. Retorna OtpInvalidError sem rate limiting.

#### Impacto
- tecnico: Account takeover via brute-force de OTP em qualquer telefone.
- negocio: Comprometimento de contas de consultoras. Acesso indevido a dados financeiros e de clientes.

#### Recomendacao
- acao_sugerida: Adicionar contador de tentativas na tabela OtpCode. Bloquear apos 5 falhas por 15 minutos. Implementar rate limiting no endpoint.
- prioridade: alta

#### Observacoes
- none

---

### ACH-006
- titulo: Sem rate limiting em envio de OTP
- severidade: alto
- categoria: autenticacao
- status: confirmado
- resumo: Endpoint send-otp aceita requisicoes ilimitadas por telefone/IP. Atacante pode esgotar quota de SMS, gerar custos, e usar como vetor de spam.

#### Evidencia
- arquivo_ou_area: apps/web/src/app/api/send-otp/route.ts, apps/api/src/routers/auth.ts (sendOtp mutation)
- detalhe: Nenhum middleware de rate limiting encontrado em nenhum lugar da aplicacao. Redis disponivel mas nao usado para throttling.

#### Impacto
- tecnico: DoS via exaustao de quota SMS. Spam de OTP para qualquer telefone.
- negocio: Custo financeiro de SMS. Reputacao da plataforma com operadora.

#### Recomendacao
- acao_sugerida: Implementar rate limiting com Redis: max 3 envios por telefone por hora, max 100 envios globais por IP por hora.
- prioridade: alta

#### Observacoes
- Rate limiting e ausente em toda a aplicacao, nao apenas no OTP.

---

### ACH-007
- titulo: Ausencia total de rate limiting na aplicacao
- severidade: alto
- categoria: protecao operacional
- status: confirmado
- resumo: Nenhum middleware de rate limiting encontrado em nenhum app (api, web). Nenhum pacote de rate limiting instalado. Todos os endpoints estao vulneraveis a abuso e DoS.

#### Evidencia
- arquivo_ou_area: apps/api/package.json (sem express-rate-limit ou similar), apps/web/package.json (idem), busca por "rate", "limit", "throttle" sem resultados
- detalhe: Redis esta disponivel e poderia ser usado para rate limiting distribuido, mas nao e.

#### Impacto
- tecnico: Qualquer endpoint pode ser abusado sem restricao. APIs de mutacao podem ser spammed.
- negocio: Risco de indisponibilidade, custos de infra, degradacao de servico.

#### Recomendacao
- acao_sugerida: Implementar rate limiting global via middleware tRPC ou Express. Usar Redis para storage distribuido. Priorizar endpoints publicos e de mutacao.
- prioridade: alta

#### Observacoes
- none

---

### ACH-008
- titulo: Webhook WhatsApp sem verificacao de assinatura HMAC
- severidade: medio
- categoria: webhooks
- status: confirmado
- resumo: Handler de webhook WhatsApp parseia payload sem verificar X-Hub-Signature. Atacante pode enviar eventos falsos para alterar status de mensagens.

#### Evidencia
- arquivo_ou_area: packages/business/messaging/adapters/whatsapp-webhook-handler.ts linhas 16-28
- detalhe: parseWebhookStatuses() recebe payload e extrai dados sem nenhuma verificacao de assinatura ou origem.

#### Impacto
- tecnico: Eventos falsos podem alterar status de mensagens no sistema. Replay attacks possiveis.
- negocio: Dados de entrega de mensagens nao confiaveis.

#### Recomendacao
- acao_sugerida: Implementar verificacao HMAC-SHA256 usando WHATSAPP_API_TOKEN no header X-Hub-Signature. Rejeitar requisicoes sem assinatura valida.
- prioridade: media

#### Observacoes
- Tambem falta validacao de timestamp para prevenir replay.

---

### ACH-009
- titulo: Sem RBAC implementado — qualquer usuario autenticado acessa todas as funcoes
- severidade: medio
- categoria: autorizacao
- status: confirmado
- resumo: Role esta no JWT (CONSULTANT, LEADER, DIRECTOR, ADMIN) mas nenhum router verifica role antes de executar operacoes. Consultoras podem executar funcoes de admin como addMember com role ADMIN.

#### Evidencia
- arquivo_ou_area: apps/api/src/trpc/trpc.ts (apenas protectedProcedure, sem roleProtectedProcedure), apps/api/src/routers/team.ts linhas 20-26 (addMember sem role check)
- detalhe: Nao existe roleProtectedProcedure ou equivalente. Todas as mutations protegidas aceitam qualquer role autenticado.

#### Impacto
- tecnico: Escalacao de privilegio — qualquer usuario pode executar acoes administrativas.
- negocio: Consultoras podem promover a si mesmas, gerenciar membros de equipe sem autorizacao.

#### Recomendacao
- acao_sugerida: Criar roleProtectedProcedure factory com check de role minimo. Aplicar em routers de team, platform, e operacoes administrativas.
- prioridade: media

#### Observacoes
- none

---

### ACH-010
- titulo: Health check publico expoe detalhes de erro de Redis e PostgreSQL
- severidade: baixo
- categoria: exposicao de dados
- status: confirmado
- resumo: Endpoints publicos health.redis e health.db retornam String(error) quando falham, potencialmente expondo connection strings, versoes e detalhes internos.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/health.ts linhas 11-12, 20-21
- detalhe: return { status: 'error', response: String(error) } em catch blocks de endpoints publicProcedure.

#### Impacto
- tecnico: Information disclosure — atacante pode obter detalhes de infraestrutura.
- negocio: Impacto baixo, mas facilita reconhecimento para ataques direcionados.

#### Recomendacao
- acao_sugerida: Retornar mensagem generica em producao ({ status: 'error' }). Logar detalhes apenas internamente via Sentry/Pino.
- prioridade: baixa

#### Observacoes
- none

---

### ACH-011
- titulo: Ausencia de security headers explicitos (CSP, HSTS)
- severidade: baixo
- categoria: configuracao
- status: confirmado
- resumo: Next.js config nao define headers de seguranca explicitos. Depende apenas dos defaults do framework (X-Content-Type-Options, X-Frame-Options).

#### Evidencia
- arquivo_ou_area: apps/web/next.config.mjs
- detalhe: Nenhuma configuracao de headers em next.config.mjs. Sem Content-Security-Policy, Strict-Transport-Security ou Referrer-Policy.

#### Impacto
- tecnico: Reduz defesa em profundidade. CSP ausente permite carregamento de scripts de terceiros.
- negocio: Impacto baixo para aplicacao interna, mas relevante se houver exposicao publica.

#### Recomendacao
- acao_sugerida: Adicionar securityHeaders em next.config.mjs com CSP, HSTS, X-XSS-Protection e Referrer-Policy.
- prioridade: baixa

#### Observacoes
- none

---

### ACH-012
- titulo: OTP logado em plaintext no modo desenvolvimento
- severidade: baixo
- categoria: exposicao de dados
- status: confirmado
- resumo: send-otp.ts loga codigo OTP completo no console em modo desenvolvimento. Se logs forem capturados em staging/CI, OTP fica exposto.

#### Evidencia
- arquivo_ou_area: packages/business/auth/use-cases/send-otp.ts linhas 26-29
- detalhe: console.log(`[DEV] OTP for ${input.phone}: ${code}`) — gated por NODE_ENV=development.

#### Impacto
- tecnico: Risco em ambientes de staging que usem NODE_ENV=development. OTP em plaintext nos logs.
- negocio: Impacto minimo em producao, mas risco em pre-producao.

#### Recomendacao
- acao_sugerida: Remover OTP do log. Logar apenas que OTP foi enviado para o telefone, sem o codigo.
- prioridade: baixa

#### Observacoes
- none

---

### ACH-013
- titulo: Sem auditoria de eventos de seguranca (login, OTP, mudancas de role)
- severidade: medio
- categoria: protecao operacional
- status: confirmado
- resumo: Nao ha logging estruturado de eventos de seguranca como envio/verificacao de OTP, login, falhas de autenticacao, mudancas de role ou acesso a dados sensíveis. Logging middleware tRPC registra operacoes mas sem contexto de seguranca.

#### Evidencia
- arquivo_ou_area: packages/business/auth/use-cases/send-otp.ts (sem log), verify-otp.ts (sem log), apps/web/src/lib/auth.ts (sem log de login)
- detalhe: logging-middleware.ts registra path e duration mas nao distingue eventos de seguranca de operacoes normais.

#### Impacto
- tecnico: Impossivel investigar incidentes de seguranca. Sem trilha de auditoria para compliance.
- negocio: Risco de compliance LGPD (falta de registro de acesso a dados pessoais).

#### Recomendacao
- acao_sugerida: Criar security event logger dedicado. Registrar: OTP send/verify (sucesso/falha), login, logout, mudancas de role, acesso a dados sensíveis, operacoes cross-tenant bloqueadas.
- prioridade: media

#### Observacoes
- none

---

### ACH-014
- titulo: Validacao de input excelente com Zod — ponto forte
- severidade: informativo
- categoria: validacao de entrada
- status: confirmado
- resumo: Todos os 16 routers usam Zod schemas para validacao de input. Zero uso de z.any(), z.unknown() ou .passthrough(). Campos string limitados, enums tipados, UUIDs validados. Prisma usado exclusivamente com queries parametrizadas — zero risco de SQL injection.

#### Evidencia
- arquivo_ou_area: packages/validators/src/ (15 schema files), apps/api/src/routers/ (16 routers)
- detalhe: Grep por z.any, z.unknown, $queryRawUnsafe, dangerouslySetInnerHTML retorna zero resultados em codigo proprio.

#### Impacto
- tecnico: Superficie de injection praticamente eliminada. Input validation e ponto forte.
- negocio: Reduz risco de exploracoes via input malicioso.

#### Recomendacao
- acao_sugerida: Manter padrao atual. Adicionar .max() em campos de texto de AI e campaigns.
- prioridade: baixa

#### Observacoes
- none
