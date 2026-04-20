# Plano de Correção

## Identificação
- dominio: seguranca
- run_id: 2026-04-18_22-06-18
- data_geracao: 2026-04-19 22:20:00
- total_achados: 28
- corrigiveis: 19
- corrigiveis_parciais: 8
- nao_corrigiveis: 1

## Ordem de Execução

### 1. ACH-012 — Credenciais externas (DeepSeek, WhatsApp) com fallback silencioso `?? ""`
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/config (criar Zod env), packages/business/ai/adapters/deepseek-adapter.ts, packages/business/messaging/adapters/whatsapp-n2-adapter.ts
- acao_planejada: validar env obrigatórias via Zod em packages/config; lançar erro claro no startup quando uma chave obrigatória estiver vazia; remover fallback `?? ""`.
- dependencias: nenhuma
- justificativa_ordem: base para ACH-013 e ACH-027 (validação de env via Zod).
- risco_da_correcao: baixo — falhar cedo é melhor que falha intermitente.

### 2. ACH-013 — `WHATSAPP_APP_SECRET` não documentado em `.env.example` / `.env.production.example`
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: .env.example, .env.production.example, turbo.json (globalEnv), packages/config (Zod)
- acao_planejada: adicionar `WHATSAPP_APP_SECRET` aos dois `.env.example` e ao `globalEnv` do turbo; exigir valor no Zod env.
- dependencias: ACH-012
- justificativa_ordem: usa o Zod env criado no ACH-012.
- risco_da_correcao: baixo.

### 3. ACH-027 — `.env` de desenvolvimento usa `AUTH_SECRET` fraco e previsível
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/config (Zod env), .env.example
- acao_planejada: validar tamanho mínimo do AUTH_SECRET em startup; rejeitar padrões conhecidos ("dev", "change", "secret"); orientar geração via openssl rand.
- dependencias: ACH-012
- justificativa_ordem: usa o Zod env criado no ACH-012.
- risco_da_correcao: baixo (apenas validação no startup).

### 4. ACH-020 — `security-logger` sem redaction de `phone`, `userId`, `tenantId`
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/shared/src/security-logger.ts (e novo packages/shared/src/redaction.ts)
- acao_planejada: criar função reutilizável de redaction (mascarar phone para últimos 4 dígitos; truncar IDs a 8 chars); aplicar antes do `console.log`.
- dependencias: nenhuma
- justificativa_ordem: cria função base usada por ACH-019 e ACH-022.
- risco_da_correcao: baixo.

### 5. ACH-019 — Email do usuário registrado em logs de falha de autenticação
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/web/src/lib/auth.config.ts:40
- acao_planejada: substituir email bruto por hash determinístico truncado (ou apenas accountId após lookup).
- dependencias: ACH-020
- justificativa_ordem: usa a função de redaction do ACH-020 quando aplicável.
- risco_da_correcao: baixo.

### 6. ACH-022 — `console.error` em adapter WhatsApp pode logar headers/payloads
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/business/messaging/adapters/whatsapp-n2-adapter.ts:75,91
- acao_planejada: migrar `console.error` para `createLogger()` central com redaction; logar apenas status code e requestId opaco.
- dependencias: ACH-020
- justificativa_ordem: usa a função de redaction.
- risco_da_correcao: baixo.

### 7. ACH-021 — Sentry captura erros sem `beforeSend` para redactar PII
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/api/src/lib/sentry.ts, apps/web/sentry.server.config.ts
- acao_planejada: implementar `beforeSend` removendo `headers.authorization`, `request.data.password`, `request.data.token`, payloads sensíveis; reduzir sample em dev.
- dependencias: nenhuma
- justificativa_ordem: bloco de logging/PII.
- risco_da_correcao: baixo.

### 8. ACH-003 — Autenticação por credenciais sem proteção contra brute-force
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/business/auth/use-cases/authenticate-with-credentials.use-case.ts
- acao_planejada: lockout após 5 falhas em 15 minutos via Redis (chave por accountId+IP); backoff exponencial; rate-limit específico para login.
- dependencias: nenhuma
- justificativa_ordem: bloco anti-brute-force; mesma área de ACH-004 e ACH-018.
- risco_da_correcao: medio — exige Redis disponível e telemetria.

### 9. ACH-004 — Enumeração de contas por mensagens de erro distintas
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/business/auth/use-cases/authenticate-with-credentials.use-case.ts
- acao_planejada: mensagem única "e-mail ou senha inválidos" para ambos os casos; executar bcrypt mesmo quando conta não existe (timing equalizado).
- dependencias: ACH-003
- justificativa_ordem: mesmo arquivo do ACH-003.
- risco_da_correcao: baixo.

### 10. ACH-018 — Rate-limit assimétrico e frouxo nos endpoints sensíveis
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/api/src/trpc/rate-limit-middleware.ts, apps/api/src/trpc/trpc.ts
- acao_planejada: identificador público = IP (via `x-forwarded-for` tratado); limits por rota (login: 5/min/IP; resetRequest: 3/h/IP; acceptInvite: 10/15min/IP).
- dependencias: nenhuma
- justificativa_ordem: complementa ACH-003/004.
- risco_da_correcao: baixo.

### 11. ACH-002 — OTP registrado em console.log em ambiente não-produção
- severidade: critico
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/business/auth/use-cases/send-otp.ts:37-39
- acao_planejada: remover `console.log` do OTP completamente; em dev emitir apenas evento "otp-sent" sem o valor.
- dependencias: nenhuma
- justificativa_ordem: rápido e isolado, antes de tocar use-cases maiores.
- risco_da_correcao: baixo.

### 12. ACH-001 — reset-password e verify-email não implementados
- severidade: critico
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: packages/business/auth/use-cases/reset-password.use-case.ts, verify-email.use-case.ts, request-password-reset.use-case.ts, request-email-verification.use-case.ts; packages/business/auth/adapters/resend-email-sender.adapter.ts
- acao_planejada: armazenar token em Redis com TTL 1h; validar no resetPassword antes de hashear; bloquear stub do Resend em produção (lançar erro se RESEND_API_KEY ausente).
- dependencias: ACH-012 (env validation)
- justificativa_ordem: depende de validação env; integração Resend real depende de credencial humana (parcial).
- risco_da_correcao: medio — exige Redis e provedor; manter backwards-compat de chamadas existentes.

### 13. ACH-005 — `findByToken` de invites sem validação de status e expiração
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/business/auth/adapters/prisma-invite.repository.ts:16-20
- acao_planejada: alterar para `where: { token, status: 'PENDING', expiresAt: { gt: new Date() } }`.
- dependencias: nenhuma
- justificativa_ordem: correção pontual no adapter.
- risco_da_correcao: baixo.

### 14. ACH-006 — Sessão JWT de 15 min sem revogação e sem rotation explícita
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: apps/web/src/lib/auth.config.ts:131-134, packages/business/auth/use-cases/revoke-session.use-case.ts
- acao_planejada: blacklist de `jti` revogados em Redis consultada no callback `authorized`; revoke-session adiciona à blacklist; refresh-token rotation adiada (parcial).
- dependencias: nenhuma
- justificativa_ordem: mesmo arquivo de ACH-010 e ACH-019.
- risco_da_correcao: medio — afeta callback de autenticação.

### 15. ACH-010 — Cookies de sessão sem `secure`/`httpOnly`/`sameSite` explícitos
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/web/src/lib/auth.config.ts:131-134
- acao_planejada: declarar `cookies.sessionToken.options` explicitamente com `secure: true`, `httpOnly: true`, `sameSite: 'lax'`; validar em startup.
- dependencias: ACH-006
- justificativa_ordem: mesmo arquivo do ACH-006.
- risco_da_correcao: baixo.

### 16. ACH-007 — Ausência de MFA/TOTP
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: packages/business/auth/ (novos use-cases TOTP), packages/db/prisma/schema.prisma (campo TOTP secret)
- acao_planejada: implementar use-cases `enable-totp`, `disable-totp`, `verify-totp` com `otplib`; armazenar segredo criptografado; schema Prisma; UI fica para humano (parcial).
- dependencias: ACH-012
- justificativa_ordem: bloco auth; depende de env (criptografia).
- risco_da_correcao: medio — schema migration necessária.

### 17. ACH-008 — Mass assignment potencial em updates
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/business/clients/ (e similares: sales, messaging, finance), apps/api/src/routers/clients.ts
- acao_planejada: whitelist explícito (pick) em use-cases de update; proibir `...input` direto no `data` do Prisma.
- dependencias: nenhuma
- justificativa_ordem: bloco de validação de input.
- risco_da_correcao: medio — afeta múltiplos repositórios.

### 18. ACH-009 — Validação de URLs aceitas para avatar permite SSRF
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/validators/src/auth.ts:10,30,44
- acao_planejada: restringir a HTTPS + allowlist de domínios; validar via `refine`.
- dependencias: nenhuma
- justificativa_ordem: bloco validação.
- risco_da_correcao: baixo.

### 19. ACH-028 — Ausência de validador forte para números de telefone
- severidade: baixo
- classificacao: corrigivel
- arquivo_ou_area_afetada: packages/validators/src/auth.ts, packages/validators/src/clients.ts
- acao_planejada: usar `libphonenumber-js` (`parsePhoneNumberFromString`) com país padrão BR; armazenar em formato E.164.
- dependencias: nenhuma
- justificativa_ordem: bloco validação (mesma área de ACH-009).
- risco_da_correcao: baixo.

### 20. ACH-011 — CSP de produção permite `'unsafe-inline'` para scripts e estilos
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: apps/web/next.config.mjs:7-18, apps/web/middleware.ts (criar/atualizar)
- acao_planejada: migrar para nonces via middleware Next que injeta nonce per-request; eliminar `unsafe-inline` em prod; manter dev permissivo via NODE_ENV.
- dependencias: nenhuma
- justificativa_ordem: bloco headers, isolado.
- risco_da_correcao: alto — pode quebrar scripts inline de bibliotecas terceiras (parcial: pode exigir validação humana em UI).

### 21. ACH-014 — Grafana exposto sem autenticação de aplicação
- severidade: alto
- classificacao: corrigivel
- arquivo_ou_area_afetada: deploy/nginx.conf:68-75, docker-compose.prod.yml:137-150
- acao_planejada: remover fallback "admin" do GRAFANA_PASSWORD (exigir definido); adicionar validação no env Zod.
- dependencias: ACH-012
- justificativa_ordem: bloco operacional/Docker.
- risco_da_correcao: baixo.

### 22. ACH-026 — Containers Docker sem `--read-only`/cap-drop
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: docker-compose.prod.yml
- acao_planejada: adicionar `read_only: true`, `cap_drop: [ALL]`, `cap_add: [NET_BIND_SERVICE]` onde necessário, `security_opt: [no-new-privileges:true]`; tmpfs para caches.
- dependencias: nenhuma
- justificativa_ordem: mesmo arquivo de ACH-014/025.
- risco_da_correcao: medio — pode quebrar runtime de containers que escrevem em paths não-tmpfs.

### 23. ACH-025 — Postgres sem separação de roles
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: docker-compose.prod.yml, packages/db/prisma/scripts/setup-roles.sql (novo), .env.production.example
- acao_planejada: criar script SQL de setup de roles (`wbc_app`, `wbc_migrations`, `wbc_readonly`); atualizar docker-compose para roles segregadas; documentar em SECURITY.md (parcial: execução em prod requer DBA).
- dependencias: nenhuma
- justificativa_ordem: mesmo arquivo de ACH-014/026.
- risco_da_correcao: baixo (script + doc).

### 24. ACH-023 — Endpoint `health.ready` público expõe estado interno detalhado
- severidade: medio
- classificacao: corrigivel
- arquivo_ou_area_afetada: apps/api/src/routers/health.ts:35-89
- acao_planejada: separar payload "pública" (OK/fail) de "detalhada" (interna); restringir ready detalhado a IP interno ou autenticado.
- dependencias: nenhuma
- justificativa_ordem: bloco operacional, isolado.
- risco_da_correcao: baixo.

### 25. ACH-024 — Trilha de auditoria limitada — eventos críticos não persistidos em banco
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: packages/db/prisma/schema.prisma (novo modelo AuditLog), packages/business/audit-log (novo módulo), apps/api/src/trpc/audit-middleware.ts (novo)
- acao_planejada: criar `AuditLog` (tenantId, accountId, action, resource, ip, userAgent, status, detail, createdAt); middleware que loga após mutations críticas; export periódico fica para Fase 7 (parcial).
- dependencias: nenhuma
- justificativa_ordem: bloco auditoria, isolado.
- risco_da_correcao: medio — schema migration.

### 26. ACH-015 — Ausência de secret scanning em pre-commit e em CI
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: package.json (lint-staged), .github/workflows/ci.yml (job gitleaks)
- acao_planejada: adicionar `gitleaks` ao pre-commit via lint-staged; adicionar job gitleaks-action no CI; habilitar GitHub secret scanning fica para humano (parcial: requer UI do GitHub).
- dependencias: nenhuma
- justificativa_ordem: bloco supply-chain/IAM.
- risco_da_correcao: baixo.

### 27. ACH-017 — Branch protection / CODEOWNERS não visíveis no repositório
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo_ou_area_afetada: .github/CODEOWNERS (novo), CONTRIBUTING.md (novo), SECURITY.md (atualizar)
- acao_planejada: criar `.github/CODEOWNERS`; criar `CONTRIBUTING.md` documentando branch protection esperada; configuração no GitHub fica para humano (parcial).
- dependencias: nenhuma
- justificativa_ordem: bloco supply-chain/IAM.
- risco_da_correcao: baixo.

## Achados Não Corrigíveis

### ACH-016 — Sem Secret Manager nem política de rotação de credenciais
- motivo: adoção de AWS Secrets Manager / GCP SM / Vault / Doppler é decisão de infraestrutura/produto que envolve provisionamento externo, contrato e custo. O agente não pode executar essa adoção apenas via código.
- acao_recomendada_ao_usuario: avaliar provedor (Secrets Manager AWS recomendado se já em AWS), provisionar; criar `SECURITY.md` com política de rotação trimestral; integrar via SDK no startup do app. Esta correção será listada para registro humano.

## Resumo do Plano
- Total a corrigir: 27 (19 corrigíveis + 8 parciais)
- Total parcial (requer validação humana após correção): 8
- Total não corrigível (ação humana necessária): 1
- Estimativa de commits: ~28 (1 por achado + commit de inicialização)
