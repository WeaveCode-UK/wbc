---
last_reviewed: 2026-04-23
next_review_due: 2027-04-23
reviewers: [dpo, legal, ciso]
version: 0.1.0-draft
---

# DPIA / RIPD — Data Protection Impact Assessment (ACH-006)

LGPD art. 38 e GDPR art. 35 exigem avaliação de impacto para tratamento
de **larga escala** ou **dados sensíveis**. A WBC processa dados de
consultoras (milhares de contas previstas) e dados de saúde via campo
`allergies` (Cliente final) — portanto, DPIA é obrigatório.

> **⚠️ Validação humana pendente:** DPO e CISO devem revisar e completar
> este documento antes de publicação. Template preenchido com o que é
> conhecido tecnicamente; decisões de risco e mitigação precisam de
> stakeholders.

## 1. Identificação

- **Organização:** WeaveCode Ltd (UK)
- **Produto:** WBC Platform
- **Responsável pela DPIA:** DPO ⚠️ (a nomear — ver ACH-013)
- **Data:** 2026-04-23 (primeira versão)

## 2. Necessidade da DPIA (art. 35.3 GDPR / art. 38 LGPD)

| Critério                                           | Aplicável?                       |
| -------------------------------------------------- | -------------------------------- |
| Tratamento sistemático de dados sensíveis (saúde)  | **Sim** (allergies)              |
| Perfil / scoring de comportamento                  | Parcial (campanhas VIP)          |
| Monitoramento sistemático em grande escala         | Não atualmente                   |
| Cruzamento de bases                                | Não                              |
| Dados de crianças / vulneráveis                    | Potencialmente (clientes finais) |
| Transferência internacional para país não-adequado | **Sim** (USA/China)              |

## 3. Descrição sistemática do tratamento

- **Fluxo:** Consultora cadastra cliente final → informa dados pessoais
  e eventualmente alergia → sistema armazena em Postgres → usa em
  agendamentos, campanhas e recomendações IA.
- **Categorias:** ver seção 4 de `docs/PRIVACY_POLICY.md`.
- **Finalidades:** ver seção 5 do mesmo arquivo.

## 4. Avaliação de necessidade e proporcionalidade

- **Base legal:** execução de contrato (dados da consultora) +
  consentimento (dados de cliente final, em especial alergia).
- **Minimização:** apenas campos solicitados explicitamente pela
  consultora. Dado sensível fica em tabela com redação automática em logs.
- **Limitação por finalidade:** dados NÃO são usados para fins de
  marketing cruzado sem consentimento novo.
- **Qualidade:** consultora pode corrigir a qualquer momento.
- **Transparência:** política pública (ACH-002) + notificação de
  transferência (ACH-019).

## 5. Riscos e mitigações

| Risco                         | Probabilidade | Impacto | Mitigação (implementada)                                 | Mitigação (pendente)                         |
| ----------------------------- | ------------- | ------- | -------------------------------------------------------- | -------------------------------------------- |
| Vazamento de alergia via logs | Baixa         | Alto    | Redação via `redactSecurityFields` + Sentry `beforeSend` | ESLint rule (ACH-009)                        |
| RLS regressão → cross-tenant  | Baixa         | Crítico | RLS em prod; testes manuais                              | Suite automatizada (ACH-017)                 |
| Exposição em backup em disco  | Média         | Alto    | Backup local com retenção 30d                            | Criptografia (ACH-014), off-site (ACH-003)   |
| PII em Sentry (USA)           | Média         | Médio   | `beforeSend` estrito (ACH-008)                           | SCC (ACH-005)                                |
| Prompt DeepSeek com PII       | Média         | Alto    | Política de prompt                                       | Sanitizer automático (ACH-005)               |
| Exclusão incompleta (backup)  | Média         | Alto    | Soft-delete                                              | Anonimização (ACH-011), propagação em backup |
| Consentimento insuficiente    | Alta atual    | Alto    | —                                                        | ConsentLog (ACH-003)                         |

## 6. Conclusão e plano de ação

O tratamento é **aceitável com mitigações previstas** (todas listadas
na run 2026-04-19_21-00-11). Enquanto os itens "pendentes" não forem
concluídos, operação comercial em escala **não é recomendada**.

**Próximas revisões:** anual ou a cada mudança material (ver
`docs/POLICY-REVIEW-PROCESS.md`).

## Pendências humanas

1. Nomear DPO e responsabilizar-se formalmente (ACH-013).
2. Preencher as colunas "probabilidade" / "impacto" em workshop com DPO
   - CISO + eng-sênior.
3. Definir níveis aceitáveis de risco residual.
4. Planejar drill de incidente (ver ACH-015).
