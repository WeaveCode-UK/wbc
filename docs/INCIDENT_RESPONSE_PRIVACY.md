# Privacy Incident Response — Runbook (ACH-015)

Runbook obrigatório quando houver suspeita ou confirmação de **incidente de
segurança envolvendo dados pessoais**. LGPD art. 48 exige comunicação à ANPD
e, se aplicável, aos titulares. GDPR art. 33-34 exige notificação em até 72h.

**Validação humana pendente:** DPO / jurídico deve validar este runbook,
definir papéis (CISO, DPO, jurídico, suporte), e fazer drill anual.

## Matriz de severidade

| Severidade  | Critério                                                                         | Prazo ANPD       |
| ----------- | -------------------------------------------------------------------------------- | ---------------- |
| **Crítico** | Exposição de dados sensíveis (saúde/alergias) ou 1000+ titulares ou PII em clear | ≤ 2 dias úteis   |
| **Alto**    | Exposição < 1000 titulares ou dados de identificação (CPF/email+telefone)        | ≤ 2 dias úteis   |
| **Médio**   | Exposição contida (ex: credencial vazada + revogada em < 1h sem uso)             | avaliar ANPD     |
| **Baixo**   | Near-miss (vulnerabilidade descoberta sem evidência de exploração)               | registro interno |

## Fases

### 1. Detecção (0-15 min)

- **Canais:** Sentry alert, Grafana, relato de cliente, relato externo
  (pesquisador), logs de rotina.
- Abrir incidente em `/incidents/YYYYMMDD-HHMM-slug.md` (criar template).
- Notificar `dpo@weavecode.co.uk` + CISO + engenheiro on-call.

### 2. Contenção (15-60 min)

- Revogar credenciais expostas.
- Desabilitar feature/rota que causa vazamento.
- Snapshot de logs e bancos relevantes para forense.
- **Não apagar evidências** (mesmo que pareçam embaraçosas).

### 3. Avaliação (1-4 h)

- Identificar:
  - Volume de titulares afetados.
  - Categorias de dados (identificação, sensíveis, financeiros).
  - Janela temporal de exposição.
  - Provável causa raiz.
- Decidir severidade (matriz acima).
- Acionar DPO formalmente.

### 4. Notificação (≤ 2 dias úteis ANPD; prazo titulares definido por DPO)

#### 4.1. ANPD

- Portal ANPD: https://www.gov.br/anpd/pt-br
- Usar template `docs/templates/anpd-incident-notification.md` (ainda a criar).
- Incluir: descrição, dados envolvidos, volume, medidas de mitigação,
  riscos e recomendações aos titulares.

#### 4.2. Titulares

- Por canal mais direto: email para Account / Client; WhatsApp quando
  apropriado e consentido.
- Linguagem clara, sem jargão, em PT-BR (e EN se houver titular EU).
- Indicar passos que o titular pode tomar (trocar senha, revisar atividade).

#### 4.3. Sub-processadores

- Se o incidente envolve fornecedor (Sentry, Mercado Pago, etc.),
  acionar DPA do respectivo contrato para obrigações contratuais.

### 5. Remediação (paralelo à fase 4)

- Implementar fix.
- Push hotfix com branch nomeada `hotfix/incident-YYYYMMDD-<slug>`.
- Code review obrigatório (CODEOWNERS).
- Deploy via `./deploy/deploy.sh update` (inclui `wait_for_ready` + markers).

### 6. Pós-morte (≤ 2 semanas)

- Documento em `docs/incidents/YYYYMMDD-<slug>.md` com:
  - Timeline factual.
  - Causa raiz (técnica + organizacional).
  - Ações preventivas (process + code).
  - Métricas de resposta (MTTD, MTTR).
- Review público ou restrito conforme impacto.

## Comunicação

| Canal                      | Quem usa         | Quando                     |
| -------------------------- | ---------------- | -------------------------- |
| #incident-war-room (Slack) | DPO + eng + CISO | durante o incidente        |
| email @ dpo@               | externos         | contato formal             |
| Status page                | público          | se afetar uso por clientes |
| Postmortem Github issue    | time interno     | após a fase 6              |

## Métricas de sucesso (drill anual)

- MTTD (detecção): ≤ 15 min para incidentes com alerting.
- MTTR (contenção): ≤ 1 h para crítico.
- Notificação ANPD: enviada em ≤ 36 h (margem vs 2 dias úteis).
- Pós-morte publicado: ≤ 2 semanas pós resolução.

## Pendências humanas

1. Criar templates `docs/templates/anpd-incident-notification.md` e
   `docs/templates/user-breach-notification-{pt,en}.md`.
2. Definir nominalmente DPO (ver ACH-013).
3. Agendar drill anual (primeiro trimestre).
4. Integrar "Criar Incident" como runbook executável no Slack/PagerDuty.
5. Registrar histórico de incidentes em `docs/incidents/INDEX.md`.
