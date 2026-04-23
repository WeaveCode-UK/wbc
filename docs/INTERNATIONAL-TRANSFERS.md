---
last_reviewed: 2026-04-23
next_review_due: 2027-04-23
reviewers: [dpo, legal]
version: 0.1.0-draft
---

# International Data Transfers — Safeguards (ACH-005)

LGPD art. 33 e GDPR art. 44-49 exigem **safeguards** quando dados pessoais
saem do Brasil / UE para país sem decisão de adequação. Este documento
registra as transferências ativas na WBC Platform e o mecanismo de
safeguard em uso (ou a implementar).

> **⚠️ Validação humana pendente:** DPA / SCC com cada sub-processador
> deve ser formalizado por jurídico. Esta matriz descreve o estado atual
> e o alvo.

## Matriz

| Sub-processador | Destino       | Decisão de adequação?             | Safeguard atual         | Safeguard alvo                    |
| --------------- | ------------- | --------------------------------- | ----------------------- | --------------------------------- |
| Hostinger       | Lituânia (EU) | Sim (EU)                          | DPA padrão              | DPA padrão — OK                   |
| Cloudflare      | USA           | Não                               | ⚠️ nenhum formal        | SCC EU → USA                      |
| Sentry          | USA           | Não                               | `beforeSend` redige PII | SCC + redação (já parcial)        |
| Google OAuth    | USA           | Não                               | Google DPA (auto)       | OK — DPA padrão do provedor       |
| WhatsApp / Meta | USA + global  | Não                               | Meta DPA (auto)         | OK — DPA padrão do provedor       |
| Resend          | USA           | Não                               | ⚠️ nenhum formal        | SCC EU → USA                      |
| MercadoPago     | Argentina     | Argentina é adequada (ANPD lista) | ⚠️ validar lista ANPD   | OK ou SCC conforme lista          |
| DeepSeek        | China         | **Não, crítico**                  | Redação de prompts      | **SCC obrigatório ou substituir** |
| GitHub          | USA           | Não                               | GitHub DPA              | OK                                |
| Anthropic       | USA           | Não                               | Anthropic DPA           | OK                                |

## Definições

- **SCC (Standard Contractual Clauses):** cláusulas contratuais padrão
  da Comissão Europeia / equivalente ANPD. Obrigatórias quando não há
  decisão de adequação e o sub-processador não oferece DPA próprio com
  cláusulas equivalentes.
- **BCR (Binding Corporate Rules):** só aplicável dentro do mesmo grupo
  empresarial.
- **Decisão de adequação ANPD:** lista de países considerados adequados.
  Em 2026, a lista inclui UE (parcial), Reino Unido, Uruguai, Argentina
  (a confirmar).

## Ações obrigatórias antes de operação comercial

1. **Contratar SCC com Cloudflare** (ou validar que os termos atuais já
   incluem).
2. **Contratar SCC com Sentry** (ou validar self-hosted alternative).
3. **Avaliar DeepSeek:**
   - opção A: contratar via intermediário que ofereça SCC;
   - opção B: substituir por Claude (Anthropic USA, mesmo nível mas com
     DPA formal), OpenAI, ou provider em EU.
4. **Contratar SCC com Resend** (ou migrar para provedor EU).
5. **Atualizar tabela após cada mudança** com `last_reviewed` +
   `next_review_due`.

## Redação de PII antes de envio (implementado)

- Sentry: `packages/shared/src/sentry-redaction.ts` (ACH-008).
- DeepSeek: política de prompts proíbe enviar emails, telefones,
  nomes completos, CPF/CNPJ. ⚠️ Implementar sanitizer dedicado antes
  de `POST` para DeepSeek.

## Comunicação ao titular

- No onboarding (ver ACH-019) consultoras consentem **explicitamente** com
  transferência internacional para os países listados.
- `docs/PRIVACY_POLICY.md` seção 7 referencia esta tabela.

## Pendências humanas

1. Fechar SCCs pendentes (4 linhas críticas).
2. Decisão arquitetural sobre DeepSeek (crítico).
3. Implementar sanitizer de prompts p/ DeepSeek
   (`packages/business/ai/adapters/deepseek-adapter.ts`).
4. Popular tabela ANPD de países adequados e revisar anualmente.
