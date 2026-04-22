# Runbook — Incidente em Múltiplos Providers

ACH-017 confiabilidade-resiliencia. Playbook manual enquanto não há agregador central de circuit breakers.

## Quando usar

Circuit breakers de **dois ou mais providers externos** abrem dentro de janela < 5 min. Exemplos:

- WhatsApp + DeepSeek
- WhatsApp + MercadoPago
- Resend + Slack (alerting)

Um único provider fora é tratado pelo runbook específico do provider; este runbook é para coordenação quando vários caem simultaneamente.

## Diagnóstico rápido

1. **Painel Grafana `Resilience`** (quando existir — ver ACH-008 observabilidade-operacao): todos os circuit breakers com estado.
2. **Logs do worker** — grep por `Circuit opened: <provider>` nas últimas 15 min.
3. **Sentry** — eventos agregados por provider.
4. Verificar se a causa é compartilhada (rede interna, DNS, timeout cascata).

## Priorização

Durante incidente múltiplo, escolher qual provider **continuar tentando** e quais **abrir preventivamente**.

### Ordem padrão de prioridade (crítico → descartável)

1. **WhatsApp** — único canal de conversão/cashback. Manter sempre que possível.
2. **MercadoPago** — bloqueia receita. Priorizar após WhatsApp.
3. **DeepSeek** — IA; degradação aceitável (fallback já retorna "[AI indisponível]").
4. **Resend** — email; aceitar falha silenciosa por poucas horas.
5. **Slack webhooks** — alerting; aceitar queda.

### Como abrir circuito preventivamente

Não há endpoint administrativo hoje. Opções:

```bash
# Via env var (requer restart do worker):
kubectl set env deployment/worker DEEPSEEK_CIRCUIT_THRESHOLD=1
# Threshold=1 faz qualquer falha subsequente abrir o circuito.

# Ou aumentar window para que stay-open dure mais:
kubectl set env deployment/worker DEEPSEEK_CIRCUIT_WINDOW_MS=600000
```

## Mitigação

1. Verificar uso de rede/banco — às vezes "múltiplos providers caindo" é sintoma de problema local (pod sem IP egress, DNS, conntrack cheio).
2. Se realmente externo: comunicar stakeholders (produto, suporte) sobre degradação e canais afetados.
3. Aumentar threshold de alerta para evitar fadiga (ver Prometheus `alerts.yml`).
4. Monitorar DLQ: se eventos estão migrando para lá, pausar scanner ou ajustar retry.

## Pós-incidente

- Registrar no post-mortem: qual foi a causa comum, se houve.
- Se o incidente repetir → promover este runbook para feature de agregação central (serviço dedicado que orquestra prioridades).

## Contatos

- Plantão técnico: ver `deploy/RUNBOOKS.md`.
- Status pages dos providers: bookmarks em `docs/LINKS.md` (a criar).
