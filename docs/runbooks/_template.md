# Runbook — <AlertName>

ACH-015 observabilidade-operacao. Template obrigatório para cada alerta em `deploy/alerts.yml`.

## Trigger

- Alerta: `<AlertName>`
- Expressão: `<Prometheus expression>`
- Severidade: `warning | critical`
- Janela: `<for: Xm>`

## Diagnóstico

Passos para investigar assim que o alerta dispara:

1. Abrir painel <dashboard name> em Grafana.
2. Checar métricas correlatas: <lista>.
3. Olhar logs recentes do serviço afetado (Loki/CloudWatch): `<query>`.
4. Verificar deploy recente: `git log origin/main --since='30 min'`.

## Mitigação rápida

Ações para estabilizar em minutos:

1. <ação 1>
2. <ação 2>

## Rollback

Se o problema for pós-deploy:

- Identificar commit/tag anterior estável.
- `docker compose -f docker-compose.prod.yml pull && docker compose ... up -d <serviço>:<tag>`
- Notificar stakeholders no #wbc-alerts.

## Pós-incidente

- Registrar no post-mortem (docs/postmortems/YYYY-MM-DD-<slug>.md).
- Adicionar teste/alerta que teria detectado mais cedo.
- Revisar se este runbook precisa ser atualizado com o que foi aprendido.
