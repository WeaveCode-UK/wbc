# WBC Platform — Pricing, COGS & Unit Economics

> **Documento interno.** Números finais (R$, USD, margens) dependem de validação humana da equipe de produto/finanças. Os ranges aqui são diretrizes iniciais baseadas na arquitetura atual. Referência da auditoria que motivou este doc: `Auditoria/custos-finops/runs/2026-04-19_21-19-13/achados.md#ACH-008`.

## 1. Planos e diferenciação

| Plano       | Público                                | Alavanca de valor                                                          |
| ----------- | -------------------------------------- | -------------------------------------------------------------------------- |
| `ESSENTIAL` | Consultoras autônomas iniciantes       | CRM básico, mensagens WhatsApp transactional, 1 usuário                    |
| `PRO`       | Consultoras multi-unidade / com agenda | CRM + agenda + campanhas WA marketing + IA generativa + múltiplos usuários |

Schema atual (`packages/db/prisma/schema.prisma`, enum `SubscriptionPlan`) já separa os dois planos. O que **falta** é diferenciar quotas — ver ACH-002.

## 2. Quotas por plano (propostas)

> Ajustar números com base nos custos dos providers e na meta de margem (seção 4).

| Dimensão                                   | ESSENTIAL | PRO                                |
| ------------------------------------------ | --------- | ---------------------------------- |
| Usuários por tenant                        | 1         | 5                                  |
| Clients cadastrados                        | 500       | 5.000                              |
| Mensagens WhatsApp/mês (utility + service) | 500       | 3.000                              |
| Mensagens WhatsApp/mês (marketing)         | 0         | 1.000                              |
| Gerações de IA/mês                         | 30        | 300                                |
| Workspaces                                 | 1         | 3                                  |
| Budget USD de IA/mês                       | US$ 1     | US$ 10                             |
| Retenção de dados                          | 1 ano     | 3 anos (ver DATA_RETENTION_POLICY) |

Status atual (vs este alvo): `aiGenerationsLimit` é constante 30 para ambos os planos — assymetria ACH-002.

## 3. COGS por dimensão (estimativas)

### 3.1. WhatsApp (Meta Cloud API)

Pricing da Meta por categoria e por país (BR):

- **Utility conversation:** ~US$ 0,008 (2026 preços BR).
- **Marketing conversation:** ~US$ 0,04.
- **Service conversation:** gratuita dentro da janela de 24h pós-incoming message.
- **Auth conversation:** ~US$ 0,018.

Para 500 mensagens utility/mês em ESSENTIAL: ~US$ 4,0 de COGS.
Para 3.000 utility + 1.000 marketing em PRO: ~US$ 24,0 + US$ 40,0 = US$ 64,0.

> **ACH-003:** hoje o projeto não rastreia custo WhatsApp por tenant — impossível validar estas estimativas com dados reais.

### 3.2. DeepSeek (IA generativa)

- Preço médio 2026: ~US$ 0,14/1M input tokens, ~US$ 0,28/1M output tokens.
- Prompt médio no WBC (campanha + post IG): ~2k input, ~1k output → US$ 0,00056 por geração.
- 30 gerações/mês = US$ 0,017 → insignificante.
- 300 gerações/mês = US$ 0,168 → ainda barato.
- Risco: prompt poisoning elevar o custo 10-100x — daí a necessidade do `CostBudgetService` (ACH-001).

### 3.3. Infra (VPS + Postgres + Redis)

- VPS small (2 vCPU, 4GB RAM): ~US$ 20/mês.
- Postgres managed (se migrar): ~US$ 15/mês.
- Capacidade: ~50-100 tenants ESSENTIAL ou ~20-30 tenants PRO em uma VPS.
- COGS de infra diluído: US$ 0,20-0,50 por tenant/mês.

### 3.4. Sentry / observabilidade

- Sentry Team: US$ 29/mês, ~50k eventos.
- Com 100 tenants × 500 eventos/mês = 50k — fica no limite.
- ACH-005 (reduzido sampling + filtro de ruído) deve reduzir ~40% do volume.

### 3.5. Mercado Pago (gateway de pagamento)

- Taxa padrão: 3,99% + R$ 0,39 por transação aprovada.
- Não é COGS do WBC — é repasse, cobrado do cliente da consultora.
- Considerar como custo se o WBC oferecer "Mercado Pago absorvido" em algum plano.

## 4. Pricing sugerido e margem

> **Todos os valores abaixo são diretrizes iniciais.** Validação com pesquisa de mercado e com COGS real (pós-ACH-001/003/010) é pré-requisito para lançar.

| Plano     | Preço mensal (R$) | COGS estimado (US$) | Margem bruta alvo |
| --------- | ----------------- | ------------------- | ----------------- |
| ESSENTIAL | R$ 69 (~US$ 13)   | US$ 5,50            | ~57%              |
| PRO       | R$ 199 (~US$ 37)  | US$ 15              | ~60%              |

### Gatilhos de revisão de preço

- COGS WhatsApp > 15% do ticket → renegociar contrato Meta ou aumentar preço.
- COGS IA > 10% do ticket → avaliar modelo mais barato (DeepSeek-V3 reduzido, Llama local).
- Taxa de uso da quota < 30% do plano → reduzir preço ou ajustar limites para baixo.

## 5. Checklist para colocar este doc em produção

- [ ] Validar pricing com pelo menos 10 consultoras-piloto (ESSENTIAL) e 5 piloto (PRO).
- [ ] Implementar `CostBudgetService` (ACH-001) e `TenantCostSnapshot` (ACH-010).
- [ ] Instrumentar WhatsApp billing (ACH-003) para COGS real por tenant.
- [ ] Separar limites no schema por plano (ACH-002).
- [ ] Revisar este doc trimestralmente com base no CostSnapshot agregado.

## Referências

- Achados originais: `Auditoria/custos-finops/runs/2026-04-19_21-19-13/achados.md` (ACH-001, 002, 003, 008, 010)
- COGS diários: `docs/FINOPS-OBSERVABILITY.md` (a ser criado por ACH-004)
- Política de retenção (impacta COGS de storage): `docs/DATA_RETENTION_POLICY.md`
