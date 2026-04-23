---
last_reviewed: 2026-04-23
next_review_due: 2027-04-23
reviewers: [dpo, legal]
version: 0.1.0-draft
---

# Sub-processors (ACH-007)

Lista de todos os terceiros que recebem dados pessoais tratados pela WBC
Platform. Obrigatório pela LGPD art. 6.VIII e GDPR art. 28.

> **⚠️ Validação humana pendente:** preencher contrato DPA / SCC com cada
> linha, validar com jurídico, publicar a versão final. Esta lista é
> **draft** baseada na stack técnica real em 2026-04-23.

## Notificação de mudança

Novos sub-processadores ou mudanças de finalidade são comunicados a
Consultoras (tenants) com pelo menos 30 dias de antecedência por email.

## Tabela

| Fornecedor                   | País          | Finalidade                    | Dados processados                | DPA/SCC                   | Local de armazenamento | Contato                |
| ---------------------------- | ------------- | ----------------------------- | -------------------------------- | ------------------------- | ---------------------- | ---------------------- |
| **Hostinger**                | Lituânia (EU) | Hospedagem VM                 | Todos os dados em repouso        | ⚠️ a formalizar           | EU datacenters         | support@hostinger.com  |
| **Cloudflare**               | USA           | DNS / proxy                   | IP + request metadata            | ⚠️ a formalizar           | Global (Anycast)       | privacy@cloudflare.com |
| **Sentry (sentry.io)**       | USA           | Monitoramento de erros        | Stack traces (PII redigido)      | ⚠️ a formalizar           | USA                    | privacy@sentry.io      |
| **Google (OAuth)**           | USA           | Autenticação social           | Email + nome + sub               | Google Workspace DPA      | USA / Global           | gdpr@google.com        |
| **WhatsApp Business (Meta)** | USA / Global  | Comunicação transacional      | Número + mensagens               | Meta DPA                  | Global                 | privacy@meta.com       |
| **Resend**                   | USA           | Envio de emails transacionais | Email + conteúdo                 | ⚠️ a formalizar           | USA                    | support@resend.com     |
| **MercadoPago**              | Argentina     | Pagamentos de assinatura      | Dados de cartão (PCI via MP)     | MP DPA                    | Argentina              | dpo@mercadolibre.com   |
| **DeepSeek**                 | China         | Sugestões de IA               | Prompts (sem PII — ver política) | ⚠️ a avaliar substituição | China                  | —                      |
| **GitHub**                   | USA           | Controle de código + CI       | Código-fonte + metadata dev      | GitHub DPA                | USA                    | dpo@github.com         |
| **Anthropic (Claude API)**   | USA           | IA assistente de dev          | Código-fonte (sob pedido)        | Anthropic DPA             | USA                    | privacy@anthropic.com  |

## Observações

- **Sentry** e **DeepSeek** recebem apenas payloads com PII redigida pelo
  `beforeSend` / prompt policy (ver ACH-008 + código em
  `packages/shared/src/sentry-redaction.ts`).
- **WhatsApp Business** é o canal operacional principal — números e
  mensagens cruzam Meta. Consentimento informado no onboarding é
  obrigatório (ver ACH-019).
- **DeepSeek** (China) é o ponto mais crítico para ANPD — país sem
  decisão de adequação. SCC ou substituição por provedor em região
  adequada é **obrigatório** antes da produção comercial em escala.

## Pendências humanas

1. Formalizar DPA com cada linha marcada ⚠️.
2. Avaliar substituir DeepSeek por provider em região com adequação
   (Claude US, OpenAI US, etc.) ou manter com consentimento explícito +
   SCC.
3. Publicar esta tabela em URL pública (ex: `/legal/sub-processors`).
4. Processo de notificação de mudança (criar workflow que notifica
   consultoras quando este arquivo mudar).
5. Revisar anualmente conforme `docs/POLICY-REVIEW-PROCESS.md`.
