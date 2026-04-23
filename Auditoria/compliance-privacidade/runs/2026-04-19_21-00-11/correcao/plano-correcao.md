# Plano de Correção

## Identificação
- dominio: compliance-privacidade
- run_id: 2026-04-19_21-00-11
- data_geracao: 2026-04-23 04:40:00
- total_achados: 22
- corrigiveis: 3
- corrigiveis_parciais: 19
- nao_corrigiveis: 0

## Observação
Domínio altamente regulatório. Grande parte dos achados requer **validação
jurídica/DPO** para conteúdo completo. A correção entrega:
- **Código funcional** onde possível (redaction de logs, Sentry beforeSend,
  seed de modelos Prisma, endpoints tRPC stub).
- **Docs template** com seção "validação humana pendente" para cada
  política/processo que precisa de DPO/jurídico.

## Ordem de Execução

Agrupada por área: (1) logs/redação (impacto imediato), (2) schemas +
endpoints privacy, (3) policies/docs, (4) UX (onboarding, footers).

### 1. ACH-008 — Sentry beforeSend
- severidade: alto
- classificacao: corrigivel
- arquivo: apps/web/sentry.*.config.ts, apps/api/src/lib/sentry.ts
- acao: beforeSend + beforeBreadcrumb com redação de authorization/password/token, email, telefone
- risco: baixo

### 2. ACH-009 — Log redaction
- severidade: alto
- classificacao: corrigivel
- arquivo: packages/shared/src/redaction.ts (já existe?), packages/shared/src/security-logger.ts, apps/api/src/trpc/logging-middleware.ts
- acao: helper maskPhone/maskEmail/truncId centralizado; aplicado nos loggers
- risco: baixo

### 3. ACH-015 — Incident response runbook
- severidade: alto
- classificacao: corrigivel
- arquivo: docs/INCIDENT_RESPONSE_PRIVACY.md (novo)
- acao: runbook com fluxograma detecção→contenção→notificação ANPD (2 dias) → comunicação titulares
- risco: baixo

### 4. ACH-022 — Link "Direitos do Titular" em forms
- severidade: baixo
- classificacao: corrigivel
- arquivo: apps/web/src/components/form-field.tsx (footer opcional), apps/web/src/app/(auth)/onboarding/page.tsx
- acao: texto "Conheça seus direitos" linkando para /privacy-policy (a rota é stub)
- risco: baixo

### 5. ACH-021 — Processo de revisão de políticas
- severidade: baixo
- classificacao: corrigivel
- arquivo: docs/POLICY-REVIEW-PROCESS.md (novo)
- acao: cadência anual, checklist, responsáveis
- risco: baixo

### 6. ACH-002 — Política de privacidade (parcial)
- severidade: critico
- classificacao: corrigivel_parcial
- arquivo: docs/PRIVACY_POLICY.md (novo), docs/PRIVACY_POLICY-EN.md (novo), apps/web/src/app/privacy-policy/page.tsx (novo)
- acao: template LGPD/GDPR em PT+EN com seções "validação DPO pendente"; página pública linkando
- risco: baixo

### 7. ACH-003 — Mecanismo de consentimento (parcial)
- severidade: critico
- classificacao: corrigivel_parcial
- arquivo: packages/db/prisma/migrations/manual/003_consent_log.sql (novo); docs/CONSENT-FRAMEWORK.md; apps/web/src/app/(auth)/onboarding/page.tsx (checkbox)
- acao: migration para tabela ConsentLog; doc da semântica; checkbox explícito no onboarding
- risco: baixo (migration manual adicionada via ACH-012 infra)

### 8. ACH-019 — Aviso de transferência internacional
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo: apps/web/src/app/(auth)/onboarding/page.tsx
- acao: step informativo citando Sentry/DeepSeek/Meta/etc.; checkbox consentindo com transferência
- risco: baixo

### 9. ACH-005 — Transferência internacional / SCCs (parcial)
- severidade: critico
- classificacao: corrigivel_parcial
- arquivo: docs/SUB_PROCESSORS.md (novo), docs/INTERNATIONAL-TRANSFERS.md (novo)
- acao: tabela com fornecedor / país / finalidade / DPA/SCC / local de armazenamento; plano de implementação
- risco: baixo

### 10. ACH-007 — Sub-processadores / DPAs
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo: docs/SUB_PROCESSORS.md (compartilhado com ACH-005)
- acao: lista completa + contato DPA + política de notificação de mudança
- risco: baixo

### 11. ACH-006 — DPIA/RIPD
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo: docs/DPIA.md (novo)
- acao: template com inventário, bases legais, riscos, mitigações, revisões
- risco: baixo

### 12. ACH-013 — DPO (encarregado)
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo: docs/DPO.md (novo); atualizar PRIVACY_POLICY e README
- acao: seção Data Protection Officer com placeholder + processo de nomeação
- risco: baixo

### 13. ACH-018 — Papel controlador/operador + TERMOS (parcial)
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo: docs/TERMS_OF_SERVICE.md (novo), docs/DPA-TENANT.md (novo)
- acao: termos com DPA para tenant; template que consultora pode publicar
- risco: baixo

### 14. ACH-010 — Política de retenção
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo: docs/DATA_RETENTION_POLICY.md (novo) — atualizar docs/RETENTION.md existente se houver
- acao: política por entidade, janelas, responsável
- risco: baixo

### 15. ACH-004 — Categorias especiais (allergies/notes)
- severidade: critico
- classificacao: corrigivel_parcial
- arquivo: packages/db/prisma/schema.prisma (comentar campo SENSITIVE), packages/shared/src/sensitive-fields.ts (novo), docs/SENSITIVE-DATA-HANDLING.md (novo)
- acao: marcação SENSITIVE via lista central; helper de redação em logs; doc do tratamento
- risco: baixo

### 16. ACH-001 — Endpoints direitos do titular
- severidade: critico
- classificacao: corrigivel_parcial
- arquivo: apps/api/src/routers/privacy.ts (novo stub), docs/PRIVACY-ENDPOINTS.md (novo)
- acao: router tRPC stub com 4 procedures (exportMyData, correctField, requestDeletion, accessLog) + TODOs; doc de semântica OTP/AuditLog
- risco: baixo (stub)

### 17. ACH-011 — Direito ao esquecimento / anonimização
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo: packages/business/clients/use-cases/anonymize-client.ts (novo stub), docs/ANONYMIZATION-POLICY.md (novo)
- acao: função anonymizeClient(id) com comentários TODO; política de propagação em backups
- risco: baixo

### 18. ACH-012 — Marketing consent
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo: packages/db/prisma/migrations/manual/004_marketing_consent.sql (novo); docs/MARKETING-CONSENT.md (novo)
- acao: migration adicionando marketingConsent/marketingConsentSource/marketingRevokedAt; doc de opt-out; bloqueio conceitual em Campaign.send
- risco: baixo

### 19. ACH-020 — AuditLog
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo: packages/db/prisma/migrations/manual/005_audit_log.sql (novo); packages/business/audit/ (novo stub); docs/AUDIT-LOG.md (novo)
- acao: modelo AuditLog + helper writeAuditEntry; doc de semântica
- risco: baixo

### 20. ACH-014 — Criptografia em repouso
- severidade: alto
- classificacao: corrigivel_parcial
- arquivo: deploy/backup/backup.sh (adicionar GPG opt-in), docs/ENCRYPTION-AT-REST.md (novo)
- acao: backup opcional em GPG via BACKUP_GPG_RECIPIENT; doc do estado atual + plano (LUKS/pgcrypto)
- risco: baixo

### 21. ACH-016 — Cookie consent
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo: apps/web/src/components/cookie-consent-banner.tsx (novo stub), docs/COOKIES-POLICY.md (novo)
- acao: banner minimal (accept/reject) + helper preferencesStore em localStorage
- risco: baixo

### 22. ACH-017 — RLS tests
- severidade: medio
- classificacao: corrigivel_parcial
- arquivo: docs/RLS-TESTING-ROADMAP.md (novo), packages/db/prisma/tests/rls.test.ts (seed, após Fase 7)
- acao: doc de roadmap (CLAUDE.md proíbe testes até Fase 7); template de teste comentado
- risco: baixo

## Resumo do Plano
- Total a corrigir: 22 (3 corrigíveis + 19 parciais)
- Parcial: 19 — todos com doc de follow-up
- Não corrigível: 0
- Estimativa de commits: 22 (executor)
