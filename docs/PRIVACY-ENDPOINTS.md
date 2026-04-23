# Privacy Endpoints — `privacy.*` tRPC (ACH-001)

Router em `apps/api/src/routers/privacy.ts`, registrado como `privacy`
no `appRouter`. Implementa os 4 direitos do titular (LGPD art. 18-22,
GDPR art. 15-22).

> **⚠️ Stub atual:** os 4 procedures retornam `{ status: 'not_implemented' }`
> para declarar o contrato e a visibilidade via tipos gerados. Implementação
> completa requer os follow-ups listados abaixo.

## Endpoints

### `privacy.exportMyData` (mutation)

Exporta todos os dados pessoais do caller. Aceita `format: 'json' | 'zip'`.
Resposta final deverá ser um signed URL com TTL curto (ex: 15 min).

**Requisitos para sair de stub:**

- [ ] Aggregator que percorre Account + Client + Sales + Messages (etc.)
      do tenant e materializa JSON por domínio.
- [ ] OTP obrigatório (reuso do OTP framework do auth).
- [ ] Streaming para S3 (ou bucket local) com signed URL.
- [ ] Entrada em AuditLog (ACH-020) com `action: 'privacy.export'`.
- [ ] Rate limit (evitar abuso).

### `privacy.correctField` (mutation)

Corrige um campo específico de uma entidade. Aceita `resource`,
`resourceId`, `field`, `newValue`.

**Requisitos para sair de stub:**

- [ ] Whitelist de campos corrigíveis por recurso (ex: Account.name sim,
      Account.role não).
- [ ] Validação Zod por campo.
- [ ] OTP.
- [ ] Entrada em AuditLog com `before` / `after`.

### `privacy.requestDeletion` (mutation)

Solicita exclusão ou anonimização. Exige `confirmation: 'ERASE_MY_DATA'`
para evitar clique acidental.

**Requisitos para sair de stub:**

- [ ] `anonymizeAccount(id)` worker (cross-ref ACH-011).
- [ ] Propagação em backup via encurtamento de retenção.
- [ ] OTP.
- [ ] Entrada em AuditLog + ConsentLog.
- [ ] Email de confirmação ao titular com 24h de período de "reconsideração"
      antes de disparar a anonimização efetiva.

### `privacy.accessLog` (query)

Retorna quem acessou/alterou dados do caller em um período.

**Requisitos para sair de stub:**

- [ ] Tabela `AuditLog` populada por middleware (ACH-020).
- [ ] Paginação.
- [ ] Filtros por ação, recurso.

## Segurança transversal

Todos os endpoints exigem:

1. `tenantProcedure` — tenant scoping obrigatório.
2. OTP via middleware dedicado (a criar — reuso do framework OTP).
3. AuditLog entry para cada operação.
4. Rate limit — padrão: 5 req/min por tenant.

## Pendências humanas

1. Implementar `AuditLog` (ACH-020).
2. Implementar `ConsentLog` + `anonymizeAccount` (ACH-003 + ACH-011).
3. Criar OTP middleware que os 4 endpoints usam.
4. Documentar SLA de resposta: 15 dias (LGPD art. 19).
5. Integrar com UI (Settings → Privacidade → exportar/corrigir/excluir).
