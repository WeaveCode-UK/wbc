# Anonymization Policy (ACH-011)

LGPD art. 18.IV garante o **direito ao esquecimento**. Para operadores
(WBC é operador dos clientes finais de consultoras), isso significa
atender ao pedido da consultora/titular em até 15 dias.

## Estratégia: anonimização irreversível (não hard-delete)

Não deletamos registros fisicamente porque:

- `Sale` e outras tabelas têm FK para `Client` — deletar quebra
  integridade referencial.
- Obrigações fiscais exigem manter histórico de transações por 5 anos
  (ver `docs/DATA_RETENTION_POLICY.md`).

Em vez disso, anonimizamos:

- `name`, `email`, `phone` → placeholder opaco derivado do `id`.
- `notes`, `preferences`, `allergies` → `null`.
- `anonymizedAt` → timestamp agora.

O placeholder é **determinístico** (`anon-${id.slice(0, 8)}`) para manter
uniqueness constraints sem precisar de UUID novo.

## Propagação para backups

Backups contêm snapshots de estados antigos. Opções:

1. **Encurtar retenção** pós-anonimização (aceita que dado fica em backup
   por até 30-90 dias). Escolha default.
2. **Criptografia com chave por tenant** — destruir a chave após
   anonimização torna os backups daquele tenant ilegíveis. Cross-ref
   ACH-014.
3. **Reescrever backups** — custoso, geralmente inviável em S3 com
   versioning. Evitar.

Política atual: opção 1 (encurtar via lifecycle do bucket off-site).

## Workflow técnico (a implementar)

1. `privacy.requestDeletion` (ACH-001) recebe confirmação `ERASE_MY_DATA`.
2. Dispara evento `account.anonymization_requested` no outbox.
3. Worker `anonymization-processor`:
   - Chama `anonymizeAccount(tenantId)` — itera por Account, Clients,
     Sessions, etc.
   - Usa `buildAnonymizedPlaceholder(id)` de
     `packages/business/clients/use-cases/anonymize-client.ts`.
   - Escreve em `AuditLog` (ACH-020) com `action: 'anonymize'`.
   - Marca `anonymizedAt`.
   - Envia email final ao titular confirmando o processo.
4. Em 24h, o backup off-site mais recente já contém a versão anonimizada.
   Backups anteriores aguardam lifecycle para expirar.

## Pendências humanas

1. **Prisma migration:** adicionar `anonymizedAt: DateTime?` em `Client`,
   `Account`, `Session` (entidades com dados pessoais).
2. **Implementar** `ClientRepository.anonymize(...)` e remover o `throw`
   no `anonymizeClient.ts`.
3. **Worker** `anonymization-processor` em `apps/worker/src/processors/`.
4. **Email de confirmação** ao titular.
5. **Entrada no `AuditLog`** por entidade anonimizada.
6. **Testes** (após Fase 7) — validar que campos sensíveis são limpos e
   placeholders respeitam uniqueness.
7. **Monitorar** tempo médio de processamento (SLA LGPD: 15 dias).
