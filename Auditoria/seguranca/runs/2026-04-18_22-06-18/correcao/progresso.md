# Progresso da Correção

## Identificação
- dominio: seguranca
- run_id: 2026-04-18_22-06-18
- branch: fix/seguranca/2026-04-18_22-06-18
- data_inicio: 2026-04-19 22:20:00
- ultima_atualizacao: 2026-04-19 (revisor concluído — 27/27 aprovados)
- fase_atual: revisor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 27
- corrigidos_executor: 27
- revisados_revisor: 27
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 1
- nao_aprovados: 0
- pendentes: 0

## Achados

### ACH-012
- titulo: Credenciais externas (DeepSeek, WhatsApp) com fallback silencioso `?? ""`
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 491192b
- commit_revisor: none
- resultado_revisao: Diff confere com a recomendação. validateEnv estendido com REQUIRED_IN_PRODUCTION para web/api/worker; requireEnv exportado e usado em deepseek-adapter e whatsapp-n2-adapter com fail-fast em produção (dev mantém fallback). Schemas Zod marcam credenciais como `.string().min(1).optional()` permitindo dev rodar sem todas as chaves. Bonus: authSecretSchema com min(32) + refusal de padrões fracos já preparou ACH-027.
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
- status_revisor: aprovado
- commit_executor: 7648208
- commit_revisor: none
- resultado_revisao: WHATSAPP_APP_SECRET e RESEND_API_KEY presentes em .env.example e .env.production.example com comentários explicativos. Ambas as variáveis foram adicionadas ao globalEnv de turbo.json. Validação no Zod env (ACH-012) garante fail-fast em produção.
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
- status_revisor: aprovado
- commit_executor: f343cb6
- commit_revisor: none
- resultado_revisao: Templates .env.example e .env.production.example agora orientam `openssl rand -base64 48` e usam placeholders neutros (REPLACE_WITH_OUTPUT_OF_openssl_rand_base64_48 / REPLACE_WITH_OPENSSL_RAND_BASE64_48). Comentários explicam constraints. A enforcement runtime foi feita via authSecretSchema em ACH-012 (min 32 + refusal de padrões change/secret/wbc-dev/placeholder/generate). .env tracked do dev não existe (gitignored), conforme registrado no achado.
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
- status_revisor: aprovado
- commit_executor: 890a51f
- commit_revisor: none
- resultado_revisao: redaction.ts cobre phone (últimos 4 dígitos + asteriscos), IDs (primeiros 8 chars + ellipsis), e email (sha256 truncado a 12). security-logger aplica redactSecurityFields antes do console. Interface SecurityEvent estendida com accountId/email/jti. Re-exportado em index.ts.
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
- status_revisor: aprovado
- commit_executor: 094ebaa
- commit_revisor: none
- resultado_revisao: detail bruto removido. Email agora vai para o campo `email` do SecurityEvent que é redactado via sha256 truncado (12 chars) pelo redactSecurityFields. Não há mais email bruto em logs.
- arquivos_alterados:
  - apps/web/src/lib/auth.config.ts
- descricao_correcao: Substituído `detail: \`credentials: ${credentials.email}\`` por `email: credentials.email` (campo padronizado, redactado via sha256 truncado pelo security-logger).
- observacoes: none

### ACH-022
- titulo: `console.error` em adapter WhatsApp pode logar headers/payloads
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 1d9d567
- commit_revisor: none
- resultado_revisao: createLogger central (pino) implementado em packages/shared/src/logger.ts. WhatsApp adapter substituiu ambos console.error por logger.warn/error com structured fields {requestId, status, phone (redactPhone), type, attempt, err}. Não há mais leak de headers/tokens em stdout. pino adicionado como dep de packages/shared.
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
- status_revisor: aprovado
- commit_executor: 58a1108
- commit_revisor: none
- resultado_revisao: redactSentryEvent puro em packages/shared cobre request, contexts, extra, breadcrumbs (recursivo até depth 6), regex de keys sensíveis (authorization|cookie|password|token|secret|api_key|otp|email), strip user.email/ip_address, truncamento >2000 chars. Aplicado nos 4 inits Sentry (api/node + web server/edge/client) com sendDefaultPii=false. Sample em dev reduzido para 0.1.
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
- status_revisor: aprovado
- commit_executor: cdc95a7
- commit_revisor: none
- resultado_revisao: LoginAttemptTracker port + RedisLoginAttemptTracker adapter (sha256 das chaves, TTL 15min, threshold 5). Tracker é opcional no use-case (preserva tests). isLocked() é checado antes do bcrypt; recordFailure() em falha; clearAttempts() em sucesso. AccountLockedError reusa mesma mensagem de InvalidCredentialsError, preservando anti-enumeration. Auth.config injeta tracker com Redis singleton; bucket por (email, IP) extraído via x-forwarded-for/x-real-ip no callback authorize.
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
- status_revisor: aprovado
- commit_executor: e09b73d
- commit_revisor: none
- resultado_revisao: InvalidCredentialsError com mensagem única "E-mail ou senha inválidos" cobre conta ausente, OAuth-only e password errado. TIMING_DECOY_HASH (bcrypt fixo) usado quando account não existe — `passwordHasher.verify` sempre executa, equalizando tempo de resposta. Trim/lowercase do email mantém comportamento existente.
- arquivos_alterados:
  - packages/business/auth/use-cases/authenticate-with-credentials.use-case.ts
- descricao_correcao: Exceção única InvalidCredentialsError com mensagem "E-mail ou senha inválidos" para conta ausente, OAuth-only ou senha errada. Bcrypt.verify é sempre executado usando TIMING_DECOY_HASH (hash fixo) quando a conta não existe, equalizando tempo de resposta contra ataque por timing.
- observacoes: Commit feito antes do ACH-003 (eram sequenciais no mesmo arquivo).

### ACH-018
- titulo: Rate-limit assimétrico e frouxo nos endpoints sensíveis
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 76ab1c0
- commit_revisor: none
- resultado_revisao: SENSITIVE_ROUTE_LIMITS por prefixo cobre auth.login (5/min), auth.requestPasswordReset (3/h), auth.resetPassword (5/h), auth.acceptInvite (10/15min), auth.sendOtp (5/h), auth.verifyOtp (5/min) etc — bate com a recomendação. Aplicação em ambos applyPublicRateLimit e applyProtectedRateLimit. Context ganhou ipAddress + helper extractIpFromHeaders (x-forwarded-for primeiro hop, x-real-ip fallback). publicProcedure usa ctx.ipAddress como identifier para anônimos, eliminando o bucket global.
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
- status_revisor: aprovado
- commit_executor: 61afd51
- commit_revisor: none
- resultado_revisor: SendOtpResult não tem mais o campo `code`. console.log dev removido por completo. logSecurityEvent emitido apenas com accountId. Teste atualizado para `expect(result).not.toHaveProperty("code")`. Código permanece persistido via OtpRepository e consumido pelo canal de entrega.
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
- status_revisor: aprovado
- commit_executor: 5d3072c
- commit_revisor: none
- resultado_revisao: AuthTokenStore port com kind binding (password-reset|email-verification) impede replay cross-flow. RedisAuthTokenStore: tokens 32-byte hex (256 bits), `${prefix}:${token}` com TTL via EX, GETDEL one-shot, índice por accountId+kind para revoke em batch. reset-password.use-case valida MIN_PASSWORD_LENGTH (8), consome token, hasheia bcrypt, atualiza account, revoga tokens pendentes do mesmo kind. verify-email.use-case análogo (idempotente em emailVerified). request-* use-cases revogam tokens pendentes antes de issue (defensive). ResendEmailSender real: requireEnv em prod (ResendNotConfiguredError com mensagem clara), POST para api.resend.com com Bearer; em dev loga apenas metadata (sem body que carrega tokens). Limites: parcial é humana (UI/router devem injetar adapters concretos).
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
- status_revisor: aprovado
- commit_executor: 98403ea
- commit_revisor: none
- resultado_revisao: findByToken trocou findUnique por findFirst com where { token, status: 'PENDING', expiresAt: { gt: new Date() } }. Filtros bate exatamente com a recomendação. EXPIRED/ACCEPTED retornam null mesmo com token válido — replay defendido.
- arquivos_alterados:
  - packages/business/auth/adapters/prisma-invite.repository.ts
- descricao_correcao: findByToken agora usa findFirst com where { token, status: 'PENDING', expiresAt: { gt: now } }. Invites EXPIRED ou ACCEPTED retornam null mesmo com token válido.
- observacoes: none

### ACH-006
- titulo: Sessão JWT de 15 min sem revogação e sem rotation explícita
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 7d6562a
- commit_revisor: none
- resultado_revisao: JwtBlacklist port + RedisJwtBlacklist (SET EX clamp ≥1s) implementados. JWTPayload ganhou jti + iat. Callback jwt: gera jti via randomUUID + iat no login; consulta blacklist a cada invocation e retorna `{}` se revogado (sub/role/etc desaparecem, sessão fica desautenticada). Event signOut: revoga jti com TTL ≥60s computado a partir de iat (clamp para mínimo). Refresh-token rotation completa fica como design follow-up — registrado como parcial corretamente.
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
- status_revisor: aprovado
- commit_executor: 31bef10
- commit_revisor: none
- resultado_revisao: useSecureCookies + bloco cookies explícito para sessionToken/csrfToken/callbackUrl. Todos com httpOnly: true, sameSite: 'lax', secure: production. Nomes prefixados __Secure-/__Host- em produção (boas práticas de Cookie Prefixes RFC). callbackUrl não tem httpOnly (precisa ser legível pelo client; correto pelo padrão NextAuth).
- arquivos_alterados:
  - apps/web/src/lib/auth.config.ts
- descricao_correcao: Adicionado `useSecureCookies: NODE_ENV==='production'` e bloco `cookies` explicitando options de sessionToken/csrfToken/callbackUrl com httpOnly: true, sameSite: 'lax', secure: production, path: '/' e nomes prefixados __Secure-/__Host- em produção.
- observacoes: none

### ACH-007
- titulo: Ausência de MFA/TOTP
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 6008544
- commit_revisor: none
- resultado_revisao: Schema Prisma estendido (totpSecret encrypted, totpEnabled, totpActivatedAt, totpRecoveryCodes sha256). TotpService port + adapter via otplib. Crypto AES-256-GCM com KDF scrypt e TOTP_ENCRYPTION_KEY (requireEnv em prod). Use-cases: BeginTotpEnrollment (gera secret + otpauth URI sem persistir); ConfirmTotpEnrollment (valida código, encrypta, emite 10 recovery codes, retorna planos uma vez); DisableTotp (exige código atual válido — defesa contra cookie hijack); VerifyTotp (live code primeiro, fallback recovery one-shot que é consumido). Recovery codes em hashed array, uso XOR com pluck. Restante (UI + tRPC routers + enforcement no login) é parcial humana — registrado.
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
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 48402a2
- commit_revisor: none
- resultado_revisao: CLIENT_UPDATABLE_FIELDS + pickClientUpdatable substituem o splat em prisma-client-repository.update; PrismaAccountRepository.update e PrismaTenantMemberRepository.update fazem cherry-pick explícito por if. Campos system-managed (totp*, classification, engagementScore, accountId, tenantId, joinedAt, etc) ficam fora do whitelist. version mantida no whitelist do client porque participa do optimistic locking. Padrão a replicar nos repos de sales/messaging/finance — registrado em observação como ação humana.
- arquivos_alterados:
  - packages/business/clients/domain/updatable-fields.ts (novo - CLIENT_UPDATABLE_FIELDS + pickClientUpdatable)
  - packages/business/clients/adapters/prisma-client-repository.ts (whitelist em update)
  - packages/business/auth/adapters/prisma-account.repository.ts (whitelist explícito em update)
  - packages/business/auth/adapters/prisma-tenant-member.repository.ts (whitelist explícito em update)
- descricao_correcao: Whitelist explícito (pick) substituindo `data: input` no Prisma. Client repo usa pickClientUpdatable; account/tenant-member fazem cherry-pick de campos por if. Campos system-managed (totp*, classification, engagementScore, accountId, tenantId, joinedAt) não podem ser setados via update.
- observacoes: Padrão a ser replicado nos repos de sales/messaging/finance (acompanhamento humano).

### ACH-009
- titulo: Validação de URLs aceitas para avatar permite SSRF
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 42467dc
- commit_revisor: none
- resultado_revisao: avatarUrlSchema com refine() valida HTTPS + hostname suffix em AVATAR_HOSTNAME_ALLOWLIST (googleusercontent.com, gravatar.com, wbc.cdn.weavecode.co.uk). Rejeita http://, localhost, 169.254.169.254 (cloud metadata) etc. Aplicado em completeOnboardingSchema.avatar e updateMemberSchema.avatar — match com a recomendação.
- arquivos_alterados:
  - packages/validators/src/auth.ts
- descricao_correcao: Schema avatarUrlSchema com refine() validando HTTPS + hostname suffix em AVATAR_HOSTNAME_ALLOWLIST (googleusercontent.com, gravatar.com, wbc.cdn.weavecode.co.uk). Aplicado em completeOnboardingSchema.avatar e updateMemberSchema.avatar.
- observacoes: none

### ACH-028
- titulo: Ausência de validador forte para números de telefone
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 8426627
- commit_revisor: none
- resultado_revisao: phoneE164Schema/optionalPhoneE164Schema usam libphonenumber-js (parsePhoneNumberFromString, country BR) e fazem transform para E.164. parsed.isValid() rejeita "0000000000" e demais inválidos. Substituído em completeOnboardingSchema, acceptInviteSchema, updateMemberSchema (auth.ts) e createClientSchema, updateClientSchema (clients.ts). libphonenumber-js@1.11 adicionado a packages/validators.
- arquivos_alterados:
  - packages/validators/package.json (libphonenumber-js@1.11)
  - packages/validators/src/phone.ts (novo)
  - packages/validators/src/index.ts (re-export)
  - packages/validators/src/auth.ts (substitui min(10).max(15))
  - packages/validators/src/clients.ts (substitui min(8).max(20))
- descricao_correcao: phoneE164Schema/optionalPhoneE164Schema com transform via libphonenumber-js (parsePhoneNumberFromString, country=BR). Rejeita strings inválidas como "0000000000" e armazena em formato E.164 (+5511999990000).
- observacoes: none

### ACH-011
- titulo: CSP de produção permite `'unsafe-inline'` para scripts e estilos
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 671dda5
- commit_revisor: none
- resultado_revisao: Middleware emite nonce per-request via crypto.getRandomValues (18 bytes base64). Header x-nonce propagado para o request com NextResponse.next({ request }). buildCsp em prod usa script-src 'self' 'nonce-X' 'strict-dynamic' (sem unsafe-inline) e style-src 'self' 'nonce-X'. Em dev mantém unsafe-inline/eval para hot-reload. Bonus: base-uri/form-action/object-src 'none' adicionados ao CSP. next.config.mjs deixa de emitir CSP estático. Parcial é validar componentes que usem inline sem nonce — ação humana.
- arquivos_alterados:
  - apps/web/src/middleware.ts
  - apps/web/next.config.mjs
- descricao_correcao: Middleware emite nonce per-request via crypto.getRandomValues, propagado via header x-nonce. CSP em prod usa script-src 'self' 'nonce-X' 'strict-dynamic' (sem unsafe-inline); style-src 'self' 'nonce-X'. Em dev mantém unsafe-inline/unsafe-eval para hot-reload. next.config.mjs deixa de emitir Content-Security-Policy estático.
- observacoes: Parcial — verificar se algum componente de UI usa script/style inline sem nonce (acompanhamento humano em smoke-test). Migration de `useNonce()` em componentes pode ser necessária.

### ACH-014
- titulo: Grafana exposto sem autenticação de aplicação (default `admin:admin`)
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 7e24f3c
- commit_revisor: none
- resultado_revisao: docker-compose.prod.yml usa ${GRAFANA_PASSWORD:?...} forçando erro de boot se ausente — fallback admin:admin eliminado. GF_AUTH_ANONYMOUS_ENABLED=false, GF_USERS_ALLOW_SIGN_UP=false, GF_AUTH_BASIC_ENABLED=true, GF_SECURITY_DISABLE_INITIAL_ADMIN_CREATION=false. .env.production.example documenta GRAFANA_PASSWORD com instrução openssl rand. Restrição IP via nginx fica para infra (registrado em observação como acompanhamento).
- arquivos_alterados:
  - docker-compose.prod.yml
  - .env.production.example
- descricao_correcao: GF_SECURITY_ADMIN_PASSWORD usa ${GRAFANA_PASSWORD:?...} forçando erro de boot se ausente (sem fallback admin). GF_AUTH_ANONYMOUS_ENABLED=false, GF_USERS_ALLOW_SIGN_UP=false, GF_AUTH_BASIC_ENABLED=true. .env.production.example documenta GRAFANA_PASSWORD com instrução openssl rand.
- observacoes: Restrição IP via nginx ou reverse-proxy-auth fica para acompanhamento (mudança de infra).

### ACH-026
- titulo: Containers Docker sem `--read-only`/cap-drop e sem chown final
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: fee7a4f
- commit_revisor: none
- resultado_revisao: Aplicado em todos os 7 serviços (postgres/redis/web/worker/nginx/prometheus/grafana): cap_drop:[ALL] + security_opt:[no-new-privileges:true]. Web: read_only:true + tmpfs para /tmp (128m) e /app/.next/cache (256m, uid:1001). Worker: read_only:true + tmpfs /tmp. Web com cap_add:[NET_BIND_SERVICE]. Nginx com cap_add:[CHOWN, SETGID, SETUID, NET_BIND_SERVICE] (necessárias para bind em 80/443 + reload de workers).
- arquivos_alterados:
  - docker-compose.prod.yml
- descricao_correcao: Aplicado a todos os serviços (postgres/redis/web/worker/nginx/prometheus/grafana): cap_drop:[ALL] + security_opt:[no-new-privileges:true]. Web e worker ganharam read_only:true + tmpfs para /tmp e /app/.next/cache. Nginx tem cap_add específicas (CHOWN, SETGID, SETUID, NET_BIND_SERVICE).
- observacoes: none

### ACH-025
- titulo: Postgres sem separação de roles (app vs admin vs migrations)
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 8ce2efe
- commit_revisor: none
- resultado_revisao: setup-roles.sql idempotente (IF NOT EXISTS) cria wbc_app (SELECT/INSERT/UPDATE/DELETE + USAGE/SELECT em sequences), wbc_migrations (ALL + CREATE em schema), wbc_readonly (SELECT). ALTER DEFAULT PRIVILEGES garante grants automáticos para tabelas futuras criadas por wbc_migrations. REVOKE ALL ... FROM PUBLIC fecha o default. Senhas passadas via psql -v. .env.production.example documenta as 3 senhas com openssl rand. Aplicação em prod exige DBA humano — parcial é adequado.
- arquivos_alterados:
  - packages/db/prisma/scripts/setup-roles.sql (novo)
  - .env.production.example
- descricao_correcao: Script SQL idempotente cria três roles (wbc_app: SELECT/INSERT/UPDATE/DELETE; wbc_migrations: ALL + DDL; wbc_readonly: SELECT). ALTER DEFAULT PRIVILEGES configura grants automáticos para tabelas futuras criadas por wbc_migrations. .env.production.example documenta WBC_APP_DB_PASSWORD/WBC_MIGRATIONS_DB_PASSWORD/WBC_READONLY_DB_PASSWORD.
- observacoes: Parcial — execução em produção requer DBA: rodar setup-roles.sql, ajustar DATABASE_URL para usar wbc_app, e separar DATABASE_URL_MIGRATIONS no pipeline de deploy.

### ACH-023
- titulo: Endpoint `health.ready` público expõe estado interno detalhado
- severidade: medio
- classificacao: corrigivel
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: e71bdde
- commit_revisor: none
- resultado_revisao: isInternalCaller(ipAddress, headerToken) combina dois canais: INTERNAL_IP_RE cobre RFC1918 (10., 192.168., 172.16-31.) + loopback (127., ::1) + RFC4193 (fc|fd); x-internal-probe com READY_DETAILS_TOKEN para K8s probes externas com shared secret. ready retorna {status, checks} apenas se interno; externo recebe só {status: 'ok'|'degraded'}. Bate com a recomendação.
- arquivos_alterados:
  - apps/api/src/routers/health.ts
- descricao_correcao: ready procedure usa isInternalCaller(ip, headerToken) para decidir se retorna {status, checks} (interno) ou apenas {status} (público). Internos: IPs RFC1918/RFC4193/loopback OU header x-internal-probe com READY_DETAILS_TOKEN. Externo só vê 'ok'/'degraded'.
- observacoes: none

### ACH-024
- titulo: Trilha de auditoria limitada — eventos críticos não persistidos em banco
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: fb1fc3d
- commit_revisor: none
- resultado_revisao: Model AuditLog em Prisma (tenantId, accountId, action, resource, resourceId, status, ip, userAgent, detail Json, createdAt) com 3 índices relevantes: (tenantId, createdAt), (accountId, createdAt), (action, createdAt). AuditLogPort com AuditAction enum pre-definindo eventos críticos (login success/failed, password.change/reset, session.revoked, totp.*, invite.*, member.*, api_token.*). PrismaAuditLog engole falhas com logger.error loudly (não quebra fluxo do usuário). Middleware factory `auditedAs({action, resource, resourceIdFrom})` derive status do try/catch. Parcial é aplicar em routers individuais — reportado em observação como ação humana. Export periódico Fase 7.
- arquivos_alterados:
  - packages/db/prisma/schema.prisma (model AuditLog)
  - packages/business/platform/audit-log/ports/audit-log.port.ts (novo)
  - packages/business/platform/audit-log/adapters/prisma-audit-log.adapter.ts (novo)
  - apps/api/src/trpc/audit-middleware.ts (novo)
- descricao_correcao: Model AuditLog (tenantId, accountId, action, resource, resourceId, status, ip, userAgent, detail, createdAt) com índices por (tenantId, createdAt), (accountId, createdAt), (action, createdAt). AuditLogPort + PrismaAuditLog adapter (failures swallowed para não quebrar fluxo). Middleware tRPC factory `auditedAs({action, resource, resourceIdFrom})` para uso em mutations.
- observacoes: Parcial — middleware criado mas não aplicado em routers individuais (cada mutation crítica deve adotá-lo: invite.accept, member.role.change, session.revoke, etc — acompanhamento humano). Export periódico para storage frio fica para Fase 7.

### ACH-015
- titulo: Ausência de secret scanning em pre-commit e em CI
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 4d00627
- commit_revisor: none
- resultado_revisao: Job secret-scan no .github/workflows/ci.yml usa gitleaks/gitleaks-action@v2 com fetch-depth:0 (scan PR inteira). .gitleaks.toml: extends default ruleset + allowlist (Auditoria/, playbook/, *.example, node_modules, .next, dist, .auditoria-backup-*) + regexes para bcrypt timing-decoy (ACH-004), REPLACE_WITH_OPENSSL, CHANGE_ME_*, your-<provider>-<tipo>. Pre-commit via lint-staged shellout condicional (gitleaks protect --staged --redact se instalado, senão noop com aviso). Ativação do push-protection GitHub é parcial humana — documentada.
- arquivos_alterados:
  - .github/workflows/ci.yml (job secret-scan via gitleaks-action@v2)
  - .gitleaks.toml (novo - allowlist de fixtures e padrões neutros)
  - package.json (lint-staged hook condicional via gitleaks local)
- descricao_correcao: gitleaks-action no CI rodando em todo PR. .gitleaks.toml allowlist Auditoria/, playbook/, *.example, e regexes para o bcrypt timing-decoy + REPLACE_WITH_OPENSSL placeholders. Pre-commit via lint-staged é silencioso quando gitleaks não está instalado localmente (CI ainda enforce).
- observacoes: Parcial — habilitação de "Push protection" e "Secret scanning native" do GitHub fica para acompanhamento via UI (documentado em CONTRIBUTING.md/SECURITY.md).

### ACH-017
- titulo: Branch protection / CODEOWNERS não visíveis no repositório
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- status_revisor: aprovado
- commit_executor: 4bd5f78
- commit_revisor: none
- resultado_revisao: .github/CODEOWNERS criado com @WeaveCode-UK/owners para áreas críticas (auth, db, shared, platform, .github, deploy, .gitleaks.toml, Auditoria/). CONTRIBUTING.md documenta a configuração exigida no GitHub UI: branch protection em main (≥1 review + CODEOWNERS obligatory, dismiss stale, status checks lint/test/secret-scan, required conversation resolution, signed commits, restrict push, no bypass), repo-level security (dependency graph, dependabot, secret scanning, push protection, private vuln reporting). SECURITY.md lista email de reporte (security@weavecode.co.uk) e tabela de políticas operacionais referenciadas pelos ACHs. Config efetiva depende de admin GitHub — parcial adequado.
- arquivos_alterados:
  - .github/CODEOWNERS (novo)
  - CONTRIBUTING.md (novo)
  - SECURITY.md (novo)
- descricao_correcao: CODEOWNERS com @WeaveCode-UK/owners para áreas críticas (auth, db, .github, deploy, .gitleaks.toml). CONTRIBUTING.md documenta branch protection (≥1 review, CODEOWNERS, status checks lint/test/secret-scan, signed commits, no force-push) e push protection esperada. SECURITY.md mapeia políticas operacionais e contato security@weavecode.co.uk.
- observacoes: Parcial — configuração efetiva no GitHub UI depende de admin (documentado em CONTRIBUTING.md como contrato).

### ACH-016
- titulo: Sem Secret Manager nem política de rotação de credenciais
- severidade: alto
- classificacao: nao_corrigivel
- status_executor: nao_aplicavel
- status_revisor: nao_aplicavel
- commit_executor: none
- commit_revisor: none
- observacoes: Adoção de Secret Manager exige decisão de infra/produto e provisionamento externo. Documentar manualmente em SECURITY.md após escolha do provedor.
