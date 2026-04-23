# Progresso da Correção

## Identificação
- dominio: compliance-privacidade
- run_id: 2026-04-19_21-00-11
- branch: fix/compliance-privacidade/2026-04-19_21-00-11
- data_inicio: 2026-04-23 04:40:00
- ultima_atualizacao: 2026-04-23 07:30:00
- fase_atual: revisor_concluido
- status: em_andamento

## Resumo de Progresso
- total_aprovados: 22
- corrigidos_executor: 22
- revisados_revisor: 22
- aprovados_direto: 22
- corrigidos_pelo_revisor: 0
- nao_corrigiveis: 0
- nao_aprovados: 0
- pendentes: 0

## Achados

### ACH-008
- titulo: Sentry beforeSend
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- commit_executor: e87884f
- arquivos_alterados: packages/shared/src/sentry-redaction.ts
- descricao_correcao: SENSITIVE_KEYS_RE expandido com phone/telefone/whatsapp/cpf/cnpj/allergies/notes/preferences
- status_revisor: aprovado
- commit_revisor: none
- nota_revisor: regex expandido cobre exatamente as categorias recomendadas; helper reutilizado por api + web

### ACH-009
- titulo: Log redaction
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- commit_executor: 330c5d9
- arquivos_alterados: apps/api/src/trpc/logging-middleware.ts
- descricao_correcao: redactId no tenantId antes de logger[level]
- status_revisor: aprovado
- commit_revisor: none
- nota_revisor: redactId aplicado corretamente antes do logging; import via @wbc/shared

### ACH-015
- titulo: Incident response runbook
- severidade: alto
- classificacao: corrigivel
- status_executor: corrigido
- commit_executor: 34d58e2
- arquivos_alterados: docs/INCIDENT_RESPONSE_PRIVACY.md
- descricao_correcao: runbook 6 fases, matriz severidade, comunicação, métricas drill
- status_revisor: aprovado
- commit_revisor: none
- nota_revisor: runbook completo com prazo ANPD (2 dias úteis), matriz de severidade, fluxo 6 fases, pendências humanas explícitas

### ACH-022
- titulo: Link Direitos do Titular em forms
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- commit_executor: ca55860
- arquivos_alterados: apps/web/src/components/data-rights-link.tsx (novo); apps/web/src/app/(auth)/reset-password/page.tsx
- descricao_correcao: componente reutilizável + uso em reset-password
- status_revisor: aprovado
- commit_revisor: none
- nota_revisor: componente criado e posicionado; string hardcoded (não via useTranslations) — pendência menor de i18n documentada para próxima revisão UX

### ACH-021
- titulo: Processo de revisão de políticas
- severidade: baixo
- classificacao: corrigivel
- status_executor: corrigido
- commit_executor: f5580bb
- arquivos_alterados: docs/POLICY-REVIEW-PROCESS.md
- descricao_correcao: cadência anual, checklist, frontmatter padrão
- status_revisor: aprovado
- commit_revisor: none
- nota_revisor: cadência anual + checklist + workflow de mudança + pendências humanas bem detalhadas

### ACH-002
- titulo: Política de privacidade pública
- severidade: critico
- classificacao: corrigivel_parcial
- status_executor: corrigido
- commit_executor: 11f5f9d
- arquivos_alterados: docs/PRIVACY_POLICY.md (novo), docs/PRIVACY_POLICY-EN.md (novo), apps/web/src/app/privacy-policy/page.tsx (novo)
- descricao_correcao: template LGPD/GDPR completo + placeholder route + EN stub
- status_revisor: aprovado
- commit_revisor: none
- nota_revisor: template completo com frontmatter, rota /privacy-policy funcional; marcações ⚠️ onde precisa DPO/jurídico

### ACH-003
- titulo: Mecanismo de consentimento
- severidade: critico
- classificacao: corrigivel_parcial
- status_executor: corrigido
- commit_executor: 19ca631
- arquivos_alterados: packages/db/prisma/migrations/manual/003_consent_log.sql (novo), docs/CONSENT-FRAMEWORK.md (novo)
- descricao_correcao: migration ConsentLog com RLS + framework doc
- status_revisor: aprovado
- commit_revisor: none
- nota_revisor: migration SQL com RLS, índice parcial (revoked_at IS NULL), check constraint; aplicada via apply_manual_migrations

### ACH-019
- titulo: Aviso transferência internacional no onboarding
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- commit_executor: 36d0572
- arquivos_alterados: apps/web/src/app/(auth)/onboarding/page.tsx
- descricao_correcao: aviso no step 3 citando USA/Argentina/China + link política + link direitos
- status_revisor: aprovado
- commit_revisor: none
- nota_revisor: aviso integrado ao step 3 com link para política; strings hardcoded (pendência i18n menor)

### ACH-005
- titulo: Transferência internacional safeguards
- severidade: critico
- classificacao: corrigivel_parcial
- status_executor: corrigido
- commit_executor: f3db2a7
- arquivos_alterados: docs/INTERNATIONAL-TRANSFERS.md (novo)
- descricao_correcao: matriz por fornecedor com decisão de adequação + safeguard atual/alvo; plano DeepSeek
- status_revisor: aprovado
- commit_revisor: none
- nota_revisor: matriz com 10 sub-processadores, decisão de adequação ANPD, safeguard atual vs alvo; SCC DeepSeek marcado como obrigatório

### ACH-007
- titulo: Sub-processadores / DPAs
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- commit_executor: d776734
- arquivos_alterados: docs/SUB_PROCESSORS.md (novo)
- descricao_correcao: tabela com 10 sub-processadores (país, finalidade, DPA, local de armazenamento, contato)
- status_revisor: aprovado
- commit_revisor: none
- nota_revisor: tabela completa com finalidade, dados processados, DPA status, contato; notificação de mudança 30 dias

### ACH-006
- titulo: DPIA/RIPD
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- commit_executor: 3b90bfc
- arquivos_alterados: docs/DPIA.md (novo)
- descricao_correcao: template com matriz necessidade, descrição sistemática, matriz de riscos, conclusão
- status_revisor: aprovado
- commit_revisor: none
- nota_revisor: template estrutural com matriz de necessidade, marcações ⚠️ para validação DPO/CISO

### ACH-013
- titulo: DPO
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- commit_executor: c540a74
- arquivos_alterados: docs/DPO.md (novo)
- descricao_correcao: responsabilidades, processo de nomeação, SLA de resposta, contato
- status_revisor: aprovado
- commit_revisor: none
- nota_revisor: template com responsabilidades, SLA resposta ao titular, canal dpo@weavecode.co.uk; nomeação formal pendente ⚠️

### ACH-018
- titulo: Controlador/operador + termos DPA
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- commit_executor: c083f58
- arquivos_alterados: docs/TERMS_OF_SERVICE.md (novo), docs/DPA-TENANT.md (novo)
- descricao_correcao: termos de serviço + anexo DPA controlador/operador
- status_revisor: aprovado
- commit_revisor: none
- nota_revisor: TERMS_OF_SERVICE + DPA-TENANT cobrem partes/papéis/obrigações; validação jurídica marcada ⚠️

### ACH-010
- titulo: Política de retenção
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- commit_executor: 619918f
- arquivos_alterados: docs/DATA_RETENTION_POLICY.md (novo)
- descricao_correcao: matriz por entidade (13 categorias), workers mapping, propagação em backups
- status_revisor: aprovado
- commit_revisor: none
- nota_revisor: matriz por entidade completa com prazo ativo/pós-rescisão/ação/base legal; workers pendentes documentados

### ACH-004
- titulo: Categorias especiais allergies/notes
- severidade: critico
- classificacao: corrigivel_parcial
- status_executor: corrigido
- commit_executor: 2b270f0
- arquivos_alterados: packages/shared/src/sensitive-fields.ts (novo), packages/shared/src/index.ts, docs/SENSITIVE-DATA-HANDLING.md (novo)
- descricao_correcao: SENSITIVE_FIELD_NAMES + isSensitiveField/redactSensitive helpers + doc de handling
- status_revisor: aprovado
- commit_revisor: none
- nota_revisor: registry central + helpers tipados exportados via index.ts; cobertura consistente com sentry-redaction

### ACH-001
- titulo: Endpoints direitos do titular
- severidade: critico
- classificacao: corrigivel_parcial
- status_executor: corrigido
- commit_executor: df93eb2
- arquivos_alterados: apps/api/src/routers/privacy.ts (novo), apps/api/src/trpc/router.ts, docs/PRIVACY-ENDPOINTS.md (novo)
- descricao_correcao: router privacy.* com 4 procedures stub (exportMyData, correctField, requestDeletion, accessLog); Zod inputs; tenantProcedure scoped; retornam not_implemented status
- status_revisor: aprovado
- commit_revisor: none
- nota_revisor: 4 procedures corretamente registradas, tenantProcedure scoped, Zod inputs, retorno tipado not_implemented; log warn para rastreabilidade

### ACH-011
- titulo: Direito ao esquecimento anonimização
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- commit_executor: 63ff751
- arquivos_alterados: packages/business/clients/use-cases/anonymize-client.ts (novo), docs/ANONYMIZATION-POLICY.md (novo)
- descricao_correcao: função stub + buildAnonymizedPlaceholder determinístico + política com estratégia de anonimização + propagação em backup
- status_revisor: aprovado
- commit_revisor: none
- nota_revisor: stub funcional com throw explícito + helper determinístico; convenção de use-case como classe (CLAUDE.md ACH-020 manutenibilidade) ficará para implementação real — doc do código explicita

### ACH-012
- titulo: Marketing consent
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- commit_executor: aff45bb
- arquivos_alterados: packages/db/prisma/migrations/manual/004_marketing_consent.sql (novo), docs/MARKETING-CONSENT.md (novo)
- descricao_correcao: colunas marketingConsent* em Client + índice parcial de opt-in + doc regras operacionais
- status_revisor: aprovado
- commit_revisor: none
- nota_revisor: 4 colunas + índice parcial (WHERE marketingConsent=TRUE); opt-in default FALSE respeita LGPD

### ACH-020
- titulo: AuditLog
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- commit_executor: 3ecdd99
- arquivos_alterados: packages/db/prisma/migrations/manual/005_audit_log.sql (novo), docs/AUDIT-LOG.md (novo)
- descricao_correcao: tabela AuditLog com RLS + 3 índices + doc middleware + esboço de implementação
- status_revisor: aprovado
- commit_revisor: none
- nota_revisor: tabela com actor_id/actor_type/action/resource/diff JSONB + RLS + 3 índices (tempo, resource, actor); alinhada com privacy.accessLog (ACH-001)

### ACH-014
- titulo: Criptografia em repouso
- severidade: alto
- classificacao: corrigivel_parcial
- status_executor: corrigido
- commit_executor: 1d5a30f
- arquivos_alterados: deploy/backup/backup.sh, docs/ENCRYPTION-AT-REST.md (novo)
- descricao_correcao: backup GPG opt-in via BACKUP_GPG_RECIPIENT + doc com 3 níveis de encryption
- status_revisor: aprovado
- commit_revisor: none
- nota_revisor: GPG opt-in preserva dev-friendliness (fallback gzip); doc com 3 níveis (backup/campo/volume) e pendências

### ACH-016
- titulo: Cookie consent
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- commit_executor: a6c6bf0
- arquivos_alterados: apps/web/src/components/cookie-consent-banner.tsx (novo), docs/COOKIES-POLICY.md (novo)
- descricao_correcao: banner accept-all / only-essential com localStorage persist + doc tabela de cookies
- status_revisor: aprovado
- commit_revisor: none
- nota_revisor: banner funcional com SSR guard + localStorage + aria-label; i18n pendente (strings hardcoded) aceitável para parcial

### ACH-017
- titulo: RLS tests (bloqueado por Fase 7)
- severidade: medio
- classificacao: corrigivel_parcial
- status_executor: corrigido
- commit_executor: aaec3d7
- arquivos_alterados: docs/RLS-TESTING-ROADMAP.md (novo)
- descricao_correcao: roadmap com estrutura esperada do teste, tabelas críticas, integração CI — implementação só após Fase 7
- status_revisor: aprovado
- commit_revisor: none
- nota_revisor: roadmap respeita bloqueio "ZERO testes até Fase 7" do CLAUDE.md; estrutura esperada e tabelas críticas documentadas
