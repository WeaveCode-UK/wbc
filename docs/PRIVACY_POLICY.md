---
last_reviewed: 2026-04-23
next_review_due: 2027-04-23
reviewers: [dpo, legal]
version: 0.1.0-draft
---

# Política de Privacidade — WBC Platform

> **Atenção:** este documento é um **template técnico** criado como correção
> do achado ACH-002 da auditoria de compliance-privacidade (run
> 2026-04-19_21-00-11). Requer **validação jurídica/DPO** antes de ser
> publicado como política oficial. Seções marcadas com ⚠️ têm conteúdo
> placeholder.

## 1. Quem somos

A **WBC Platform** é operada pela **WeaveCode Ltd** (UK), doravante
"**nós**", "**WeaveCode**" ou "**WBC**". Fornecemos software de CRM
vertical para consultoras de beleza no Brasil.

- Razão social: WeaveCode Ltd
- Sede: Reino Unido ⚠️ (endereço a confirmar)
- Email geral: info@weavecode.co.uk
- Encarregado de Proteção de Dados (DPO): ⚠️ (a nomear — ver
  [docs/DPO.md](./DPO.md))

## 2. A quem esta política se aplica

- **Consultoras** (tenants/Accounts) que contratam a WBC para gerenciar
  suas clientes.
- **Clientes finais** (Clients) cadastrados pelas consultoras dentro da
  WBC.
- **Visitantes** das landing pages públicas (apps/landing).

## 3. Papéis

- **Controlador:** cada **Consultora** é controladora dos dados das suas
  clientes finais (decide finalidade e meios do tratamento).
- **Operador (processor):** a **WeaveCode** é operadora para dados de
  clientes finais — tratamos apenas conforme instruções da consultora.
- **Controladora:** a WeaveCode é **controladora** dos dados das próprias
  consultoras (cadastro, faturamento, comunicação de produto).

## 4. Dados que coletamos

### 4.1. De consultoras (Account / Tenant)

- Identificação: nome, email, telefone, CPF/CNPJ.
- Acesso: credenciais (hash), tokens OAuth, IP e user-agent.
- Financeiros: dados de assinatura (via MercadoPago).

### 4.2. De clientes finais (Client — coletados pela consultora)

- Identificação: nome, email, telefone.
- Preferências e observações (campo `notes` e `preferences`).
- **⚠️ Categorias especiais:** `allergies` (dado de saúde — LGPD art. 5.II)
  quando a consultora o informar. Tratamento requer consentimento reforçado
  e redação em logs (ver [docs/SENSITIVE-DATA-HANDLING.md](./SENSITIVE-DATA-HANDLING.md)).
- Histórico comercial: vendas, lembretes, campanhas recebidas.

### 4.3. De visitantes da landing

- Analytics (se habilitado) — ver [docs/COOKIES-POLICY.md](./COOKIES-POLICY.md).

## 5. Bases legais (LGPD art. 7)

| Finalidade                               | Base legal                             |
| ---------------------------------------- | -------------------------------------- |
| Operar o CRM p/ a consultora             | Execução de contrato (art. 7.V)        |
| Autenticar usuários                      | Execução de contrato (art. 7.V)        |
| Prevenir fraude / segurança              | Legítimo interesse (art. 7.IX)         |
| Comunicações transacionais (WhatsApp)    | Execução de contrato (art. 7.V)        |
| Campanhas de marketing a clientes finais | Consentimento (art. 7.I) — ver ACH-012 |
| Obrigações legais / fiscais              | Cumprimento de obrigação (art. 7.II)   |

## 6. Com quem compartilhamos

Lista completa em [docs/SUB_PROCESSORS.md](./SUB_PROCESSORS.md). Resumo:

- **Infra:** Hostinger (KVM8, VM), CloudFlare (DNS).
- **Observabilidade:** Sentry (USA).
- **Autenticação:** Google OAuth (USA).
- **Comunicação:** WhatsApp Business (Meta, global); Resend (USA — email).
- **Pagamentos:** MercadoPago (Argentina).
- **IA:** DeepSeek (China) — prompts sem PII via política.
- **Controle de código:** GitHub (USA).

## 7. Transferência internacional (LGPD art. 33; GDPR art. 44)

Dados pessoais podem ser transferidos para **USA, UE, Argentina, China**
conforme a tabela em [docs/SUB_PROCESSORS.md](./SUB_PROCESSORS.md).
Safeguards em uso:

- **Standard Contractual Clauses (SCCs)** com cada sub-processador ⚠️
  (a formalizar — ver ACH-005).
- **Redação de PII** antes de enviar a serviços terceiros (Sentry
  `beforeSend`, DeepSeek prompts).
- **Consentimento explícito** do titular durante o onboarding.

## 8. Direitos do titular (LGPD art. 18-22)

Titulares podem:

- **Acessar** seus dados pessoais.
- **Corrigir** dados incompletos, inexatos ou desatualizados.
- **Portar** seus dados em formato legível por máquina.
- **Excluir** ou anonimizar.
- **Revogar consentimento** a qualquer momento.
- **Ser informados** sobre sub-processadores e transferências.

Exercício: entrar em contato com `dpo@weavecode.co.uk` ou, para
consultoras, via endpoint em `/api/trpc/privacy.*` (ver
[docs/PRIVACY-ENDPOINTS.md](./PRIVACY-ENDPOINTS.md)).

Prazo de resposta: **15 dias** (LGPD art. 19).

## 9. Retenção

Ver política completa em [docs/DATA_RETENTION_POLICY.md](./DATA_RETENTION_POLICY.md).
Resumo: dados ficam ativos enquanto a relação contratual estiver em vigor.
Após término, prazos por categoria (fiscais: 5 anos; logs: 90 dias;
sessões: 14 dias; etc.).

## 10. Segurança

- Criptografia **em trânsito** (TLS 1.3).
- Criptografia **em repouso** ⚠️ (em implementação — ver ACH-014 e
  [docs/ENCRYPTION-AT-REST.md](./ENCRYPTION-AT-REST.md)).
- Isolamento **multi-tenant** via Postgres RLS.
- Backup diário com retenção 30 dias (replicação off-site opt-in).
- Auditoria de acessos ⚠️ (em implementação — ver ACH-020 e
  [docs/AUDIT-LOG.md](./AUDIT-LOG.md)).

## 11. Incidentes

Em caso de incidente de segurança envolvendo dados pessoais, seguimos o
runbook [docs/INCIDENT_RESPONSE_PRIVACY.md](./INCIDENT_RESPONSE_PRIVACY.md):
notificação à ANPD em até 2 dias úteis; comunicação aos titulares
afetados; postmortem público em até 2 semanas.

## 12. Alterações desta política

Mudanças materiais são notificadas por email e registradas no changelog
no final deste documento. Última revisão: ver frontmatter.

## 13. Contato

- Geral: info@weavecode.co.uk
- DPO: dpo@weavecode.co.uk ⚠️ (a configurar)
- Site: https://weavecode.co.uk ⚠️ (confirmar)

## Changelog

- **0.1.0-draft** (2026-04-23) — Template inicial criado pela auditoria
  ACH-002. Pendente validação jurídica e preenchimento dos itens ⚠️.
