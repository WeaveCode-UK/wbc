# Sensitive Data Handling (ACH-004)

## Escopo

Campos que contêm dados de **categorias especiais** (LGPD art. 5.II,
GDPR art. 9) ou identificadores diretos. Registro central em
`packages/shared/src/sensitive-fields.ts`.

## Campos atualmente marcados

- **Saúde:** `allergies`
- **Livre (potencialmente sensível):** `notes`, `preferences`
- **Documentos:** `cpf`, `cnpj`
- **Identificadores:** `phone`, `phoneNumber`, `whatsappNumber`, `email`
- **Secrets:** `password`, `otp`, `token`

## Regras de manuseio

1. **Logs:** usar `redactSensitive(obj)` antes de `console.log` / pino.
   O security-logger (`packages/shared/src/security-logger.ts`) já aplica
   `redactSecurityFields` (ACH-009).
2. **Sentry:** `beforeSend` redige automaticamente via
   `SENSITIVE_KEYS_RE` (`sentry-redaction.ts`, ACH-008).
3. **Prompts IA:** NÃO incluir valores destes campos em prompts para
   DeepSeek / Claude / OpenAI (ACH-005). Use identificadores opacos +
   descrição genérica.
4. **Campanhas / comunicação:** o campo `allergies` é apenas interno da
   consultora. NUNCA expor em mensagens automatizadas.
5. **Export / API público:** ao exportar para o titular (ACH-001), retorna
   todos os campos. Para exportações agregadas ou para terceiros, redigir.

## Consentimento reforçado

Coleta de `allergies` só deve ocorrer com **consentimento específico**
do titular (cross-ref `docs/CONSENT-FRAMEWORK.md` — ACH-003).

## Processo para adicionar novo campo sensível

1. Identificar a natureza (saúde, biométrico, etc.).
2. Adicionar à lista `SENSITIVE_FIELD_NAMES`.
3. Atualizar `sentry-redaction.ts` se o nome for genérico.
4. Atualizar `docs/PRIVACY_POLICY.md` seção 4.
5. Atualizar `docs/DPIA.md` (reavaliar risco).
6. Abrir PR com review obrigatório de DPO (CODEOWNERS).

## Pendências humanas

1. ESLint rule `wbc/no-sensitive-logs` que detecta
   `logger.info({ allergies: ... })` e afins (AST walk). Parcial hoje —
   ESLint padrão não catura.
2. Revisar os outros campos do `Client` no schema.prisma e classificar.
3. Criar teste que valida que nenhum campo sensível é serializado em
   `JSON.stringify` de uma entidade pública (após Fase 7).
