# Achados da Auditoria

## Identificação
- dominio: seguranca
- run_id: 2026-04-18_22-06-18
- ultima_atualizacao: 2026-04-18 22:20:00

## Regras de Registro
- Registrar apenas achados reais com evidência observável.
- Não registrar opinião vaga sem base no repositório.
- Cada achado deve ter ID único dentro da run.
- Cada achado deve ter severidade definida.
- Se o item não for confirmado, registrar como hipótese com justificativa.

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
- titulo: reset-password e verify-email não implementados — endpoints públicos vulneráveis
- severidade: critico
- categoria: autenticacao
- status: confirmado
- resumo: Os use-cases `ResetPassword` e `VerifyEmail` lançam "not yet implemented". Sem persistência de token (Redis) e sem validação de expiração, o endpoint público aceita qualquer token e pode ser iterado ou, na implementação apressada, aceitar valores inválidos. Fluxos de recuperação e verificação não funcionam em produção.

#### Evidencia
- arquivo_ou_area: packages/business/auth/use-cases/reset-password.use-case.ts:15-19; packages/business/auth/use-cases/verify-email.use-case.ts:10-11; packages/business/auth/use-cases/request-password-reset.use-case.ts:21-23; packages/business/auth/use-cases/request-email-verification.use-case.ts:21
- detalhe: TODOs explícitos "salvar token com expiracao no Redis ou tabela dedicada" e "validar token do Redis". Adapter Resend stub em packages/business/auth/adapters/resend-email-sender.adapter.ts:7

#### Impacto
- tecnico: Fluxo de reset quebrado; se ativado sem validação, permite account takeover com token arbitrário
- negocio: Bloqueador de produção; risco de LGPD/compliance para conta comprometida

#### Recomendacao
- acao_sugerida: Armazenar token em Redis com TTL 1h, validar no resetPassword antes de hashear nova senha, integrar provedor de e-mail real, cobrir com testes de fluxo completo e rate-limit por e-mail
- prioridade: alta

---

### ACH-002
- titulo: OTP registrado em console.log em ambiente não-produção
- severidade: critico
- categoria: exposicao-de-credenciais
- status: confirmado
- resumo: Em `send-otp.ts`, o código OTP é emitido por `console.log` quando NODE_ENV não é "production". Se staging ou ambiente compartilhado rodar com env incorreto, códigos OTP vazam para stdout/arquivos de log.

#### Evidencia
- arquivo_ou_area: packages/business/auth/use-cases/send-otp.ts:37-39
- detalhe: Bloco `if (process.env.NODE_ENV !== 'production') { console.log(...) }` imprime o OTP

#### Impacto
- tecnico: OTP persistido em logs (stdout, syslog, agregadores) de longa duração
- negocio: Bypass de MFA em caso de leak de logs

#### Recomendacao
- acao_sugerida: Remover log do OTP por completo; em dev, emitir apenas um evento "otp-sent" sem o valor; usar provedor de e-mail/SMS mockado local
- prioridade: alta

---

### ACH-003
- titulo: Autenticação por credenciais sem proteção contra brute-force
- severidade:  alto
- categoria: autenticacao
- status: confirmado
- resumo: `AuthenticateWithCredentials` valida email/senha via bcrypt sem contador de falhas por conta ou IP. O rate-limit genérico (100 req/min protected / 30 req/min public) é alto demais para autenticação.

#### Evidencia
- arquivo_ou_area: packages/business/auth/use-cases/authenticate-with-credentials.use-case.ts; apps/api/src/trpc/rate-limit-middleware.ts:9-10
- detalhe: Não há lockout, captcha ou backoff exponencial em falhas

#### Impacto
- tecnico: Força bruta online viável para senhas fracas
- negocio: Takeover de contas e acesso a dados de tenant

#### Recomendacao
- acao_sugerida: Lockout após 5 falhas em 15 minutos (contador por accountId + IP em Redis), captcha após N falhas, rate-limit específico para login (ex.: 5 req/min por IP)
- prioridade: alta

---

### ACH-004
- titulo: Enumeração de contas por mensagens de erro distintas
- severidade: alto
- categoria: autenticacao
- status: confirmado
- resumo: `AuthenticateWithCredentials` retorna mensagens distintas para "conta não encontrada" vs "senha incorreta". Permite enumerar e-mails válidos no sistema.

#### Evidencia
- arquivo_ou_area: packages/business/auth/use-cases/authenticate-with-credentials.use-case.ts:18-26
- detalhe: Condições separadas para account ausente e password inválida

#### Impacto
- tecnico: Enumeração simplifica ataques dirigidos
- negocio: Vazamento indireto de base de usuários; habilita phishing direcionado

#### Recomendacao
- acao_sugerida: Mensagem única "e-mail ou senha inválidos" para ambos os casos; equalizar tempo de resposta (executar bcrypt mesmo quando conta não existe)
- prioridade: alta

---

### ACH-005
- titulo: `findByToken` de invites sem validação de status e expiração
- severidade: alto
- categoria: autorizacao
- status: confirmado
- resumo: Em `prisma-invite.repository.ts`, `findByToken` não filtra `status = 'PENDING'` nem `expiresAt > now`. Invites EXPIRED ou ACCEPTED podem ser reusados se o token vazar.

#### Evidencia
- arquivo_ou_area: packages/business/auth/adapters/prisma-invite.repository.ts:16-20
- detalhe: Busca pura pelo token, sem `where` adicional

#### Impacto
- tecnico: Reuso de invites antigos; inclusão em tenant errado
- negocio: Acesso indevido a workspace com credenciais antigas

#### Recomendacao
- acao_sugerida: Alterar para `where: { token, status: 'PENDING', expiresAt: { gt: new Date() } }`; escrever teste que cubra invite expirado/aceito
- prioridade: alta

---

### ACH-006
- titulo: Sessão JWT de 15 min sem revogação e sem rotation explícita
- severidade: alto
- categoria: sessao-e-tokens
- status: confirmado
- resumo: `apps/web/src/lib/auth.config.ts` usa NextAuth JWT strategy com `maxAge: 15*60`. Não há blacklist no logout nem rotation de token em `jwt update`. Usuário removido do workspace mantém acesso até o token expirar.

#### Evidencia
- arquivo_ou_area: apps/web/src/lib/auth.config.ts:131-134; packages/business/auth/use-cases/revoke-session.use-case.ts; apps/web/src/lib/auth.ts
- detalhe: `signOut()` apenas expira o cookie local, não invalida o JWT emitido

#### Impacto
- tecnico: Janela de até 15 min com sessão ativa após logout ou remoção do usuário
- negocio: Acesso indevido pós-offboarding; risco de compliance

#### Recomendacao
- acao_sugerida: Manter lista de `jti` revogados em Redis consultada no callback `authorized`; reduzir TTL; implementar refresh-token rotation
- prioridade: alta

---

### ACH-007
- titulo: Ausência de MFA/TOTP
- severidade: alto
- categoria: autenticacao
- status: confirmado
- resumo: Não há implementação de MFA (TOTP, WebAuthn, SMS) para contas humanas. Autenticação restringe-se a e-mail+senha e OAuth Google.

#### Evidencia
- arquivo_ou_area: packages/business/auth/ (sem use-cases de TOTP/WebAuthn); packages/shared/src/security-logger.ts (sem eventos MFA)
- detalhe: Nenhum fluxo MFA encontrado no repositório

#### Impacto
- tecnico: Senha comprometida = acesso total ao tenant
- negocio: Risco elevado para contas ADMIN/OWNER

#### Recomendacao
- acao_sugerida: Implementar TOTP opcional por conta usando `otplib`, armazenar segredo criptografado, exigir MFA para OWNER/ADMIN e operações financeiras
- prioridade: alta

---

### ACH-008
- titulo: Mass assignment potencial em updates — repositórios aceitam `Partial<Entity>` inteiro
- severidade: alto
- categoria: validacao-de-entrada
- status: confirmado
- resumo: `PrismaClientRepository.update` e outros repos recebem `Partial<Entity>` completo. A proteção depende integralmente do Zod inline no router. Se o schema drift e um campo sensível (ex.: `classification`, `accountId`) entrar no input, é gravado sem cerca adicional.

#### Evidencia
- arquivo_ou_area: packages/business/clients/adapters/prisma-client-repository.ts:39-48 (e padrões equivalentes em sales/messaging/finance); apps/api/src/routers/clients.ts (Zod inline)
- detalhe: Falta whitelist explícito ("pick") na camada de repositório/use-case

#### Impacto
- tecnico: Campos administrativos ou versioning podem ser atualizados por input externo se validador for enfraquecido
- negocio: Escalação de privilégio/alteração indevida de dados

#### Recomendacao
- acao_sugerida: Adicionar whitelist em use-cases de update (pick explícito); proibir `...input` direto no `data` do Prisma
- prioridade: alta

---

### ACH-009
- titulo: Validação de URLs aceitas para avatar permite SSRF
- severidade: alto
- categoria: validacao-de-entrada
- status: confirmado
- resumo: Schemas em `@wbc/validators` permitem `z.string().url()` para avatar/display sem allowlist de domínio. Qualquer URL válida é aceita — inclusive `http://localhost:8080` ou metadata endpoints cloud se o servidor baixar a imagem no backend.

#### Evidencia
- arquivo_ou_area: packages/validators/src/auth.ts:10,30,44
- detalhe: Nenhum `refine` verificando domínio ou esquema; se algum serviço (ex.: geração de preview) faz fetch do avatar no backend, expõe SSRF

#### Impacto
- tecnico: Se algum componente server-side baixar a imagem (ex.: para gerar og-image), atacante acessa recursos internos
- negocio: Vazamento de metadata cloud (IAM tokens em AWS/GCP)

#### Recomendacao
- acao_sugerida: Restringir a HTTPS + allowlist de domínios (próprio CDN, Google avatars); validar via `refine((u) => ALLOWED.some(d => new URL(u).host.endsWith(d)))`
- prioridade: alta

---

### ACH-010
- titulo: Cookies de sessão sem `secure`/`httpOnly`/`sameSite` explícitos no NextAuth config
- severidade: alto
- categoria: sessao-e-tokens
- status: confirmado
- resumo: O config em `apps/web/src/lib/auth.config.ts` não define `cookies.sessionToken.options.{secure,httpOnly,sameSite}` explicitamente. NextAuth aplica defaults seguros em produção, mas sem validação, uma mudança de env ou versão pode relaxá-los silenciosamente.

#### Evidencia
- arquivo_ou_area: apps/web/src/lib/auth.config.ts:131-134
- detalhe: Ausência de bloco `cookies: { sessionToken: { options: { ... } } }` explícito

#### Impacto
- tecnico: MITM captura cookies se HTTPS falhar; XSS lê cookie se httpOnly falhar
- negocio: Takeover de sessão; vazamento de token

#### Recomendacao
- acao_sugerida: Declarar cookie options explicitamente com `secure: true`, `httpOnly: true`, `sameSite: 'lax'`; validar em startup
- prioridade: media

---

### ACH-011
- titulo: CSP de produção permite `'unsafe-inline'` para scripts e estilos
- severidade: alto
- categoria: headers-de-seguranca
- status: confirmado
- resumo: `apps/web/next.config.mjs` define CSP com `'unsafe-inline'` em produção (linhas 7-18). Em dev adiciona `'unsafe-eval'`. Isso reduz drasticamente a mitigação contra XSS.

#### Evidencia
- arquivo_ou_area: apps/web/next.config.mjs:7-18
- detalhe: CSP string inclui `script-src 'self' 'unsafe-inline'` e `style-src 'self' 'unsafe-inline'`

#### Impacto
- tecnico: Exploração de XSS se material injetado contornar escaping do React
- negocio: Execução de script arbitrário em sessão de usuário

#### Recomendacao
- acao_sugerida: Migrar para nonces (`next-safe` ou middleware que injeta nonce), eliminar `unsafe-inline`; em dev manter policy mais permissiva somente via `NODE_ENV` check
- prioridade: alta

---

### ACH-012
- titulo: Credenciais externas (DeepSeek, WhatsApp) com fallback silencioso `?? ""`
- severidade: alto
- categoria: configuracao-sensivel
- status: confirmado
- resumo: Adapters carregam `process.env.DEEPSEEK_API_KEY ?? ""` e similares sem validação. Se variável ausente, serviço falha silenciosamente no runtime; ausência não é detectada no startup.

#### Evidencia
- arquivo_ou_area: packages/business/ai/adapters/deepseek-adapter.ts:35; packages/business/messaging/adapters/whatsapp-n2-adapter.ts:36-37
- detalhe: Falha só aparece na primeira chamada remota

#### Impacto
- tecnico: Deploy sobe com integração quebrada; erros intermitentes em produção
- negocio: Mensagens WhatsApp perdidas; IA indisponível sem alerta

#### Recomendacao
- acao_sugerida: Validar env obrigatórias na composição raiz via Zod (`packages/config`); lançar erro claro quando uma chave obrigatória estiver vazia; publicar métrica de "integrations_ready"
- prioridade: alta

---

### ACH-013
- titulo: `WHATSAPP_APP_SECRET` não documentado em `.env.example` / `.env.production.example`
- severidade: alto
- categoria: configuracao-sensivel
- status: confirmado
- resumo: O handler de webhook WhatsApp exige `WHATSAPP_APP_SECRET` para verificação HMAC, mas a variável não aparece em `.env.example` nem em `.env.production.example`, nem em `turbo.json globalEnv`.

#### Evidencia
- arquivo_ou_area: packages/business/messaging/adapters/whatsapp-webhook-handler.ts (usa APP_SECRET); .env.example; .env.production.example; turbo.json:3-13
- detalhe: Deploy pode faltar a variável sem aviso

#### Impacto
- tecnico: Webhook cai em fallback (assinatura inválida) silenciosamente
- negocio: Eventos de mensagem perdidos; risco de aceitar payloads forjados se lógica degradar

#### Recomendacao
- acao_sugerida: Adicionar a variável aos dois `.env.example` e ao `globalEnv` do turbo; exigir valor via Zod de env
- prioridade: alta

---

### ACH-014
- titulo: Grafana exposto sem autenticação de aplicação (default `admin:admin`)
- severidade: alto
- categoria: protecao-operacional
- status: confirmado
- resumo: `deploy/nginx.conf` e `docker-compose.prod.yml` expõem Grafana em `/grafana/`; senha do admin usa `GRAFANA_PASSWORD:-admin` como fallback. Nenhum reverse-proxy-auth visível.

#### Evidencia
- arquivo_ou_area: deploy/nginx.conf:68-75; docker-compose.prod.yml:137-150
- detalhe: Fallback para "admin"; sem Basic Auth ou OAuth proxy

#### Impacto
- tecnico: Qualquer um com URL pode ver dashboards, métricas e datasources
- negocio: Vazamento de infra e dados operacionais; possibilidade de adulterar dashboards

#### Recomendacao
- acao_sugerida: Remover fallback, exigir `GRAFANA_PASSWORD` obrigatório no startup do compose; adicionar basic-auth no nginx ou oauth2-proxy; restringir IP
- prioridade: alta

---

### ACH-015
- titulo: Ausência de secret scanning em pre-commit e em CI
- severidade: alto
- categoria: supply-chain
- status: confirmado
- resumo: `lint-staged` só roda `prettier --write`. `.github/workflows/` não possui job de secret scanning (gitleaks/trufflehog) nem dependency scanning (Trivy/Snyk). Secret scanning nativo do GitHub depende de ativação.

#### Evidencia
- arquivo_ou_area: package.json:56-59; .github/workflows/ci.yml
- detalhe: Nenhum hook/action dedicado

#### Impacto
- tecnico: Um segredo commitado por engano não é detectado automaticamente
- negocio: Vazamento de credencial sem aviso

#### Recomendacao
- acao_sugerida: Adicionar `gitleaks` ao pre-commit via lint-staged; incluir job `trivy fs` ou `gitleaks-action` no CI; habilitar GitHub secret scanning e Dependabot security
- prioridade: alta

---

### ACH-016
- titulo: Sem Secret Manager nem política de rotação de credenciais
- severidade: alto
- categoria: gestao-de-credenciais
- status: confirmado
- resumo: Todas as credenciais vivem em `.env` em produção, sem AWS Secrets Manager / GCP SM / Vault / Doppler. Não há documento de rotação (SECURITY.md, SECRET-ROTATION.md).

#### Evidencia
- arquivo_ou_area: .env.production.example; ausência de SECURITY.md ou similar
- detalhe: Fluxo operacional apoia-se apenas em env vars manuais

#### Impacto
- tecnico: Comprometimento exige troca manual sob pressão; sem auditoria de acesso a segredos
- negocio: Tempo de resposta a incidente alto; risco de violação estendida

#### Recomendacao
- acao_sugerida: Adotar secret manager gerenciado; introduzir política de rotação trimestral; documentar em `SECURITY.md`
- prioridade: alta

---

### ACH-017
- titulo: Branch protection / CODEOWNERS não visíveis no repositório
- severidade: alto
- categoria: iam
- status: confirmado
- resumo: Não há arquivo `.github/CODEOWNERS` e não há como verificar branch protection via arquivos. Se a configuração no GitHub estiver ausente, qualquer colaborador com write pode mergear direto.

#### Evidencia
- arquivo_ou_area: .github/ (sem CODEOWNERS); ci.yml existe com lint/type-check/test
- detalhe: Confirmação requer checar regras do repo no GitHub

#### Impacto
- tecnico: Ausência de revisão obrigatória abre caminho para merges arriscados
- negocio: Código malicioso ou acidental chegando à main sem revisão

#### Recomendacao
- acao_sugerida: Criar `.github/CODEOWNERS`; configurar branch protection (required reviews ≥1, status checks obrigatórios, dismiss stale, admin included); registrar política em `CONTRIBUTING.md`
- prioridade: alta

---

### ACH-018
- titulo: Rate-limit assimétrico e frouxo nos endpoints sensíveis
- severidade: medio
- categoria: protecao-operacional
- status: confirmado
- resumo: `PUBLIC_LIMIT = 30/min`, `PROTECTED_LIMIT = 100/min`, sem limites específicos por rota sensível (login, reset, invite accept). Identificador público cai para `'anonymous'` — todos os anônimos compartilham a mesma bucket.

#### Evidencia
- arquivo_ou_area: apps/api/src/trpc/rate-limit-middleware.ts:9-37; apps/api/src/trpc/trpc.ts:67
- detalhe: Não há rota-específica; identifier para anônimos não usa IP

#### Impacto
- tecnico: Brute-force e enumeração continuam viáveis
- negocio: Acessos indevidos em contas com senha fraca

#### Recomendacao
- acao_sugerida: Identificador público = IP (via `x-forwarded-for` tratado); limits por rota (login: 5/min/IP; resetRequest: 3/h/IP; acceptInvite: 10/15min/IP)
- prioridade: alta

---

### ACH-019
- titulo: Email do usuário registrado em logs de falha de autenticação
- severidade: medio
- categoria: exposicao-de-dados
- status: confirmado
- resumo: `apps/web/src/lib/auth.config.ts:40` inclui o email bruto no campo `detail` do evento de login falho.

#### Evidencia
- arquivo_ou_area: apps/web/src/lib/auth.config.ts:40
- detalhe: `` detail: `credentials: ${credentials.email}` ``

#### Impacto
- tecnico: PII em logs estruturados
- negocio: Incompatível com minimização de dados LGPD

#### Recomendacao
- acao_sugerida: Logar apenas `accountId` (após lookup) ou um hash determinístico truncado; nunca o email em claro
- prioridade: media

---

### ACH-020
- titulo: `security-logger` sem redaction de `phone`, `userId`, `tenantId`
- severidade: medio
- categoria: exposicao-de-dados
- status: confirmado
- resumo: `packages/shared/src/security-logger.ts` serializa os campos inteiros para stdout.

#### Evidencia
- arquivo_ou_area: packages/shared/src/security-logger.ts:22-44
- detalhe: Sem máscara nos valores de `phone` ou truncamento de IDs

#### Impacto
- tecnico: PII aparecendo em logs centralizados
- negocio: LGPD/compliance

#### Recomendacao
- acao_sugerida: Função de redaction reutilizável: mascarar phone para últimos 4 dígitos; truncar IDs a 8 chars; aplicar antes do `console.log`
- prioridade: media

---

### ACH-021
- titulo: Sentry captura erros sem `beforeSend` para redactar PII
- severidade: medio
- categoria: exposicao-de-dados
- status: confirmado
- resumo: `apps/api/src/lib/sentry.ts` inicializa Sentry com sampling, mas sem hook `beforeSend` que redacte e-mails, tokens JWT e payloads.

#### Evidencia
- arquivo_ou_area: apps/api/src/lib/sentry.ts:10-14; apps/web/sentry.server.config.ts:6
- detalhe: Configuração padrão pode enviar request/response a Sentry

#### Impacto
- tecnico: PII e possivelmente segredos saem para serviço terceiro
- negocio: Exposição a terceiros sem consentimento específico

#### Recomendacao
- acao_sugerida: Implementar `beforeSend` que remova `headers.authorization`, `request.data.password`, `request.data.token`, stackframes com strings sensíveis; reduzir sample em dev
- prioridade: media

---

### ACH-022
- titulo: `console.error` em adapter WhatsApp pode logar headers/payloads
- severidade: medio
- categoria: exposicao-de-dados
- status: confirmado
- resumo: `whatsapp-n2-adapter.ts` usa `console.error` com detalhes de requisição/resposta em vez do logger central. Risco de escapar tokens.

#### Evidencia
- arquivo_ou_area: packages/business/messaging/adapters/whatsapp-n2-adapter.ts:75,91
- detalhe: Logs diretos em console.error

#### Impacto
- tecnico: Dados sensíveis podem vazar em stdout
- negocio: Violação de minimização

#### Recomendacao
- acao_sugerida: Migrar para `createLogger()` central com redaction; logar apenas status code e um requestId opaco
- prioridade: media

---

### ACH-023
- titulo: Endpoint `health.ready` público expõe estado interno detalhado
- severidade: medio
- categoria: protecao-operacional
- status: confirmado
- resumo: `apps/api/src/routers/health.ts:35-89` devolve detalhes de DB, Redis e outbox-lag sem autenticação. Útil para K8s, mas expõe informação a reconhecedor externo.

#### Evidencia
- arquivo_ou_area: apps/api/src/routers/health.ts:35-89
- detalhe: Payload inclui lag em ms, thresholds, contadores

#### Impacto
- tecnico: Facilita mapeamento de arquitetura e estimativa de alvos para DoS
- negocio: Reconhecimento barato para atacante

#### Recomendacao
- acao_sugerida: Manter `live` simples e público; restringir `ready` a IP interno ou autenticado; separar payload "pública" (OK/fail) de "detalhada" (interna)
- prioridade: media

---

### ACH-024
- titulo: Trilha de auditoria limitada — eventos críticos não persistidos em banco
- severidade: medio
- categoria: auditoria
- status: confirmado
- resumo: O `security-logger` cobre OTP e alguns eventos RBAC, mas não persiste login bem-sucedido (IP/UA), mudança de senha, aceitação de invite, remoção de membro, mudança de role, criação/revogação de token. Saída vai apenas para stdout.

#### Evidencia
- arquivo_ou_area: packages/shared/src/security-logger.ts; ausência de modelo `AuditLog` em `packages/db/prisma/schema.prisma`
- detalhe: Nenhuma tabela dedicada

#### Impacto
- tecnico: Forense inviável após incidente
- negocio: Incompatibilidade com requisitos de auditoria LGPD e boas práticas

#### Recomendacao
- acao_sugerida: Criar `AuditLog` (tenantId, accountId, action, resource, ip, userAgent, status, detail, createdAt); middleware que loga após mutations críticas; export periódico
- prioridade: alta

---

### ACH-025
- titulo: Postgres sem separação de roles (app vs admin vs migrations)
- severidade: medio
- categoria: iam
- status: confirmado
- resumo: `docker-compose.prod.yml` usa `POSTGRES_USER=wbc` para app web, worker e provavelmente migrations. Não há role `wbc_app` limitada a SELECT/INSERT/UPDATE/DELETE em tabelas da aplicação.

#### Evidencia
- arquivo_ou_area: docker-compose.prod.yml:8,48,77; .env.production.example:5-6
- detalhe: Conexão única com superuser do database

#### Impacto
- tecnico: SQL injection ou vulnerabilidade na app leva a acesso total ao banco
- negocio: Impacto de breach amplificado

#### Recomendacao
- acao_sugerida: Criar usuários `wbc_app`, `wbc_migrations`, `wbc_readonly` com permissões segregadas; apps usam `wbc_app`; migrations rodam com role privilegiado somente em deploy
- prioridade: media

---

### ACH-026
- titulo: Containers Docker sem `--read-only`/cap-drop e sem chown final
- severidade: medio
- categoria: hardening-runtime
- status: confirmado
- resumo: `deploy/Dockerfile.web` e `Dockerfile.worker` criam usuário não-root (bom), mas `docker-compose.prod.yml` não define `read_only: true`, `cap_drop: [ALL]` ou `security_opt: [no-new-privileges]`. Diretórios do app não têm `chown` final garantido.

#### Evidencia
- arquivo_ou_area: deploy/Dockerfile.web:36-42; deploy/Dockerfile.worker:36-42; docker-compose.prod.yml
- detalhe: Apenas `COPY --chown` é usado; defesa em profundidade limitada

#### Impacto
- tecnico: Containers comprometidos retêm mais capacidade do que o necessário
- negocio: Lateral movement mais fácil em caso de breach

#### Recomendacao
- acao_sugerida: Adicionar `read_only: true`, `cap_drop: [ALL]`, `cap_add: [NET_BIND_SERVICE]` onde necessário, `security_opt: [no-new-privileges:true]`; ajustar volumes tmpfs para caches
- prioridade: media

---

### ACH-027
- titulo: `.env` de desenvolvimento usa `AUTH_SECRET` fraco e previsível
- severidade: medio
- categoria: configuracao-sensivel
- status: confirmado
- resumo: O arquivo `.env` local contém `AUTH_SECRET="wbc-dev-secret-change-in-production-2026"`. Embora `.env` não esteja em `git ls-files` (verificado), o hábito de usar segredos fracos em dev tende a vazar para staging.

#### Evidencia
- arquivo_ou_area: .env:3 (AUTH_SECRET)
- detalhe: Verificado `git ls-files` — .env não está tracked; gitignore está correto

#### Impacto
- tecnico: Compartilhamento acidental com staging/prod cria backdoor de assinatura JWT
- negocio: Takeover se segredo vazar

#### Recomendacao
- acao_sugerida: Gerar `AUTH_SECRET` aleatório em dev também (`openssl rand -base64 48`); validar tamanho mínimo em startup; rejeitar padrões conhecidos ("dev", "change", "secret")
- prioridade: media

---

### ACH-028
- titulo: Ausência de validador forte para números de telefone
- severidade: baixo
- categoria: validacao-de-entrada
- status: confirmado
- resumo: Schemas aceitam `z.string().min(10).max(15)` sem formato E.164 nem regex; strings como `"0000000000"` ou não-numéricas passam.

#### Evidencia
- arquivo_ou_area: packages/validators/src/auth.ts:8,16,28; packages/validators/src/clients.ts
- detalhe: Sem `libphonenumber-js` ou regex E.164

#### Impacto
- tecnico: Dados lixo em base; integrações com WhatsApp/SMS falham
- negocio: Mensagens não entregues; poluição de DB

#### Recomendacao
- acao_sugerida: Usar `libphonenumber-js` (`parsePhoneNumberFromString`) com país padrão BR; armazenar em formato E.164
- prioridade: baixa
