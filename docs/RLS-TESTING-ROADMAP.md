# RLS Testing — Roadmap (ACH-017)

## Contexto

Row-Level Security (RLS) é a **defesa crítica** contra vazamento
cross-tenant. As policies estão em
`packages/db/prisma/migrations/manual/001_rls_policies.sql` e aplicadas
automaticamente pelo `apply_manual_migrations` (ACH-012 infra).

**Problema atual:** não há teste automatizado. Uma regressão no
middleware (`app.current_tenant_id` não setado) pode passar
despercebida.

## Bloqueador: ZERO testes até Fase 7

O `CLAUDE.md` do projeto proíbe testes unitários/integration/E2E até a
Fase 7 (ver `begin/WBC_FASES_E_EPICOS.md` e roadmap
`begin/WBC-Fase7-Testes-Roadmap.md`). Portanto este achado fica em
**seed + roadmap** até a Fase 7 chegar.

Cross-ref: auditoria `testes-qualidade` run 2026-04-19_07-59-20 já
documentou essa restrição para outros achados de teste.

## Roadmap para Fase 7

### Arquivo alvo

`packages/db/__tests__/rls.test.ts`

### Estrutura esperada

```ts
// ESQUEMA — NÃO IMPLEMENTAR ANTES DA FASE 7.
//
// Dois tenants (A, B) — um Client em cada.
// Testes:
//
// 1. Com middleware → A só vê A.clients, B só vê B.clients.
// 2. Sem middleware → query retorna 0 rows (fail-closed).
// 3. Update cruzado → negado (policy bloqueia).
// 4. Delete cruzado → negado.
// 5. Raw SQL com SET LOCAL app.current_tenant_id forjado → negado
//    (sanity — a policy usa current_setting).
//
// Ideal: roda em Postgres ephemeral (dr-drill yaml já monta um) e
// reaproveita helpers de setup/teardown da suite geral.
//
// import { describe, it, expect, beforeAll, afterAll } from 'vitest';
// import { prisma, setTenantContext } from '@wbc/db';
// ...
```

### Integração com CI

- Workflow `.github/workflows/ci.yml` step `test:rls` que roda
  **apenas** após Fase 7 ter testes habilitados.
- Marcar como `required_status_check` em branch protection (ACH-005 infra).

### Tabelas críticas para cobrir

Prioridade descendente:

1. `Client` (contém dados pessoais de clientes finais)
2. `Account` (dados da consultora)
3. `Sale`, `CampaignRecipient`
4. `ConsentLog`, `AuditLog` (novos — ACH-003, ACH-020)
5. `Session`, `OTP` (segurança)
6. Demais tabelas `tenantId`-scoped

### Métricas de cobertura

- Cada tabela com RLS deve ter ≥ 1 teste de isolamento por operação
  (SELECT, INSERT, UPDATE, DELETE).
- Tempo total da suite RLS: alvo < 30s.

## Pendências humanas

1. Aguardar Fase 7 chegar.
2. Confirmar que `vitest` + Postgres ephemeral está configurado.
3. Adicionar entrada em `begin/WBC-Fase7-Testes-Roadmap.md` para este
   achado (se já não existir).
4. Quando for implementar, levantar com jurídico se a suite precisa ser
   parte da evidência de conformidade LGPD art. 50 (programa de boas
   práticas).
