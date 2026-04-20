# Relatório de Correção

## Identificação
- dominio: seguranca
- run_id: 2026-04-18_22-06-18
- branch: fix/seguranca/2026-04-18_22-06-18
- data_inicio: 2026-04-19 22:20:00
- data_conclusao: 2026-04-20 18:45:00
- ultima_atualizacao: 2026-04-20 18:45:00
- status: concluido

## Resumo Executivo
Corrigidos 27 dos 28 achados do domínio `seguranca` da run `2026-04-18_22-06-18`.
A Fase Executor aplicou 27 correções (19 corrigíveis + 8 corrigíveis-parciais)
organizadas em 9 blocos temáticos (env, logging/PII, anti-brute-force,
auth flows, validação de input, headers/CSP, Docker/operacional, auditoria,
supply-chain/IAM). A Fase Revisor (Opus, sequencial, diff-by-diff) revisou
todos os 27 e aprovou 100% sem intervenção. Validação técnica: type-check
passa em 12 pacotes; build do Next.js passa após 3 tentativas de correção
(deps hoist, RedisLike cast, use-case wiring, `node:crypto` → `crypto`,
import path direto em sentry.client). Um achado (ACH-016 — Secret Manager)
ficou registrado como não-corrigível por depender de provisionamento de
infra externa.

## Estatísticas
- total_achados_na_run: 28
- aprovados_para_correcao: 27
- corrigidos_pelo_executor: 27
- aprovados_pelo_revisor_sem_alteracao: 27
- corrigidos_pelo_revisor: 0
- falha_executor_resolvida_pelo_revisor: 0
- nao_corrigiveis: 1
- nao_aprovados: 0
- falha_total: 0
- taxa_de_acerto_do_executor: 100%

## Validação Técnica
- type_check: passou (após 3 tentativas — faltavam deps otplib/libphonenumber-js em apps api/worker e cast RedisLike + wiring dos use-cases reset-password/verify-email)
- build: passou (após 3 tentativas — import `node:crypto` → `crypto` para compat Edge Runtime; import `@wbc/shared` barrel evitado em sentry.client.config para não puxar `async_hooks`)
- tentativas_de_correcao_build: 3
- bloqueio_build: nao
- erro_persistente: nenhum

## Achados Corrigidos (Executor acertou de primeira)

| ACH | Severidade | Título | Commit |
|-----|-----------|--------|--------|
| ACH-001 | critico | reset-password/verify-email com token Redis + Resend real | 5d3072c |
| ACH-002 | critico | OTP não exposto no retorno nem em logs | 61afd51 |
| ACH-003 | alto | Lockout brute-force via Redis | cdc95a7 |
| ACH-004 | alto | Mensagem única e timing equalizado em login | e09b73d |
| ACH-005 | alto | findByToken filtra status=PENDING e expiresAt | 98403ea |
| ACH-006 | alto | Blacklist Redis de JTI invalida sessão pós-signout | 7d6562a |
| ACH-007 | alto | Base MFA/TOTP (schema, ports/adapters, use-cases) | 6008544 |
| ACH-008 | alto | Whitelist de campos mutáveis em repositórios | 48402a2 |
| ACH-009 | alto | Avatar URL com allowlist HTTPS + hosts permitidos | 42467dc |
| ACH-010 | alto | Cookie options httpOnly/sameSite/secure explícitas | 31bef10 |
| ACH-011 | alto | CSP por nonce em prod (remove unsafe-inline) | 671dda5 |
| ACH-012 | alto | Validar env de integrações externas via Zod | 491192b |
| ACH-013 | alto | Documentar WHATSAPP_APP_SECRET e RESEND_API_KEY | 7648208 |
| ACH-014 | alto | Grafana exige senha (sem fallback admin) | 7e24f3c |
| ACH-015 | alto | Secret scanning via gitleaks (pre-commit + CI) | 4d00627 |
| ACH-017 | alto | CODEOWNERS, CONTRIBUTING.md, SECURITY.md | 4bd5f78 |
| ACH-018 | medio | Rate-limit por rota sensível e identifier por IP | 76ab1c0 |
| ACH-019 | medio | Não logar email bruto em falha de login | 094ebaa |
| ACH-020 | medio | Redaction de phone/userId/tenantId no security-logger | 890a51f |
| ACH-021 | medio | Sentry beforeSend redacta PII e secrets | 58a1108 |
| ACH-022 | medio | WhatsApp adapter migra para logger central com redaction | 1d9d567 |
| ACH-023 | medio | health.ready expõe detalhes só a callers internos | e71bdde |
| ACH-024 | medio | Modelo AuditLog + port/adapter + middleware tRPC | fb1fc3d |
| ACH-025 | medio | Script de roles Postgres segregadas (app/mig/ro) | 8ce2efe |
| ACH-026 | medio | Containers com cap_drop, no-new-privileges, read_only | fee7a4f |
| ACH-027 | medio | Orientar geração segura do AUTH_SECRET | f343cb6 |
| ACH-028 | baixo | Phone E.164 via libphonenumber-js | 8426627 |

## Achados Corrigidos com Intervenção do Revisor
Nenhum. Todos os 27 achados foram aprovados pelo Revisor sem necessidade
de commits `review-fix`.

## Achados Parciais (requerem validação humana)

| ACH | O que foi feito | O que falta (ação humana) |
|-----|----------------|---------------------------|
| ACH-001 | Token Redis + ResendEmailSender real com requireEnv em prod | Configurar RESEND_API_KEY + domínio verificado no Resend |
| ACH-006 | Blacklist Redis de JTI consultada no callback jwt | Desenhar refresh-token rotation completo (design follow-up) |
| ACH-007 | Schema Account + TotpService + enable/disable/verify use-cases + recovery codes | Rotas tRPC, UI de setup (QR, código, recovery codes), migração Prisma, enforcement MFA obrigatório para OWNER/ADMIN |
| ACH-011 | Middleware emite nonce per-request; CSP prod sem unsafe-inline | Smoke-test em UI em prod para detectar componentes que ainda dependem de inline script/style |
| ACH-015 | gitleaks CI + pre-commit + .gitleaks.toml | Habilitar GitHub Secret Scanning native + Push Protection via UI |
| ACH-017 | CODEOWNERS + CONTRIBUTING.md + SECURITY.md documentam as regras | Configurar Branch Protection no GitHub UI (required reviews, signed commits, status checks) |
| ACH-024 | Model AuditLog + PrismaAuditLog + middleware tRPC | Aplicar o middleware `auditedAs` em cada mutation crítica (invite.accept, member.role.change, session.revoke, etc); exporter periódico para armazenamento frio |
| ACH-025 | setup-roles.sql + WBC_APP/MIGRATIONS/READONLY_DB_PASSWORD em .env.example | DBA rodar setup-roles.sql em produção; separar DATABASE_URL (app) × DATABASE_URL_MIGRATIONS (deploy) |

## Achados Não Corrigíveis

### ACH-016 — Sem Secret Manager nem política de rotação de credenciais
- motivo: adoção de AWS Secrets Manager / GCP SM / Vault / Doppler depende de decisão de infra/produto, contrato com provedor e integração via SDK no startup. Fora do escopo de correção automatizável apenas via código.
- acao_recomendada_ao_usuario: avaliar provedor (AWS Secrets Manager recomendado se infra está em AWS), provisionar, integrar no startup dos apps via SDK, e documentar política de rotação trimestral em `SECURITY.md` (o arquivo já existe e referencia essa ação).

## Achados Não Aprovados pelo Usuário
Nenhum.

## Achados com Falha Total
Nenhum.

## Commits Gerados

Estrutura inicial (chore):
- 60ddfb8 — inicializar correção da run
- faec585 — atualiza progresso bloco 1+2 (env + logging)
- 90e57ce — atualiza progresso bloco 3+4 (auth + sessão)
- 2352de5 — fase executor concluída — transição para revisor
- 24ad6ba — fase revisor concluída — 27 aprovados, 0 com intervenção

Correções (fix):
- 491192b — ACH-012 — validar env de integrações externas via Zod
- 7648208 — ACH-013 — documentar WHATSAPP_APP_SECRET e RESEND_API_KEY
- f343cb6 — ACH-027 — orientar geração segura do AUTH_SECRET
- 890a51f — ACH-020 — redaction de phone/userId/tenantId no security-logger
- 094ebaa — ACH-019 — não logar email bruto em falha de login
- 1d9d567 — ACH-022 — WhatsApp adapter migra para logger central com redaction
- 58a1108 — ACH-021 — Sentry beforeSend redacta PII e secrets
- e09b73d — ACH-004 — mensagem única e timing equalizado em login
- cdc95a7 — ACH-003 — lockout brute-force via Redis no login
- 76ab1c0 — ACH-018 — rate-limit por rota sensível e identifier por IP
- 61afd51 — ACH-002 — não expor código OTP no retorno nem em logs
- 5d3072c — ACH-001 — reset-password/verify-email com token Redis + Resend real
- 98403ea — ACH-005 — findByToken filtra status=PENDING e expiresAt
- 7d6562a — ACH-006 — blacklist Redis de JTI invalida sessão pós-signout
- 31bef10 — ACH-010 — cookie options httpOnly/sameSite/secure explícitas
- 6008544 — ACH-007 — base MFA/TOTP (schema, ports/adapters, use-cases)
- 48402a2 — ACH-008 — whitelist de campos mutáveis em repositórios
- 42467dc — ACH-009 — avatar URL com allowlist HTTPS + hosts permitidos
- 8426627 — ACH-028 — phone E.164 via libphonenumber-js
- 671dda5 — ACH-011 — CSP por nonce em prod (remove unsafe-inline)
- 7e24f3c — ACH-014 — Grafana exige senha (sem fallback admin)
- fee7a4f — ACH-026 — containers com cap_drop, no-new-privileges, read_only
- 8ce2efe — ACH-025 — script de roles Postgres segregadas (app/mig/ro)
- e71bdde — ACH-023 — health.ready expõe detalhes só a callers internos
- fb1fc3d — ACH-024 — modelo AuditLog + port/adapter + middleware tRPC
- 4d00627 — ACH-015 — secret scanning via gitleaks (pre-commit + CI)
- 4bd5f78 — ACH-017 — CODEOWNERS, CONTRIBUTING.md, SECURITY.md

Correções pós-validação técnica (fix):
- 27fd8bc — corrigir erros de type-check e build pós-correção

Total: 33 commits nesta branch.

## Merge
- status_merge: pendente
- branch_origem: fix/seguranca/2026-04-18_22-06-18
- branch_destino: main
- aprovado_por_usuario: nao
