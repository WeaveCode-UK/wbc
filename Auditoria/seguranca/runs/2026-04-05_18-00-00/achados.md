# Achados da Auditoria

## Identificacao
- dominio: seguranca
- run_id: 2026-04-05_18-00-00
- ultima_atualizacao: 2026-04-05 18:30:00

## Achados Registrados

### ACH-001
- titulo: Tenant middleware nao cobre 7 modelos multi-tenant expostos
- severidade: medio
- categoria: autorizacao-multi-tenant
- status: aberto
- resumo: 7 modelos com tenantId nao estao no TENANT_SCOPED_MODELS do middleware: Notification, LandingPage, Team, Invite, OnboardingProgress, ClientWishlist, GiftSuggestor. Acessos diretos a estes modelos via Prisma nao recebem filtro automatico de tenantId.

#### Evidencia
- arquivo_ou_area: packages/db/src/middleware/tenant-middleware.ts (linha 4-9)
- detalhe: Set TENANT_SCOPED_MODELS contem 19 modelos, mas 7 modelos multi-tenant estao ausentes. CommunityTemplate e OutboxEvent sao legitimamente globais. Session, TenantMember e Subscription sao geridos pelo auth layer.

#### Impacto
- tecnico: queries sem filtro de tenant podem retornar dados de outros tenants
- negocio: risco de vazamento de dados entre consultoras

#### Recomendacao
- acao_sugerida: adicionar Notification, LandingPage, Team, Invite, OnboardingProgress, ClientWishlist e GiftSuggestor ao TENANT_SCOPED_MODELS
- prioridade: alta

### ACH-002
- titulo: CSP com unsafe-inline e unsafe-eval no script-src
- severidade: medio
- categoria: headers-seguranca
- status: aberto
- resumo: Content-Security-Policy inclui 'unsafe-inline' e 'unsafe-eval' no script-src, enfraquecendo a protecao contra XSS. Necessario para Next.js/React em dev, mas deveria usar nonces em producao.

#### Evidencia
- arquivo_ou_area: apps/web/next.config.mjs (linha 13)
- detalhe: script-src 'self' 'unsafe-inline' 'unsafe-eval'

#### Impacto
- tecnico: XSS refletido ou stored poderia executar scripts arbitrarios
- negocio: risco de exfiltracao de dados do usuario

#### Recomendacao
- acao_sugerida: usar nonces via next/headers ou remover unsafe-eval em producao (Next.js 15 suporta strict CSP com nonces)
- prioridade: media

### ACH-003
- titulo: Middleware web permite /api/* sem autenticacao por default
- severidade: baixo
- categoria: controle-acesso
- status: aberto
- resumo: Next.js middleware (src/middleware.ts linha 9) faz early return para todas as rotas /api, delegando auth para o tRPC layer. Novas rotas API adicionadas fora do tRPC seriam publicas por default.

#### Evidencia
- arquivo_ou_area: apps/web/src/middleware.ts (linha 9)
- detalhe: if (pathname.startsWith('/api')) return NextResponse.next()

#### Impacto
- tecnico: rota API futura poderia ser exposta acidentalmente
- negocio: baixo — todas as rotas atuais usam protectedProcedure ou sao intencionalmente publicas

#### Recomendacao
- acao_sugerida: manter como esta mas documentar que novas rotas API fora do tRPC devem ter auth propria
- prioridade: baixa

### ACH-004
- titulo: Controles de seguranca bem implementados (positivo)
- severidade: informativo
- categoria: postura-geral
- status: confirmado
- resumo: Projeto demonstra postura de seguranca solida apos correcoes: rate limiting (30/100 rpm), security event logging (9 tipos), bcrypt cost 12, JWT 15min, HSTS preload, CSP, CORS restrito, tenant middleware com reject, Serializable isolation em stock/cashback, circuit breaker em servicos externos.

#### Evidencia
- arquivo_ou_area: multiplos — trpc.ts, rate-limit-middleware.ts, security-logger.ts, auth.config.ts, tenant-middleware.ts, next.config.mjs
- detalhe: controles distribuidos de forma consistente em todas as camadas

#### Impacto
- tecnico: postura defensiva adequada para CRM multi-tenant
- negocio: risco de incidentes de seguranca significativamente reduzido

#### Recomendacao
- acao_sugerida: manter e expandir conforme novas funcionalidades forem adicionadas
- prioridade: baixa
