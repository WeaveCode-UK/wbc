# Progresso da Correção

## Identificação
- dominio: seguranca
- run_id: 2026-04-18_22-06-18
- branch: fix/seguranca/2026-04-18_22-06-18
- data_inicio: 2026-04-19 22:20:00
- ultima_atualizacao: 2026-04-19 22:20:00
- fase_atual: executor
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 27
- corrigidos_executor: 0
- revisados_revisor: 0
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 1
- nao_aprovados: 0
- pendentes: 27

## Achados

### ACH-012
- titulo: Credenciais externas (DeepSeek, WhatsApp) com fallback silencioso `?? ""`
- severidade: alto
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-013
- titulo: `WHATSAPP_APP_SECRET` não documentado em `.env.example` / `.env.production.example`
- severidade: alto
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-027
- titulo: `.env` de desenvolvimento usa `AUTH_SECRET` fraco e previsível
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-020
- titulo: `security-logger` sem redaction de `phone`, `userId`, `tenantId`
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-019
- titulo: Email do usuário registrado em logs de falha de autenticação
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-022
- titulo: `console.error` em adapter WhatsApp pode logar headers/payloads
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
- observacoes: none

### ACH-021
- titulo: Sentry captura erros sem `beforeSend` para redactar PII
- severidade: medio
- classificacao: corrigivel
- status_executor: pendente
- status_revisor: pendente
- commit_executor: none
- commit_revisor: none
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
