---
last_reviewed: 2026-04-23
next_review_due: 2027-04-23
version: 0.1.0-draft
---

# Data Protection Officer — DPO (ACH-013)

LGPD art. 41 recomenda a nomeação de um **Encarregado de Proteção de
Dados** (DPO) e a divulgação pública do canal de contato. GDPR art. 37
obriga para certos casos.

> **⚠️ Validação humana pendente:** nomear formalmente o DPO. Este
> documento é o template da comunicação pública e do processo interno.

## Nome e contato

- **Nome:** ⚠️ a definir
- **Função:** interno / externo ⚠️
- **Email:** dpo@weavecode.co.uk (a configurar no provedor de email)
- **Telefone:** ⚠️ a definir

## Responsabilidades

- Interface entre WeaveCode e titulares de dados.
- Interface entre WeaveCode e ANPD (Autoridade Nacional de Proteção de
  Dados).
- Coordenar resposta a incidentes (ver `docs/INCIDENT_RESPONSE_PRIVACY.md`).
- Revisar anualmente as políticas (`docs/POLICY-REVIEW-PROCESS.md`).
- Assinar DPAs com sub-processadores (`docs/SUB_PROCESSORS.md`).
- Aprovar tratamento de categorias especiais (LGPD art. 5.II).

## Processo de nomeação

1. Avaliar necessidade: interno vs externo (terceirizado). Recomendação
   inicial — DPO-as-a-Service externo (evita conflito de interesse em
   empresa pequena).
2. Definir carta de nomeação (inclui poderes, independência, reporte
   direto à diretoria).
3. Registrar no Contrato Social (se aplicável) e nas políticas públicas.
4. Publicar contato em:
   - `docs/PRIVACY_POLICY.md` seção 13.
   - Rodapé de apps/web (via `<Footer>` global).
   - README.
5. Comunicar clientes existentes por email.

## Disponibilidade

- SLA de primeira resposta: **48h úteis**.
- Canal principal: email (auditável).
- Fallback: formulário público em `/privacy` (ver ACH-001).

## Pendências humanas

1. **Decidir modelo:** interno vs externo.
2. **Nomear** — assinar carta.
3. **Configurar** `dpo@weavecode.co.uk` no provedor de email.
4. **Publicar** contato em política + rodapé.
5. **Treinar** (DPO passa a frequentar reuniões de arquitetura onde
   dados sensíveis são discutidos).
