# Progresso da Correção

## Identificação
- dominio: seguranca
- run_id: 2026-04-18_22-06-18
- branch: fix/seguranca/2026-04-18_22-06-18
- data_inicio: 2026-04-19 22:20:00
- ultima_atualizacao: 2026-04-20 10:30:00
- fase_atual: executor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 27
- corrigidos_executor: 7
- revisados_revisor: 0
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 1
- nao_aprovados: 0
- pendentes: 20

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
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-004
- titulo: Enumeração de contas por mensagens de erro distintas
- severidade: alto
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-018
- titulo: Rate-limit assimétrico e frouxo nos endpoints sensíveis
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-002
- titulo: OTP registrado em console.log em ambiente não-produção
- severidade: critico
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-001
- titulo: reset-password e verify-email não implementados
- severidade: critico
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-005
- titulo: `findByToken` de invites sem validação de status e expiração
- severidade: alto
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-006
- titulo: Sessão JWT de 15 min sem revogação e sem rotation explícita
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-010
- titulo: Cookies de sessão sem `secure`/`httpOnly`/`sameSite` explícitos
- severidade: alto
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-007
- titulo: Ausência de MFA/TOTP
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

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
