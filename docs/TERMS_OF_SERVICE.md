---
last_reviewed: 2026-04-23
next_review_due: 2027-04-23
reviewers: [dpo, legal]
version: 0.1.0-draft
---

# Terms of Service — WBC Platform (ACH-018)

> **⚠️ Validação humana pendente:** requer redação final por jurídico.
> Este é um template estrutural.

## 1. Partes

- **Prestadora:** WeaveCode Ltd (UK).
- **Contratante (Consultora):** pessoa física ou jurídica cadastrada
  como Account/Tenant.

## 2. Serviço

CRM multi-tenant para gestão de clientes, vendas, campanhas e
agendamentos. Detalhes técnicos em `docs/ARCHITECTURE.md`.

## 3. Relação LGPD / GDPR

Ver anexo `docs/DPA-TENANT.md` que detalha a relação controlador
(Consultora) ↔ operador (WeaveCode) para dados de clientes finais.

## 4. Obrigações da Consultora

- Obter consentimento adequado dos clientes finais antes de cadastrá-los.
- Publicar política de privacidade própria (template em
  `docs/PRIVACY_POLICY-TEMPLATE-TENANT.md` — a criar).
- Respeitar direitos dos titulares (responder em até 15 dias).
- Não usar a plataforma para fins ilícitos, spam, ou assédio.

## 5. Obrigações da WeaveCode

- Manter a plataforma disponível conforme SLA (ver `docs/SLO.md`).
- Implementar medidas de segurança descritas em
  `docs/PRIVACY_POLICY.md` seção 10.
- Notificar Consultora em caso de incidente.
- Manter sub-processadores atualizados (`docs/SUB_PROCESSORS.md`).
- Respeitar janelas de manutenção com aviso prévio.

## 6. Dados e propriedade

- **Dados das consultoras** (cadastro): pertencem à consultora; pode
  exportar a qualquer momento.
- **Dados de clientes finais**: pertencem aos próprios clientes. A
  consultora é controladora; a WeaveCode é operadora.
- **Dados agregados/estatísticos**: WeaveCode pode usar em forma anônima
  para melhorar o produto.

## 7. Pagamento e cancelamento

⚠️ Escrever condições com jurídico (ciclos, reembolso parcial, etc.).

## 8. Rescisão

- Consultora pode rescindir a qualquer momento; WeaveCode exclui dados
  em até 90 dias após confirmação (ver `docs/DATA_RETENTION_POLICY.md`).
- WeaveCode pode rescindir em caso de descumprimento material, com
  aviso de 30 dias.

## 9. Responsabilidade

⚠️ Cláusulas de limitação de responsabilidade a serem redigidas por
jurídico.

## 10. Foro e lei aplicável

⚠️ Definir — provavelmente UK (por ser sede da controladora) com
sub-cláusula para foro brasileiro para efeitos de LGPD.

## Changelog

- **0.1.0-draft** (2026-04-23) — template gerado pela correção ACH-018.
