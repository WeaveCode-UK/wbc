# Progresso da Correção

## Identificação
- dominio: seguranca
- run_id: 2026-04-18_22-06-18
- branch: fix/seguranca/2026-04-18_22-06-18
- data_inicio: 2026-04-19 22:20:00
- ultima_atualizacao: 2026-04-20 14:30:00
- fase_atual: executor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 27
- corrigidos_executor: 16
- revisados_revisor: 0
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 1
- nao_aprovados: 0
- pendentes: 11

## Achados

### ACH-012
- titulo: Credenciais externas (DeepSeek, WhatsApp) com fallback silencioso `?? ""`
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 491192b
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/env.ts
  - packages/business/ai/adapters/deepseek-adapter.ts
  - packages/business/messaging/adapters/whatsapp-n2-adapter.ts
- descricao_correcao: Estendido `validateEnv` em packages/shared/src/env.ts para validar DEEPSEEK_API_KEY, WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_APP_SECRET, MERCADOPAGO_ACCESS_TOKEN e RESEND_API_KEY. Em produção, REQUIRED_IN_PRODUCTION força não-vazio. Adicionado helper `requireEnv(name)` que lança se ausente. Adapters DeepSeek e WhatsApp em produção chamam `requireEnv` (fail fast); em dev mantêm fallback para stub.
- observacoes: AUTH_SECRET também ganhou validação min(32) + refusal de padrões fracos (preparação para ACH-027).

### ACH-013
- titulo: `WHATSAPP_APP_SECRET` não documentado em `.env.example` / `.env.production.example`
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 7648208
- commit_revisor: none
- arquivos_alterados:
  - .env.example
  - .env.production.example
  - turbo.json
- descricao_correcao: Adicionado WHATSAPP_APP_SECRET e RESEND_API_KEY a ambos `.env.example`, com nota da finalidade. Ambos incluídos em turbo.json globalEnv. ACH-012 já adicionou-os ao Zod env como required-em-produção.
- observacoes: none

### ACH-027
- titulo: `.env` de desenvolvimento usa `AUTH_SECRET` fraco e previsível
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: f343cb6
- commit_revisor: none
- arquivos_alterados:
  - .env.example
  - .env.production.example
- descricao_correcao: Templates orientam geração via `openssl rand -base64 48` e usam placeholders neutros (REPLACE_WITH_OPENSSL_RAND_BASE64_48). Validação de min(32) e refusal de padrões fracos (change/secret/wbc-dev/placeholder/generate) já implementada no authSecretSchema do env.ts (commit 491192b - ACH-012).
- observacoes: O .env local do desenvolvedor não é tocado por ser gitignored; a validação de startup pegará valores fracos.

### ACH-020
- titulo: `security-logger` sem redaction de `phone`, `userId`, `tenantId`
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 890a51f
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/redaction.ts (novo)
  - packages/shared/src/security-logger.ts
  - packages/shared/src/index.ts
- descricao_correcao: Criado packages/shared/src/redaction.ts com redactPhone (mascarar com *), redactId (truncar a 8 chars + …), redactEmail (sha256 truncado), e redactSecurityFields que aplica em uma só passada. security-logger usa redactSecurityFields antes de console.log/warn. Interface SecurityEvent ganhou accountId, email, jti.
- observacoes: none

### ACH-019
- titulo: Email do usuário registrado em logs de falha de autenticação
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 094ebaa
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/lib/auth.config.ts
- descricao_correcao: Substituído `detail: \`credentials: ${credentials.email}\`` por `email: credentials.email` (campo padronizado, redactado via sha256 truncado pelo security-logger).
- observacoes: none

### ACH-022
- titulo: `console.error` em adapter WhatsApp pode logar headers/payloads
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 1d9d567
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/package.json
  - packages/shared/src/logger.ts (novo)
  - packages/shared/src/index.ts
  - packages/business/messaging/adapters/whatsapp-n2-adapter.ts
- descricao_correcao: Criado createLogger central em packages/shared (pino, mesma config dos apps/api e worker). WhatsApp adapter substitui console.error por logger.warn/error com structured fields {requestId, status, phone (redactPhone), type, attempt}. Pino dependency adicionado ao packages/shared.
- observacoes: none

### ACH-021
- titulo: Sentry captura erros sem `beforeSend` para redactar PII
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 58a1108
- commit_revisor: none
- arquivos_alterados:
  - packages/shared/src/sentry-redaction.ts (novo)
  - packages/shared/src/index.ts
  - apps/api/src/lib/sentry.ts
  - apps/web/sentry.server.config.ts
  - apps/web/sentry.edge.config.ts
  - apps/web/sentry.client.config.ts
- descricao_correcao: Criado redactSentryEvent puro em packages/shared (regex de keys sensíveis: authorization, cookie, password, token, secret, api_key, otp, email; recursivo até 6 níveis; truncamento >2000 chars; remove user.email/ip_address). Aplicado em beforeSend e beforeBreadcrumb dos 4 inits Sentry (api, web server/edge/client). sendDefaultPii=false. Sample reduzido em dev (0.1).
- observacoes: none

### ACH-003
- titulo: Autenticação por credenciais sem proteção contra brute-force
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: cdc95a7
- commit_revisor: none
- arquivos_alterados:
  - packages/business/auth/ports/login-attempt-tracker.port.ts (novo)
  - packages/business/auth/adapters/redis-login-attempt-tracker.adapter.ts (novo)
  - packages/business/auth/use-cases/authenticate-with-credentials.use-case.ts
  - apps/web/src/lib/auth.config.ts
- descricao_correcao: Criado LoginAttemptTracker port + RedisLoginAttemptTracker adapter (sha256 das chaves, TTL 15min, threshold 5). AuthenticateWithCredentials recebe tracker opcional; chama isLocked() antes do bcrypt, recordFailure() em falha, clearAttempts() em sucesso. Auth.config injeta tracker com Redis singleton. IP é extraído via extractIp(request) no callback authorize do NextAuth (bucket por email+IP).
- observacoes: Policy padrão (DEFAULT_LOCKOUT_POLICY) customizável por ambiente.

### ACH-004
- titulo: Enumeração de contas por mensagens de erro distintas
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: e09b73d
- commit_revisor: none
- arquivos_alterados:
  - packages/business/auth/use-cases/authenticate-with-credentials.use-case.ts
- descricao_correcao: Exceção única InvalidCredentialsError com mensagem "E-mail ou senha inválidos" para conta ausente, OAuth-only ou senha errada. Bcrypt.verify é sempre executado usando TIMING_DECOY_HASH (hash fixo) quando a conta não existe, equalizando tempo de resposta contra ataque por timing.
- observacoes: Commit feito antes do ACH-003 (eram sequenciais no mesmo arquivo).

### ACH-018
- titulo: Rate-limit assimétrico e frouxo nos endpoints sensíveis
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 76ab1c0
- commit_revisor: none
- arquivos_alterados:
  - apps/api/src/trpc/rate-limit-middleware.ts
  - apps/api/src/trpc/context.ts
  - apps/api/src/trpc/trpc.ts
- descricao_correcao: Adicionado SENSITIVE_ROUTE_LIMITS (prefixo → config) com limites específicos: auth.login 5/min, auth.requestPasswordReset 3/h, auth.acceptInvite 10/15min, auth.sendOtp 5/h, auth.verifyOtp 5/min, etc. Context estendido com ipAddress opcional + helper extractIpFromHeaders (x-forwarded-for primeiro hop; x-real-ip fallback). publicProcedure agora identifica por IP quando anônimo, substituindo 'anonymous' global.
- observacoes: Handler HTTP precisa chamar createContext com IP extraído para ativar identificador por IP; infraestrutura pronta.

### ACH-002
- titulo: OTP registrado em console.log em ambiente não-produção
- severidade: critico
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 61afd51
- commit_revisor: none
- arquivos_alterados:
  - packages/business/auth/use-cases/send-otp.ts
  - packages/business/auth/use-cases/__tests__/send-otp.test.ts
- descricao_correcao: Removido o campo `code` de SendOtpResult (não exposto ao caller). Removido o `console.log` dev. Security event logado apenas com accountId. Teste atualizado para afirmar ausência de `code` no retorno.
- observacoes: O código permanece persistido via OtpRepository e é consumido apenas pelo canal de entrega (e-mail/SMS) configurado.

### ACH-001
- titulo: reset-password e verify-email não implementados
- severidade: critico
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 5d3072c
- commit_revisor: none
- arquivos_alterados:
  - packages/business/auth/ports/auth-token-store.port.ts (novo)
  - packages/business/auth/adapters/redis-auth-token-store.adapter.ts (novo)
  - packages/business/auth/use-cases/request-password-reset.use-case.ts
  - packages/business/auth/use-cases/request-email-verification.use-case.ts
  - packages/business/auth/use-cases/reset-password.use-case.ts
  - packages/business/auth/use-cases/verify-email.use-case.ts
  - packages/business/auth/adapters/resend-email-sender.adapter.ts
- descricao_correcao: AuthTokenStore (port) + RedisAuthTokenStore (adapter) — tokens 32-byte hex, armazenados como `${accountId, kind}` em JSON com TTL. consume() usa GETDEL para one-shot. index set por accountId+kind permite revoke em lote. Password reset TTL 1h, email verification TTL 24h. reset-password.use-case valida password min 8 + hash bcrypt + update account; verify-email marca emailVerified=now. ResendEmailSender: requireEnv em produção (fail fast), chamada HTTP real para api.resend.com; dev loga apenas metadata (sem body que pode conter tokens).
- observacoes: Parcial — integração em produção requer configuração de RESEND_API_KEY e domínio Resend verificado (ação humana). Router tRPC e UI devem injetar ResendEmailSender + RedisAuthTokenStore nos use-cases.

### ACH-005
- titulo: `findByToken` de invites sem validação de status e expiração
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 98403ea
- commit_revisor: none
- arquivos_alterados:
  - packages/business/auth/adapters/prisma-invite.repository.ts
- descricao_correcao: findByToken agora usa findFirst com where { token, status: 'PENDING', expiresAt: { gt: now } }. Invites EXPIRED ou ACCEPTED retornam null mesmo com token válido.
- observacoes: none

### ACH-006
- titulo: Sessão JWT de 15 min sem revogação e sem rotation explícita
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 7d6562a
- commit_revisor: none
- arquivos_alterados:
  - packages/business/auth/ports/jwt-blacklist.port.ts (novo)
  - packages/business/auth/adapters/redis-jwt-blacklist.adapter.ts (novo)
  - apps/web/src/lib/jwt.ts
  - apps/web/src/lib/auth.config.ts
- descricao_correcao: JwtBlacklist port + RedisJwtBlacklist adapter (SET EX). JWT payload ganhou jti e iat; callback jwt gera jti no login, consulta blacklist a cada invocation — se revogado retorna `{}` (sessão desautenticada). Event signOut revoga jti com TTL igual ao tempo restante da sessão.
- observacoes: Parcial — refresh-token rotation completa exige desenho maior (ficará para design follow-up).

### ACH-010
- titulo: Cookies de sessão sem `secure`/`httpOnly`/`sameSite` explícitos
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 31bef10
- commit_revisor: none
- arquivos_alterados:
  - apps/web/src/lib/auth.config.ts
- descricao_correcao: Adicionado `useSecureCookies: NODE_ENV==='production'` e bloco `cookies` explicitando options de sessionToken/csrfToken/callbackUrl com httpOnly: true, sameSite: 'lax', secure: production, path: '/' e nomes prefixados __Secure-/__Host- em produção.
- observacoes: none

### ACH-007
- titulo: Ausência de MFA/TOTP
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: pendente
- commit_executor: 6008544
- commit_revisor: none
- arquivos_alterados:
  - packages/db/prisma/schema.prisma (Account: totpSecret, totpEnabled, totpActivatedAt, totpRecoveryCodes)
  - packages/business/auth/ports/totp-service.port.ts (novo)
  - packages/business/auth/adapters/otplib-totp-service.adapter.ts (novo)
  - packages/business/auth/adapters/totp-secret-crypto.ts (novo — AES-256-GCM wrapper)
  - packages/business/auth/use-cases/enable-totp.use-case.ts (BeginTotpEnrollment, ConfirmTotpEnrollment)
  - packages/business/auth/use-cases/disable-totp.use-case.ts
  - packages/business/auth/use-cases/verify-totp.use-case.ts
  - apps/web/package.json (otplib@12)
  - .env.production.example (TOTP_ENCRYPTION_KEY)
- descricao_correcao: Schema Prisma com campos TOTP (secret criptografado, flags, recovery codes sha256). TotpService port abstraindo otplib. Crypto helper AES-256-GCM usa TOTP_ENCRYPTION_KEY (requireEnv em prod). Use-cases: BeginTotpEnrollment (gera secret + otpauth URI); ConfirmTotpEnrollment (verifica código, persiste encrypted, emite 10 recovery codes); DisableTotp (requer código válido); VerifyTotp (código live ou recovery one-shot).
- observacoes: Parcial — rotas tRPC, UI de setup (QR code, entrada de código, download de recovery codes) e enforcement no fluxo de login (exigir MFA para OWNER/ADMIN) ficam para ação humana. Migração Prisma precisa ser gerada e aplicada.

### ACH-008
- titulo: Mass assignment potencial em updates — repositórios aceitam `Partial<Entity>` inteiro
- severidade: alto
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-009
- titulo: Validação de URLs aceitas para avatar permite SSRF
- severidade: alto
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-028
- titulo: Ausência de validador forte para números de telefone
- severidade: baixo
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-011
- titulo: CSP de produção permite `'unsafe-inline'` para scripts e estilos
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-014
- titulo: Grafana exposto sem autenticação de aplicação (default `admin:admin`)
- severidade: alto
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-026
- titulo: Containers Docker sem `--read-only`/cap-drop e sem chown final
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-025
- titulo: Postgres sem separação de roles (app vs admin vs migrations)
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-023
- titulo: Endpoint `health.ready` público expõe estado interno detalhado
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-024
- titulo: Trilha de auditoria limitada — eventos críticos não persistidos em banco
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-015
- titulo: Ausência de secret scanning em pre-commit e em CI
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-017
- titulo: Branch protection / CODEOWNERS não visíveis no repositório
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-016
- titulo: Sem Secret Manager nem política de rotação de credenciais
- severidade: alto
- classificacao: nao_corrigivel
- status_executor: nao_aplicavel
- status_revisor: nao_aplicavel
- commit_executor: none
- commit_revisor: none
- observacoes: Adoção de Secret Manager exige decisão de infra/produto e provisionamento externo. Documentar manualmente em SECURITY.md após escolha do provedor.
