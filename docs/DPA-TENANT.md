---
last_reviewed: 2026-04-23
next_review_due: 2027-04-23
reviewers: [dpo, legal]
version: 0.1.0-draft
---

# Data Processing Agreement — Tenant (ACH-018)

Anexo ao `docs/TERMS_OF_SERVICE.md`. Define a relação entre **Consultora
(Controlador)** e **WeaveCode (Operador)** para tratamento dos dados de
**clientes finais**.

> **⚠️ Validação humana pendente:** redação final por jurídico.

## 1. Objeto

WeaveCode trata dados de clientes finais exclusivamente para executar as
instruções da Consultora. WeaveCode não usa esses dados para fins
próprios exceto dados agregados/anônimos.

## 2. Duração

Enquanto vigente o contrato principal (Terms of Service).

## 3. Natureza e finalidade do tratamento

- Armazenamento, consulta, envio de mensagens (WhatsApp/email),
  processamento de vendas, agendamentos, recomendações IA.

## 4. Dados e titulares

- **Titulares:** clientes finais da Consultora.
- **Categorias:** identificação (nome, email, telefone), preferências,
  histórico comercial, alergias (sensível — LGPD art. 5.II).

## 5. Obrigações do Operador (WeaveCode)

- Tratar dados só sob instruções documentadas da Consultora.
- Garantir confidencialidade das pessoas autorizadas.
- Implementar medidas de segurança (art. 32 GDPR / art. 46 LGPD).
- Auxiliar Consultora com solicitações de titulares (endpoints em
  `/api/trpc/privacy.*` — ACH-001).
- Auxiliar com DPIA e notificação de incidentes.
- Apagar ou devolver dados no fim do contrato (ver política de retenção).
- Disponibilizar informações necessárias para demonstrar conformidade.
- Permitir auditorias (com aviso prévio).
- Informar imediatamente se uma instrução violar LGPD/GDPR.

## 6. Sub-processadores

WeaveCode usa sub-processadores listados em `docs/SUB_PROCESSORS.md`.
Consultora autoriza os atuais e será notificada 30 dias antes de
mudanças.

## 7. Transferências internacionais

Ver `docs/INTERNATIONAL-TRANSFERS.md`. Consultora confirma ciência e
consentimento com as transferências listadas.

## 8. Incidentes

WeaveCode notifica Consultora em até 24h após detecção de incidente que
afete dados dos clientes finais dessa Consultora. Runbook em
`docs/INCIDENT_RESPONSE_PRIVACY.md`.

## 9. Auditoria

Consultora pode solicitar auditoria com 30 dias de antecedência, custos
razoáveis a cargo do solicitante, sujeito a acordo de confidencialidade.

## 10. Rescisão

WeaveCode exclui (anonimização irreversível) os dados em até 90 dias
após fim do contrato, exceto se obrigação legal exigir retenção
(ver `docs/DATA_RETENTION_POLICY.md`).
